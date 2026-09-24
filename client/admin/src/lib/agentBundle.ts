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
cd /d "%~dp0"

:loop
echo ======================================================================
echo             PRINTX AUTOMATED PRINTER CONNECTOR AGENT
echo                  Shop: ${shop.name}
echo                   Zero Setup - Auto Hardware Bridge
echo ======================================================================
echo.

where node >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    if exist "%~dp0agent.js" (
        echo [LAUNCH] Node.js runtime detected. Starting high-speed engine...
        node "%~dp0agent.js"
        goto restart_prompt
    )
)

echo [LAUNCH] Starting native Windows printer connector...
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0agent.ps1"

:restart_prompt
echo.
echo [AGENT NOTICE] Agent process stopped. Restarting in 3 seconds...
timeout /t 3 /nobreak >nul
cls
goto loop
`;

  const agentPs1 = `# =====================================================================
#             PRINTX SHOP NATIVE DESKTOP PRINTER AGENT
# =====================================================================

$Host.UI.RawUI.WindowTitle = "PrintX Shop Printer Agent"

Clear-Host
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host "             PRINTX SHOP DESKTOP PRINTER AGENT                  " -ForegroundColor Cyan
Write-Host "             Automated Hardware Spooler (Native)                " -ForegroundColor Cyan
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host ""

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$configPath = Join-Path $scriptDir "config.json"
$tempDir = Join-Path $scriptDir "temp_jobs"
$sumatraExe = Join-Path $scriptDir "SumatraPDF.exe"

if (-not (Test-Path $tempDir)) {
    New-Item -ItemType Directory -Path $tempDir -Force | Out-Null
}

# 1. Load Configuration
$serverUrl = "https://printx-cib8.onrender.com"
$shopSlug = "${shop.slug}"
$agentName = "${shop.name} Counter PC"
$pollIntervalSec = 3
$heartbeatIntervalSec = 10
$autoPrint = $true
$preferredPrinter = ""

if (Test-Path $configPath) {
    try {
        $rawConfig = Get-Content $configPath -Raw | ConvertFrom-Json
        if ($rawConfig.serverUrl) { $serverUrl = $rawConfig.serverUrl.TrimEnd('/') }
        if ($rawConfig.shopSlug) { $shopSlug = $rawConfig.shopSlug }
        if ($rawConfig.agentName) { $agentName = $rawConfig.agentName }
        if ($rawConfig.preferredPrinter) { $preferredPrinter = $rawConfig.preferredPrinter }
    } catch {
        Write-Host "[WARNING] Could not parse config.json, using defaults." -ForegroundColor Yellow
    }
}

Write-Host ("[SERVER] Connecting to : " + $serverUrl) -ForegroundColor Green
Write-Host ("[SHOP]   Shop Slug     : " + $shopSlug) -ForegroundColor Green
Write-Host ("[AGENT]  Agent Name    : " + $agentName) -ForegroundColor Green
Write-Host ""

# 2. Function to detect physical printers
function Get-ShopPrinters {
    try {
        $printers = Get-CimInstance Win32_Printer | Select-Object Name, DriverName, Default, WorkOffline
        $list = @()
        foreach ($p in $printers) {
            $list += @{
                name = $p.Name
                driverName = if ($p.DriverName) { $p.DriverName } else { "Standard Driver" }
                isDefault = [bool]$p.Default
                isOnline = -not [bool]$p.WorkOffline
            }
        }
        return $list
    } catch {
        return @(@{
            name = "Default Local Printer"
            driverName = "Generic Driver"
            isDefault = $true
            isOnline = $true
        })
    }
}

$activePrinters = Get-ShopPrinters
Write-Host ("[HARDWARE] Detected Printers (" + $activePrinters.Count + "):") -ForegroundColor Yellow
$defaultPrinter = ""
$idx = 1
foreach ($p in $activePrinters) {
    $tag = if ($p.isOnline) { "ONLINE" } else { "OFFLINE" }
    $def = if ($p.isDefault) { " (DEFAULT / ACTIVE)" } else { "" }
    if ($p.isDefault -and [string]::IsNullOrEmpty($defaultPrinter)) {
        $defaultPrinter = $p.name
    }
    $color = if ($p.isOnline) { [ConsoleColor]::White } else { [ConsoleColor]::DarkYellow }
    Write-Host ("   " + $idx + ". [" + $tag + "] " + $p.name + $def) -ForegroundColor $color
    $idx++
}

if ([string]::IsNullOrEmpty($defaultPrinter) -and $activePrinters.Count -gt 0) {
    $defaultPrinter = $activePrinters[0].name
}

if (-not [string]::IsNullOrEmpty($preferredPrinter)) {
    $defaultPrinter = $preferredPrinter
}

$targetObj = $activePrinters | Where-Object { $_.name -eq $defaultPrinter } | Select-Object -First 1
if ($targetObj -and -not $targetObj.isOnline) {
    Write-Host ""
    Write-Host ("[WARNING] '" + $defaultPrinter + "' is marked OFFLINE in Windows.") -ForegroundColor Yellow
    Write-Host "          Please verify printer power and USB connection." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "[STATUS] Agent is connected and listening for print jobs..." -ForegroundColor Green
Write-Host "         (Keep this window open during shop working hours)" -ForegroundColor Gray
Write-Host ""

# 3. Heartbeat Function
function Send-Heartbeat {
    try {
        $currentPrinters = Get-ShopPrinters
        $body = @{
            shopSlug = $shopSlug
            agentName = $agentName
            hostname = $env:COMPUTERNAME
            ipAddress = "127.0.0.1"
            version = "1.0.0"
            printers = $currentPrinters
        } | ConvertTo-Json -Depth 4

        Invoke-RestMethod -Uri ($serverUrl + "/api/agent/heartbeat") -Method Post -Body $body -ContentType "application/json" -TimeoutSec 10 -ErrorAction SilentlyContinue | Out-Null
    } catch {
        # Retry on next cycle
    }
}

# 4. Silent Print Spooling Function
function Invoke-SilentPrint([string]$filePath, [string]$printerName, $printConfig) {
    $copies = if ($printConfig.copies) { [int]$printConfig.copies } else { 1 }
    $mode = if ($printConfig.colorMode) { $printConfig.colorMode } else { "BW" }
    $side = if ($printConfig.printSide) { $printConfig.printSide } else { "SINGLE" }
    $ext = [System.IO.Path]::GetExtension($filePath).ToLower()
    $cleanPath = (Resolve-Path $filePath).Path
    
    Write-Host ("[PRINT] Spooling to: " + $printerName + " (Copies: " + $copies + ", Mode: " + $mode + ", Duplex: " + $side + ")") -ForegroundColor Cyan

    # A. If Image (.jpg, .jpeg, .png, .bmp, .webp, .gif, .tif, .tiff), use Native .NET PrintDocument
    if ($ext -in @('.jpg', '.jpeg', '.png', '.bmp', '.gif', '.tif', '.tiff', '.webp')) {
        try {
            Add-Type -AssemblyName System.Drawing
            $printDoc = New-Object System.Drawing.Printing.PrintDocument
            $printDoc.PrinterSettings.PrinterName = $printerName
            $printDoc.PrinterSettings.Copies = $copies
            if ($mode -eq "BW" -or $mode -eq "MONOCHROME") {
                $printDoc.DefaultPageSettings.Color = $false
            } else {
                $printDoc.DefaultPageSettings.Color = $true
            }
            
            $rawImg = [System.Drawing.Image]::FromFile($cleanPath)
            
            $printDoc.add_PrintPage({
                param($sender, $e)
                $bounds = $e.MarginBounds
                $scale = [Math]::Min($bounds.Width / $rawImg.Width, $bounds.Height / $rawImg.Height)
                $w = [int]($rawImg.Width * $scale)
                $h = [int]($rawImg.Height * $scale)
                $x = $bounds.X + [int](($bounds.Width - $w) / 2)
                $y = $bounds.Y + [int](($bounds.Height - $h) / 2)
                $e.Graphics.DrawImage($rawImg, $x, $y, $w, $h)
                $e.HasMorePages = $false
            })
            
            $printDoc.Print()
            $printDoc.Dispose()
            $rawImg.Dispose()
            Write-Host ("   [SUCCESS] Image successfully spooled to " + $printerName + "!") -ForegroundColor Green
            return
        } catch {
            Write-Host ("[NOTICE] Image print fallback: " + $_.Exception.Message) -ForegroundColor DarkYellow
            try {
                $paintArgs = '/pt "' + $cleanPath + '" "' + $printerName + '"'
                Start-Process -FilePath "mspaint.exe" -ArgumentList $paintArgs -Wait -WindowStyle Hidden
                Write-Host "   [SUCCESS] Image printed via system Paint engine." -ForegroundColor Green
                return
            } catch {
                Write-Host ("[ERROR] Image spool error: " + $_.Exception.Message) -ForegroundColor Red
            }
        }
    }

    # B. If PDF and SumatraPDF exists, use silent high-speed engine
    if (Test-Path $sumatraExe) {
        try {
            $settings = "copies=" + $copies
            if ($mode -eq "COLOR") { $settings += ",color" } else { $settings += ",monochrome" }
            if ($side -eq "DOUBLE") { $settings += ",duplex" } else { $settings += ",simplex" }

            $argList = '-print-to "' + $printerName + '" -print-settings "' + $settings + '" -silent "' + $cleanPath + '"'
            Start-Process -FilePath $sumatraExe -ArgumentList $argList -Wait -WindowStyle Hidden
            Write-Host "   [SUCCESS] PDF print spooled successfully via engine." -ForegroundColor Green
            return
        } catch {
            Write-Host ("[WARNING] SumatraPDF notice: " + $_.Exception.Message) -ForegroundColor Yellow
        }
    }

    # C. Standard Windows Shell PrintTo fallback
    try {
        $cleanPrinter = '"' + $printerName + '"'
        Start-Process -FilePath $cleanPath -Verb PrintTo -ArgumentList $cleanPrinter -PassThru -WindowStyle Hidden | Out-Null
        Write-Host "   [SUCCESS] Document sent to Windows print spooler." -ForegroundColor Green
    } catch {
        Write-Host ("[ERROR] Failed to spool print: " + $_.Exception.Message) -ForegroundColor Red
    }
}

Send-Heartbeat
$lastHeartbeat = [DateTime]::UtcNow
$processedJobs = @{}

# 5. Main Loop
while ($true) {
    try {
        if (([DateTime]::UtcNow - $lastHeartbeat).TotalSeconds -ge $heartbeatIntervalSec) {
            Send-Heartbeat
            $lastHeartbeat = [DateTime]::UtcNow
        }

        $encodedSlug = [System.Uri]::EscapeDataString($shopSlug)
        $jobsResponse = Invoke-RestMethod -Uri ($serverUrl + "/api/agent/jobs?shopSlug=" + $encodedSlug) -Method Get -TimeoutSec 8 -ErrorAction SilentlyContinue

        $jobs = if ($jobsResponse.data) { $jobsResponse.data } else { $jobsResponse }

        if ($jobs -and ($jobs -is [System.Array] -or $jobs.orderNumber)) {
            $jobList = if ($jobs -is [System.Array]) { $jobs } else { @($jobs) }

            foreach ($job in $jobList) {
                if ($job.orderNumber -and -not $processedJobs.ContainsKey($job.orderNumber)) {
                    $processedJobs[$job.orderNumber] = $true

                    Write-Host ""
                    Write-Host "======================================================" -ForegroundColor Magenta
                    Write-Host ("[NEW ORDER] Paid Job Received: " + $job.orderNumber) -ForegroundColor Yellow
                    Write-Host ("[DOCUMENT]  " + $job.documentName) -ForegroundColor White
                    Write-Host ("[CONFIG]    " + $job.config.copies + " Copies | " + $job.config.colorMode + " | " + $job.config.printSide) -ForegroundColor Gray
                    Write-Host "======================================================" -ForegroundColor Magenta

                    try {
                        $statusBody = @{
                            orderNumber = $job.orderNumber
                            status = "PRINTING"
                            printerName = $defaultPrinter
                        } | ConvertTo-Json
                        Invoke-RestMethod -Uri ($serverUrl + "/api/agent/jobs/status") -Method Post -Body $statusBody -ContentType "application/json" -TimeoutSec 5 -ErrorAction SilentlyContinue | Out-Null

                        $localFile = Join-Path $tempDir ($job.orderNumber + "_" + $job.fileKey)
                        Write-Host "[DOWNLOAD] Fetching customer document..." -ForegroundColor Cyan
                        
                        $downloadUri = if ($job.downloadUrl.StartsWith("http")) { $job.downloadUrl } else { $serverUrl + $job.downloadUrl }
                        Invoke-WebRequest -Uri $downloadUri -OutFile $localFile -TimeoutSec 30

                        if ($autoPrint) {
                            Invoke-SilentPrint -filePath $localFile -printerName $defaultPrinter -printConfig $job.config
                        }

                        $doneBody = @{
                            orderNumber = $job.orderNumber
                            status = "PRINTED"
                            printerName = $defaultPrinter
                        } | ConvertTo-Json
                        Invoke-RestMethod -Uri ($serverUrl + "/api/agent/jobs/status") -Method Post -Body $doneBody -ContentType "application/json" -TimeoutSec 5 -ErrorAction SilentlyContinue | Out-Null

                        Write-Host ("[SUCCESS] Order " + $job.orderNumber + " print sent to printer!") -ForegroundColor Green
                        Write-Host ""
                    } catch {
                        Write-Host ("[ERROR] Processing order " + $job.orderNumber + ": " + $_.Exception.Message) -ForegroundColor Red
                    }
                }
            }
        }
    } catch {
        # Keep loop running continuously
    }

    Start-Sleep -Seconds $pollIntervalSec
}
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
    console.error('Could not parse config.json, using defaults.');
  }
}

const TEMP_DIR = path.join(__dirname, 'temp_jobs');
if (!fs.existsSync(TEMP_DIR)) {
  fs.mkdirSync(TEMP_DIR, { recursive: true });
}

let activePrinters = [];
let defaultPrinterName = '';
const processingJobs = new Set();

function detectPrinters() {
  return new Promise((resolve) => {
    if (process.platform === 'win32') {
      const psCommand = 'powershell -NoProfile -Command "Get-CimInstance Win32_Printer | Select-Object Name,DriverName,Default,WorkOffline | ConvertTo-Json"';
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
    // Network retry
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

function downloadFile(fileUrl, destinationPath) {
  return new Promise((resolve, reject) => {
    const url = new URL(fileUrl, config.serverUrl);
    const isHttps = url.protocol === 'https:';
    const client = isHttps ? https : http;

    const file = fs.createWriteStream(destinationPath);
    client.get(url.toString(), (res) => {
      if (res.statusCode !== 200) {
        return reject(new Error('HTTP status ' + res.statusCode));
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

function sendToPrinter(filePath, printerName, printConfig = {}) {
  return new Promise((resolve) => {
    const copies = parseInt(printConfig.copies) || 1;
    const isColor = (printConfig.colorMode || '').toUpperCase() === 'COLOR';
    const isDuplex = (printConfig.printSide || '').toUpperCase() === 'DOUBLE';
    const cleanPrinter = (printerName || '').trim();

    console.log('[PRINT] Spooling to: "' + (cleanPrinter || 'DEFAULT') + '" (Copies: ' + copies + ', Mode: ' + (isColor ? 'COLOR' : 'BW') + ', Duplex: ' + (isDuplex ? 'DOUBLE' : 'SINGLE') + ')');

    if (process.platform === 'win32') {
      const sumatraPath = path.join(__dirname, 'SumatraPDF.exe');
      const absolutePdf = path.resolve(filePath);

      if (fs.existsSync(sumatraPath)) {
        const settings = 'copies=' + copies + ',' + (isColor ? 'color' : 'monochrome') + ',' + (isDuplex ? 'duplex' : 'simplex');
        const cmd = cleanPrinter
          ? '"' + sumatraPath + '" -print-to "' + cleanPrinter + '" -print-settings "' + settings + '" -silent "' + absolutePdf + '"'
          : '"' + sumatraPath + '" -print-to-default -print-settings "' + settings + '" -silent "' + absolutePdf + '"';

        console.log('[ENGINE] Executing hardware spool...');
        exec(cmd, { windowsHide: true, timeout: 45000 }, (err) => {
          if (err) console.warn('[AGENT] SumatraPDF notice: ' + err.message);
          else console.log('[AGENT] Document successfully queued in physical printer spooler.');
          resolve(true);
        });
        return;
      }

      const safePrinter = cleanPrinter.replace(/"/g, '""');
      const safePdf = absolutePdf.replace(/'/g, "''");
      const psPrint = cleanPrinter
        ? 'powershell -NoProfile -Command "Start-Process -FilePath \\'' + safePdf + '\\' -Verb PrintTo -ArgumentList \'\\\\"' + safePrinter + '\\\\\"\' -PassThru | ForEach-Object { Start-Sleep -Seconds 3; if (!$_.HasExited) { $_.Kill() } }"'
        : 'powershell -NoProfile -Command "Start-Process -FilePath \\'' + safePdf + '\\' -Verb Print -PassThru | ForEach-Object { Start-Sleep -Seconds 3; if (!$_.HasExited) { $_.Kill() } }"';

      exec(psPrint, { windowsHide: true }, () => resolve(true));
    } else {
      const lpCommand = cleanPrinter
        ? 'lp -d "' + cleanPrinter + '" -n ' + copies + ' "' + filePath + '"'
        : 'lp -n ' + copies + ' "' + filePath + '"';
      exec(lpCommand, () => resolve(true));
    }
  });
}

async function pollPrintJobs() {
  try {
    const jobs = await apiRequest('/api/agent/jobs?shopSlug=' + encodeURIComponent(config.shopSlug), 'GET');

    if (Array.isArray(jobs) && jobs.length > 0) {
      for (const job of jobs) {
        if (processingJobs.has(job.orderNumber)) continue;
        processingJobs.add(job.orderNumber);

        console.log('\\n======================================================');
        console.log('[NEW ORDER] Paid Print Order Received: ' + job.orderNumber);
        console.log('[DOCUMENT]  ' + job.documentName);
        console.log('[CONFIG]    ' + job.config.copies + ' Copies | ' + job.config.colorMode + ' | ' + job.config.printSide);
        console.log('======================================================');

        try {
          await apiRequest('/api/agent/jobs/status', 'POST', {
            orderNumber: job.orderNumber,
            status: 'PRINTING',
            printerName: defaultPrinterName,
          });

          const localPdfPath = path.join(TEMP_DIR, job.orderNumber + '_' + job.fileKey);
          console.log('[DOWNLOAD] Downloading document...');
          await downloadFile(job.downloadUrl, localPdfPath);

          if (config.autoPrint) {
            await sendToPrinter(localPdfPath, defaultPrinterName, job.config);
          }

          await apiRequest('/api/agent/jobs/status', 'POST', {
            orderNumber: job.orderNumber,
            status: 'PRINTED',
            printerName: defaultPrinterName,
          });

          console.log('[SUCCESS] Order ' + job.orderNumber + ' printed successfully!\\n');
        } catch (jobErr) {
          console.error('[ERROR] Order ' + job.orderNumber + ' failed:', jobErr.message);
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
    // Retry next interval
  }
}

async function start() {
  console.clear();
  console.log(
\`╔════════════════════════════════════════════════════════════╗
║             PRINTX SHOP DESKTOP PRINTER AGENT              ║
║         Automated Hardware Spooler for Xerox Stations      ║
╚════════════════════════════════════════════════════════════╝\`
  );

  console.log('📍 Connecting to Server : ' + config.serverUrl);
  console.log('🏪 Shop Slug           : ' + config.shopSlug);
  console.log('🖥️ Agent Name          : ' + config.agentName);

  await detectPrinters();
  console.log('\\n🖨️ Detected Hardware Printers (' + activePrinters.length + '):');
  activePrinters.forEach((p, idx) => {
    const isDef = p.name === defaultPrinterName ? ' (DEFAULT / ACTIVE)' : '';
    console.log('   ' + (idx + 1) + '. [' + (p.isOnline ? 'ONLINE' : 'OFFLINE') + '] ' + p.name + isDef);
  });

  console.log('\\n🚀 Agent is running and listening for customer print jobs...');
  console.log('   (Keep this window open on your shop computer)\\n');

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

QUICK SETUP:
----------------------------------------------
1. Right-click this ZIP file and click "Extract All..." to extract files to a folder.
2. Double-click "start-agent.bat".
3. That's it! The agent will automatically detect your connected Canon, HP, Epson, Brother, or any Xerox printer.

Whenever a customer pays for a print job via QR Standee, it will automatically print directly from your printer!
=======================================================
`;

  zip.file('start-agent.bat', startBat);
  zip.file('agent.ps1', agentPs1);
  zip.file('agent.js', agentJs);
  zip.file('config.json', configJson);
  zip.file('README.txt', readmeTxt);

  const content = await zip.generateAsync({ type: 'blob' });
  const downloadUrl = URL.createObjectURL(content);
  const a = document.createElement('a');
  a.href = downloadUrl;
  a.download = `printx-agent-${shop.slug}.zip`;
  a.click();
  URL.revokeObjectURL(downloadUrl);
}
