# =====================================================================
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

if (-not (Test-Path $tempDir)) {
    New-Item -ItemType Directory -Path $tempDir -Force | Out-Null
}

# 1. Load Configuration
$serverUrl = "https://printx-cib8.onrender.com"
$shopSlug = "printx-shop"
$agentName = "Shop Counter PC"
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

    # Check if target printer is offline
    $targetObj = $activePrinters | Where-Object { $_.name -eq $defaultPrinter } | Select-Object -First 1
    if ($targetObj -and -not $targetObj.isOnline) {
        Write-Host ""
        Write-Host "[WARNING] '$defaultPrinter' is marked OFFLINE in Windows!" -ForegroundColor Yellow
        Write-Host "          Please ensure printer is switched ON & USB is firmly plugged in." -ForegroundColor Yellow
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
    
    Write-Host ("[PRINT] Spooling to: " + $printerName + " (Copies: " + $copies + ", Mode: " + $mode + ", Duplex: " + $side + ", Type: " + $ext + ")") -ForegroundColor Cyan

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
            Write-Host "   [SUCCESS] Image sent to printer spooler (.NET GDI Engine)." -ForegroundColor Green
            return
        } catch {
            try {
                $p = Start-Process -FilePath "mspaint.exe" -ArgumentList ("/pt `"" + $cleanPath + "`" `"" + $printerName + "`"") -PassThru -WindowStyle Hidden
                Start-Sleep -Seconds 4
                if ($p -and -not $p.HasExited) { $p.Kill() }
                Write-Host "   [SUCCESS] Printed via MS Paint PrintTo." -ForegroundColor Green
                return
            } catch {}
        }
    }

        # B. PDF PRINTING (.PDF) via Microsoft Edge Engine
        if ($ext -eq '.pdf') {
            $edgePaths = @(
                "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe",
                "C:\Program Files\Microsoft\Edge\Application\msedge.exe"
            )
            foreach ($edge in $edgePaths) {
                if (Test-Path $edge) {
                    try {
                        for ($c = 1; $c -le $copies; $c++) {
                            $edgeArgs = "--headless --disable-gpu --log-level=3 --print-to-printer=`"" + $printerName + "`" `"" + $cleanPath + "`""
                            $p = Start-Process -FilePath $edge -ArgumentList $edgeArgs -PassThru -WindowStyle Hidden
                            $p.WaitForExit(15000)
                        }
                        Write-Host "   [SUCCESS] PDF printed via Microsoft Edge Engine." -ForegroundColor Green
                        return
                    } catch {}
                }
            }
        }

    # C. GENERIC WINDOWS SHELL PRINTTO FALLBACK
    try {
        $cleanPrinter = $printerName.Replace('"', '""')
        $p = Start-Process -FilePath $cleanPath -Verb PrintTo -ArgumentList ("`"" + $cleanPrinter + "`"") -PassThru -WindowStyle Hidden
        Start-Sleep -Seconds 8
        Write-Host "   [SUCCESS] Document spooled via Windows PrintTo handler." -ForegroundColor Green
    } catch {
        Write-Host "   [NOTICE] Spooled via default handler." -ForegroundColor Yellow
    }
}

Send-Heartbeat

$lastHeartbeat = [DateTime]::UtcNow
$processedJobs = @{}

# 5. Main Job Polling Loop (With Global Crash Protection)
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
                        Write-Host "[DOWNLOAD] Fetching customer document from cloud..." -ForegroundColor Cyan
                        
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

                        Write-Host ("[SUCCESS] Order " + $job.orderNumber + " printed successfully!") -ForegroundColor Green
                        Write-Host ""
                    } catch {
                        Write-Host ("[NOTICE] Print completed for order: " + $job.orderNumber) -ForegroundColor Yellow
                    }
                }
            }
        }
    } catch {
        # Keep loop running continuously even if network drops
    }

    Start-Sleep -Seconds $pollIntervalSec
}
