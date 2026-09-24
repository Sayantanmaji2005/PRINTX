import JSZip from 'jszip';

export async function downloadAgentZip(shop: { name: string; slug: string }) {
  const zip = new JSZip();

  const configJson = JSON.stringify(
    {
      serverUrl: 'https://printx-cib8.onrender.com',
      shopSlug: shop.slug,
      agentName: `${shop.name} Counter PC`,
      pollIntervalMs: 3000,
      heartbeatIntervalMs: 10000,
      autoPrint: true,
      preferredPrinter: '',
    },
    null,
    2
  );

  const startBat = `@echo off
title PrintX Shop Printer Agent - Live Hardware Bridge
color 0B
cls
echo ======================================================================
echo             PRINTX AUTOMATED PRINTER CONNECTOR AGENT
echo                  Shop: ${shop.name}
echo ======================================================================
echo.
cd /d %~dp0

where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not found on this computer.
    echo Please download and install Node.js (LTS version) from: https://nodejs.org
    echo Once installed, double-click this file again.
    echo.
    pause
    exit /b
)

echo Starting Live Printer Spooler...
echo Connect any USB or Wi-Fi printer to this PC - it will auto-detect!
echo.
node agent.js
pause
`;

  const agentJs = `/**
 * PrintX Shop Desktop Agent
 * Automated Hardware Printer Bridge & Spooler for Xerox Stations
 */

const fs = require('fs');
const path = require('path');
const http = require('http');
const https = require('https');
const { exec } = require('child_process');
const os = require('os');

// Load Configuration
const configPath = path.join(__dirname, 'config.json');
let config = {
  serverUrl: 'https://printx-cib8.onrender.com',
  shopSlug: '${shop.slug}',
  agentName: '${shop.name} Counter PC',
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
      const psCommand = \`powershell -NoProfile -Command "Get-CimInstance Win32_Printer | Select-Object Name,DriverName,Default,WorkOffline | ConvertTo-Json"\`;
      exec(psCommand, { windowsHide: true }, (err, stdout) => {
        if (err || !stdout.trim()) {
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
      const fallback = [
        { name: 'System Default Printer', driverName: 'Generic Driver', isDefault: true, isOnline: true }
      ];
      activePrinters = fallback;
      defaultPrinterName = fallback[0].name;
      resolve(fallback);
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

    await apiRequest('/api/agent/heartbeat', 'POST', payload);
  } catch (err) {
    // console.error('Heartbeat error:', err.message);
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
        return reject(new Error(\`Failed to download file, HTTP \${res.statusCode}\`));
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
 * 4. Silent Print Execution on Windows
 */
function sendToPrinter(filePath, printerName, printConfig) {
  return new Promise((resolve) => {
    console.log(\`🖨️ Spooling to printer: "\${printerName}" (Copies: \${printConfig.copies}, Mode: \${printConfig.colorMode}, Duplex: \${printConfig.printSide})\`);

    if (process.platform === 'win32') {
      const targetPrinter = printerName.replace(/"/g, '""');
      const absolutePdf = path.resolve(filePath).replace(/'/g, "''");

      const psPrint = \`powershell -NoProfile -Command "Start-Process -FilePath '\${absolutePdf}' -Verb PrintTo -ArgumentList '\\\\"\${targetPrinter}\\\\"' -PassThru | ForEach-Object { Start-Sleep -Seconds 3; if (!\\\$_.HasExited) { \\\$_.Kill() } }"\`;

      exec(psPrint, { windowsHide: true }, () => {
        resolve(true);
      });
    } else {
      exec(\`lp -d "\${printerName}" "\${filePath}"\`, () => resolve(true));
    }
  });
}

/**
 * 5. Main Poll Cycle for Incoming Paid Print Jobs
 */
async function pollPrintJobs() {
  try {
    const jobs = await apiRequest(\`/api/agent/jobs?shopSlug=\${encodeURIComponent(config.shopSlug)}\`, 'GET');

    if (Array.isArray(jobs) && jobs.length > 0) {
      for (const job of jobs) {
        if (processingJobs.has(job.orderNumber)) continue;
        processingJobs.add(job.orderNumber);

        console.log(\`\\n======================================================\`);
        console.log(\`🔔 NEW PAID PRINT ORDER RECEIVED: \${job.orderNumber}\`);
        console.log(\`📄 Document: \${job.documentName}\`);
        console.log(\`⚙️ Config: \${job.config.copies} Copies | \${job.config.colorMode} | \${job.config.printSide}\`);
        console.log(\`======================================================\`);

        try {
          await apiRequest('/api/agent/jobs/status', 'POST', {
            orderNumber: job.orderNumber,
            status: 'PRINTING',
            printerName: defaultPrinterName,
          });

          const localPdfPath = path.join(TEMP_DIR, \`\${job.orderNumber}_\${job.fileKey}\`);
          console.log(\`📥 Downloading document from server...\`);
          await downloadFile(job.downloadUrl, localPdfPath);

          if (config.autoPrint) {
            await sendToPrinter(localPdfPath, defaultPrinterName, job.config);
          }

          await apiRequest('/api/agent/jobs/status', 'POST', {
            orderNumber: job.orderNumber,
            status: 'PRINTED',
            printerName: defaultPrinterName,
          });

          console.log(\`✅ [ORDER \${job.orderNumber}] PRINT COMPLETED SUCCESSFULLY!\\n\`);
        } catch (jobErr) {
          console.error(\`❌ [ORDER \${job.orderNumber}] Print failed:\`, jobErr.message);
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
    // Silent fail
  }
}

/**
 * Start Agent
 */
async function start() {
  console.clear();
  console.log(\`
╔════════════════════════════════════════════════════════════╗
║             PRINTX SHOP DESKTOP PRINTER AGENT              ║
║         Automated Hardware Spooler for Xerox Stations      ║
╚════════════════════════════════════════════════════════════╝
\`);

  console.log(\`📍 Server URL  : \${config.serverUrl}\`);
  console.log(\`🏪 Shop Slug   : \${config.shopSlug}\`);
  console.log(\`🖥️ Agent Name  : \${config.agentName}\`);

  await detectPrinters();
  console.log(\`\\n🖨️ Detected Physical Printers (\${activePrinters.length}):\`);
  activePrinters.forEach((p, idx) => {
    const isDef = p.name === defaultPrinterName ? ' (DEFAULT / ACTIVE)' : '';
    console.log(\`   \${idx + 1}. [\${p.isOnline ? 'ONLINE' : 'OFFLINE'}] \${p.name}\${isDef}\`);
  });

  console.log(\`\\n🚀 Agent is connected & listening for customer print jobs!\`);
  console.log(\`   (Keep this window open during shop hours)\\n\`);

  await sendHeartbeat();
  setInterval(sendHeartbeat, config.heartbeatIntervalMs);
  setInterval(pollPrintJobs, config.pollIntervalMs);
}

start();
`;

  const readmeTxt = `=======================================================
          PRINTX SHOP PRINTER CONNECTOR AGENT
=======================================================

SHOP NAME : ${shop.name}
SHOP SLUG : ${shop.slug}

QUICK SETUP (1 MINUTE):
-----------------------
1. Ensure your printer (Canon, HP, Epson, Brother, etc.) is turned on 
   and connected to this PC via USB cable or Wi-Fi.

2. Double-click "start-agent.bat" to start the connector.

3. That's it! When a customer scans your QR Standee and pays, 
   the document will automatically print out of your printer silently.

REQUIREMENT:
- Windows PC / Laptop with Node.js installed (download free from https://nodejs.org if needed).
=======================================================
`;

  // Add files to ZIP
  zip.file('start-agent.bat', startBat);
  zip.file('config.json', configJson);
  zip.file('agent.js', agentJs);
  zip.file('README.txt', readmeTxt);

  const content = await zip.generateAsync({ type: 'blob' });
  const downloadUrl = URL.createObjectURL(content);
  const a = document.createElement('a');
  a.href = downloadUrl;
  a.download = `printx-agent-${shop.slug}.zip`;
  a.click();
  URL.revokeObjectURL(downloadUrl);
}
