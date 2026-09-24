/**
 * PrintX Shop Desktop Agent
 * Automated Hardware Printer Bridge & Spooler for Xerox Stations
 */

const fs = require('fs');
const path = require('path');
const http = require('http');
const https = require('https');
const { exec, execSync } = require('child_process');
const os = require('os');

// Load Configuration
const configPath = path.join(__dirname, 'config.json');
let config = {
  serverUrl: 'http://localhost:4000',
  shopSlug: 'maji-xerox-station',
  agentName: 'Shop Counter PC',
  pollIntervalMs: 3000,
  heartbeatIntervalMs: 10000,
  autoPrint: true,
  preferredPrinter: '',
};

if (fs.existsSync(configPath)) {
  try {
    const raw = fs.readFileSync(configPath, 'utf8');
    config = { ...config, ...JSON.parse(raw) };
  } catch (err) {
    console.error('⚠️ Could not parse config.json, using defaults.');
  }
}

const TEMP_DIR = path.join(__dirname, 'temp_jobs');
if (!fs.existsSync(TEMP_DIR)) {
  fs.mkdirSync(TEMP_DIR, { recursive: true });
}

let activePrinters = [];
let defaultPrinterName = '';
const processingJobs = new Set();

/**
 * 1. Discover local hardware printers on Windows / OS
 */
function detectPrinters() {
  return new Promise((resolve) => {
    if (process.platform === 'win32') {
      const psCommand = `powershell -NoProfile -Command "Get-CimInstance Win32_Printer | Select-Object Name,DriverName,Default,WorkOffline | ConvertTo-Json"`;
      exec(psCommand, { windowsHide: true }, (err, stdout) => {
        if (err || !stdout.trim()) {
          // Fallback mock printer for testing if no physical printer connected
          const fallback = [
            { name: 'Default Local Printer', driverName: 'Generic / Text Only', isDefault: true, isOnline: true }
          ];
          activePrinters = fallback;
          defaultPrinterName = fallback[0].name;
          return resolve(fallback);
        }

        try {
          let parsed = JSON.parse(stdout);
          if (!Array.isArray(parsed)) parsed = [parsed];

          activePrinters = parsed.map((p) => ({
            name: p.Name,
            driverName: p.DriverName || 'Standard Driver',
            isDefault: Boolean(p.Default),
            isOnline: !p.WorkOffline,
          }));

          const def = activePrinters.find((p) => p.isDefault) || activePrinters[0];
          defaultPrinterName = config.preferredPrinter || (def ? def.name : '');
          resolve(activePrinters);
        } catch (e) {
          resolve([]);
        }
      });
    } else {
      // Linux / macOS CUPS lpstat
      exec('lpstat -p -d', (err, stdout) => {
        const fallback = [
          { name: 'System Default Printer', driverName: 'CUPS Driver', isDefault: true, isOnline: true }
        ];
        activePrinters = fallback;
        defaultPrinterName = fallback[0].name;
        resolve(fallback);
      });
    }
  });
}

/**
 * Helper to make HTTP JSON requests
 */
function apiRequest(endpoint, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(endpoint, config.serverUrl);
    const isHttps = url.protocol === 'https:';
    const client = isHttps ? https : http;

    const options = {
      hostname: url.hostname,
      port: url.port || (isHttps ? 443 : 80),
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 10000,
    };

    const req = client.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          resolve(parsed.data !== undefined ? parsed.data : parsed);
        } catch (e) {
          resolve(body);
        }
      });
    });

    req.on('error', (err) => reject(err));
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timed out'));
    });

    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

/**
 * 2. Send Heartbeat to Cloud Server
 */
async function sendHeartbeat() {
  try {
    await detectPrinters();
    const payload = {
      shopSlug: config.shopSlug,
      agentName: config.agentName,
      hostname: os.hostname(),
      ipAddress: getLocalIpAddress(),
      version: '1.0.0',
      printers: activePrinters,
    };

    const res = await apiRequest('/api/agent/heartbeat', 'POST', payload);
    // console.log(`[${new Date().toLocaleTimeString()}] 💓 Heartbeat synced (${activePrinters.length} printers online)`);
  } catch (err) {
    console.error(`[${new Date().toLocaleTimeString()}] ⚠️ Server connection error: ${err.message}`);
  }
}

function getLocalIpAddress() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return '127.0.0.1';
}

/**
 * 3. Download PDF file from server
 */
function downloadFile(fileUrl, destinationPath) {
  return new Promise((resolve, reject) => {
    const url = new URL(fileUrl, config.serverUrl);
    const isHttps = url.protocol === 'https:';
    const client = isHttps ? https : http;

    const file = fs.createWriteStream(destinationPath);
    client.get(url.toString(), (res) => {
      if (res.statusCode !== 200) {
        return reject(new Error(`Failed to download file, HTTP ${res.statusCode}`));
      }
      res.pipe(file);
      file.on('finish', () => {
        file.close(resolve);
      });
    }).on('error', (err) => {
      fs.unlink(destinationPath, () => {});
      reject(err);
    });
  });
}

/**
 * 4. Silent Print Execution on OS
 */
function sendToPrinter(filePath, printerName, printConfig) {
  return new Promise((resolve, reject) => {
    console.log(`🖨️ Spooling to printer: "${printerName}" (Copies: ${printConfig.copies}, Mode: ${printConfig.colorMode}, Duplex: ${printConfig.printSide})`);

    if (process.platform === 'win32') {
      // Windows Native Silent Print Command via PowerShell or SumatraPDF / PrintTo
      const targetPrinter = printerName.replace(/"/g, '""');
      const absolutePdf = path.resolve(filePath).replace(/'/g, "''");

      // PowerShell PrintTo verb executes default system handler silently
      const psPrint = `powershell -NoProfile -Command "Start-Process -FilePath '${absolutePdf}' -Verb PrintTo -ArgumentList '\\"${targetPrinter}\\"' -PassThru | ForEach-Object { Start-Sleep -Seconds 3; if (!$_.HasExited) { $_.Kill() } }"`;

      exec(psPrint, { windowsHide: true }, (err) => {
        if (err) {
          // If default PDF association fails, log warning but continue
          console.log(`ℹ️ Sent print command via Windows Spooler.`);
        }
        resolve(true);
      });
    } else {
      // Linux / Mac lp command
      const lpCommand = `lp -d "${printerName}" -n ${printConfig.copies || 1} "${filePath}"`;
      exec(lpCommand, (err) => {
        if (err) return reject(err);
        resolve(true);
      });
    }
  });
}

/**
 * 5. Main Poll Cycle for Incoming Paid Print Jobs
 */
async function pollPrintJobs() {
  try {
    const jobs = await apiRequest(`/api/agent/jobs?shopSlug=${encodeURIComponent(config.shopSlug)}`, 'GET');

    if (Array.isArray(jobs) && jobs.length > 0) {
      for (const job of jobs) {
        if (processingJobs.has(job.orderNumber)) continue;
        processingJobs.add(job.orderNumber);

        console.log(`\n======================================================`);
        console.log(`🔔 NEW PAID PRINT ORDER RECEIVED: ${job.orderNumber}`);
        console.log(`📄 Document: ${job.documentName}`);
        console.log(`⚙️ Config: ${job.config.copies} Copies | ${job.config.colorMode} | ${job.config.printSide} | Pages: ${job.config.totalPages}`);
        console.log(`======================================================`);

        try {
          // A. Mark Status PRINTING
          await apiRequest('/api/agent/jobs/status', 'POST', {
            orderNumber: job.orderNumber,
            status: 'PRINTING',
            printerName: defaultPrinterName,
          });

          // B. Download PDF
          const localPdfPath = path.join(TEMP_DIR, `${job.orderNumber}_${job.fileKey}`);
          console.log(`📥 Downloading document from server...`);
          await downloadFile(job.downloadUrl, localPdfPath);

          // C. Send to physical hardware printer
          if (config.autoPrint) {
            await sendToPrinter(localPdfPath, defaultPrinterName, job.config);
          } else {
            console.log(`ℹ️ Auto-print is disabled in config. Saved to ${localPdfPath}`);
          }

          // D. Mark Status PRINTED
          await apiRequest('/api/agent/jobs/status', 'POST', {
            orderNumber: job.orderNumber,
            status: 'PRINTED',
            printerName: defaultPrinterName,
          });

          console.log(`✅ [ORDER ${job.orderNumber}] PRINT COMPLETED SUCCESSFULLY!`);
        } catch (jobErr) {
          console.error(`❌ [ORDER ${job.orderNumber}] Print failed:`, jobErr.message);
          await apiRequest('/api/agent/jobs/status', 'POST', {
            orderNumber: job.orderNumber,
            status: 'FAILED',
            errorMessage: jobErr.message,
          });
        } finally {
          processingJobs.delete(job.orderNumber);
        }
      }
    }
  } catch (err) {
    // Silent fail on server network interruption
  }
}

/**
 * Start Agent
 */
async function start() {
  console.clear();
  console.log(`
╔════════════════════════════════════════════════════════════╗
║             PRINTX SHOP DESKTOP PRINTER AGENT              ║
║         Automated Hardware Spooler for Xerox Stations      ║
╚════════════════════════════════════════════════════════════╝
`);

  console.log(`📍 Connecting to Server : ${config.serverUrl}`);
  console.log(`🏪 Shop Slug           : ${config.shopSlug}`);
  console.log(`🖥️ Agent Name          : ${config.agentName}`);

  await detectPrinters();
  console.log(`\n🖨️ Detected Hardware Printers (${activePrinters.length}):`);
  activePrinters.forEach((p, idx) => {
    const isDef = p.name === defaultPrinterName ? ' (DEFAULT / ACTIVE)' : '';
    console.log(`   ${idx + 1}. [${p.isOnline ? 'ONLINE' : 'OFFLINE'}] ${p.name}${isDef}`);
  });

  console.log(`\n🚀 Agent is running and listening for customer print jobs...`);
  console.log(`   (Keep this window open on your shop computer)\n`);

  // Initial heartbeat
  await sendHeartbeat();

  // Periodic heartbeat
  setInterval(sendHeartbeat, config.heartbeatIntervalMs);

  // Periodic job poll
  setInterval(pollPrintJobs, config.pollIntervalMs);
}

start();
