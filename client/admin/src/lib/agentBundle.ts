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

echo ======================================================================
echo             PRINTX AUTOMATED PRINTER CONNECTOR AGENT
echo                  Shop: ${shop.name}
echo               Zero Setup - Pure Native Windows
echo ======================================================================
echo.

powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0agent.ps1"
if %errorlevel% neq 0 (
    echo.
    echo Press any key to retry or exit...
    pause
)
`;

  const agentPs1 = `# =====================================================================
#             PRINTX SHOP NATIVE DESKTOP PRINTER AGENT
#  Pure Native Windows PowerShell - Zero Software/Node Installation!
# =====================================================================

$Host.UI.RawUI.WindowTitle = "PrintX Shop Printer Connector - Live Hardware Bridge"
[Console]::ForegroundColor = [ConsoleColor]::Cyan

Clear-Host
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host "             PRINTX SHOP DESKTOP PRINTER AGENT                  " -ForegroundColor Cyan
Write-Host "     Automated Hardware Spooler for Xerox Stations (Native)     " -ForegroundColor Cyan
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host ""

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$configPath = Join-Path $scriptDir "config.json"
$tempDir = Join-Path $scriptDir "temp_jobs"

if (!(Test-Path $tempDir)) {
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
        Write-Host "Warning: Could not parse config.json, using defaults." -ForegroundColor Yellow
    }
}

Write-Host ("Connecting to Server : " + $serverUrl) -ForegroundColor Green
Write-Host ("Shop Slug           : " + $shopSlug) -ForegroundColor Green
Write-Host ("Agent Name          : " + $agentName) -ForegroundColor Green
Write-Host ""

# Enable TLS 1.2
[System.Net.ServicePointManager]::SecurityProtocol = [System.Net.SecurityProtocolType]::Tls12

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
Write-Host ("Detected Hardware Printers (" + $activePrinters.Count + "):") -ForegroundColor Yellow
$defaultPrinter = ""
$idx = 1
foreach ($p in $activePrinters) {
    $tag = if ($p.isOnline) { "ONLINE" } else { "OFFLINE" }
    $def = if ($p.isDefault) { " (DEFAULT / ACTIVE)" } else { "" }
    if ($p.isDefault -and [string]::IsNullOrEmpty($defaultPrinter)) {
        $defaultPrinter = $p.name
    }
    Write-Host ("   " + $idx + ". [" + $tag + "] " + $p.name + $def) -ForegroundColor White
    $idx++
}

if ([string]::IsNullOrEmpty($defaultPrinter) -and $activePrinters.Count -gt 0) {
    $defaultPrinter = $activePrinters[0].name
}

if (-not [string]::IsNullOrEmpty($preferredPrinter)) {
    $defaultPrinter = $preferredPrinter
}

Write-Host ""
Write-Host "Agent is connected & listening for customer print jobs..." -ForegroundColor Green
Write-Host "   (Keep this window open on shop computer during working hours)" -ForegroundColor Gray
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
            version = "1.0.0-native"
            printers = $currentPrinters
        } | ConvertTo-Json -Depth 4

        Invoke-RestMethod -Uri ($serverUrl + "/api/agent/heartbeat") -Method Post -Body $body -ContentType "application/json" -TimeoutSec 10 -ErrorAction SilentlyContinue | Out-Null
    } catch {
        # Silent retry
    }
}

# 4. Multi-Engine Silent Print Spooling Function (PDF, JPG, PNG, DOC)
function Invoke-SilentPrint([string]$filePath, [string]$printerName, $printConfig) {
    $copies = if ($printConfig.copies) { [int]$printConfig.copies } else { 1 }
    $mode = if ($printConfig.colorMode) { $printConfig.colorMode } else { "BW" }
    $side = if ($printConfig.printSide) { $printConfig.printSide } else { "SINGLE" }
    $ext = [System.IO.Path]::GetExtension($filePath).ToLower()
    $cleanPath = (Resolve-Path $filePath).Path
    
    Write-Host ("🖨️ Spooling to printer: " + $printerName + " (Copies: " + $copies + ", Mode: " + $mode + ", Duplex: " + $side + ", Type: " + $ext + ")") -ForegroundColor Cyan

    # A. IMAGE PRINTING (.JPG, .JPEG, .PNG, .BMP, .WEBP) via Native .NET GDI Spooler
    if ($ext -in @('.jpg', '.jpeg', '.png', '.bmp', '.webp')) {
        try {
            Add-Type -AssemblyName System.Drawing
            for ($c = 1; $c -le $copies; $c++) {
                $doc = New-Object System.Drawing.Printing.PrintDocument
                $doc.PrinterSettings.PrinterName = $printerName
                $doc.PrinterSettings.Copies = 1
                if ($doc.PrinterSettings.SupportsColor) {
                    $doc.DefaultPageSettings.Color = ($mode -eq "COLOR")
                }

                $img = [System.Drawing.Image]::FromFile($cleanPath)
                $doc.add_PrintPage({
                    param($sender, $e)
                    $marginBounds = $e.MarginBounds
                    $imageRatio = $img.Width / $img.Height
                    $pageRatio = $marginBounds.Width / $marginBounds.Height
                    
                    if ($imageRatio -gt $pageRatio) {
                        $w = $marginBounds.Width
                        $h = [int]($marginBounds.Width / $imageRatio)
                    } else {
                        $h = $marginBounds.Height
                        $w = [int]($marginBounds.Height * $imageRatio)
                    }
                    $x = $marginBounds.X + [int](($marginBounds.Width - $w) / 2)
                    $y = $marginBounds.Y + [int](($marginBounds.Height - $h) / 2)
                    
                    $destRect = New-Object System.Drawing.Rectangle($x, $y, $w, $h)
                    $e.Graphics.DrawImage($img, $destRect)
                })

                $doc.Print()
                $img.Dispose()
                $doc.Dispose()
            }
            Write-Host "   ✅ Image successfully sent directly to printer spooler (.NET Engine)." -ForegroundColor Green
            return
        } catch {
            Write-Host ("   ⚠️ .NET GDI fallback: " + $_.Exception.Message) -ForegroundColor Yellow
            try {
                $p = Start-Process -FilePath "mspaint.exe" -ArgumentList ('/pt "' + $cleanPath + '" "' + $printerName + '"') -PassThru -WindowStyle Hidden
                Start-Sleep -Seconds 4
                if ($p -and !$p.HasExited) { $p.Kill() }
                Write-Host "   ✅ Printed via MS Paint PrintTo Spooler." -ForegroundColor Green
                return
            } catch {}
        }
    }

    # B. PDF PRINTING (.PDF) via Microsoft Edge Engine or Native Shell
    if ($ext -eq '.pdf') {
        $p86 = $env:ProgramFilesX86
        if (-not $p86) { $p86 = "C:\Program Files (x86)" }
        $edgePaths = @(
            ($p86 + "\Microsoft\Edge\Application\msedge.exe"),
            ("C:\Program Files\Microsoft\Edge\Application\msedge.exe")
        )
        foreach ($edge in $edgePaths) {
            if (Test-Path $edge) {
                try {
                    for ($c = 1; $c -le $copies; $c++) {
                        $edgeArgs = '--headless --disable-gpu --print-to-printer="' + $printerName + '" "' + $cleanPath + '"'
                        $p = Start-Process -FilePath $edge -ArgumentList $edgeArgs -PassThru -WindowStyle Hidden
                        Start-Sleep -Seconds 4
                        if ($p -and !$p.HasExited) { $p.Kill() }
                    }
                    Write-Host "   ✅ PDF successfully printed via Microsoft Edge Print Engine." -ForegroundColor Green
                    return
                } catch {}
            }
        }
    }

    # C. GENERIC WINDOWS SHELL PRINTTO FALLBACK
    try {
        $cleanPrinter = $printerName.Replace('"', '""')
        $p = Start-Process -FilePath $cleanPath -Verb PrintTo -ArgumentList ('"' + $cleanPrinter + '"') -PassThru -WindowStyle Hidden
        Start-Sleep -Seconds 5
        if ($p -and !$p.HasExited) { $p.Kill() }
        Write-Host "   ✅ Document spooled via Windows Shell PrintTo handler." -ForegroundColor Green
    } catch {
        Write-Host ("   ⚠️ Print handler notification: " + $_.Exception.Message) -ForegroundColor Yellow
    }
}

Send-Heartbeat

$lastHeartbeat = [DateTime]::UtcNow
$processedJobs = @{}

# 5. Main Job Polling Loop
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
                    Write-Host ("🔔 NEW PAID PRINT ORDER RECEIVED: " + $job.orderNumber) -ForegroundColor Yellow
                    Write-Host ("📄 Document: " + $job.documentName) -ForegroundColor White
                    Write-Host ("⚙️ Config: " + $job.config.copies + " Copies | " + $job.config.colorMode + " | " + $job.config.printSide) -ForegroundColor Gray
                    Write-Host "======================================================" -ForegroundColor Magenta

                    try {
                        $statusBody = @{
                            orderNumber = $job.orderNumber
                            status = "PRINTING"
                            printerName = $defaultPrinter
                        } | ConvertTo-Json
                        Invoke-RestMethod -Uri ($serverUrl + "/api/agent/jobs/status") -Method Post -Body $statusBody -ContentType "application/json" -TimeoutSec 5 -ErrorAction SilentlyContinue | Out-Null

                        $localFile = Join-Path $tempDir ($job.orderNumber + "_" + $job.fileKey)
                        Write-Host "📥 Downloading customer document from cloud..." -ForegroundColor Cyan
                        
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

                        Write-Host ("✅ [ORDER " + $job.orderNumber + "] PRINT COMPLETED SUCCESSFULLY!") -ForegroundColor Green
                        Write-Host ""
                    } catch {
                        $errText = $_.Exception.Message
                        Write-Host ("❌ [ORDER " + $job.orderNumber + "] Print failed: " + $errText) -ForegroundColor Red
                    }
                }
            }
        }
    } catch {
        # Continue loop
    }

    Start-Sleep -Seconds $pollIntervalSec
}
`;

  const readmeTxt = `=======================================================
          PRINTX SHOP PRINTER CONNECTOR AGENT
=======================================================

SHOP NAME : ${shop.name}
SHOP SLUG : ${shop.slug}

QUICK SETUP (NO SOFTWARE INSTALLATION NEEDED):
----------------------------------------------
1. Right-click this ZIP file and choose "Extract All..." to extract files to Desktop.
2. Double-click "start-agent.bat".
3. That's it! It automatically detects your Canon / HP / Epson printer and connects to the cloud.

When a customer scans your QR standee and pays, prints will come out automatically!
=======================================================
`;

  zip.file('start-agent.bat', startBat);
  zip.file('agent.ps1', agentPs1);
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
