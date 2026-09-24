# =====================================================================
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

    # A. If SumatraPDF exists locally, use it for silent high quality printing
    if (Test-Path $sumatraExe) {
        try {
            $settings = "copies=" + $copies
            if ($mode -eq "COLOR") { $settings += ",color" } else { $settings += ",monochrome" }
            if ($side -eq "DOUBLE") { $settings += ",duplex" } else { $settings += ",simplex" }

            Start-Process -FilePath $sumatraExe -ArgumentList "-print-to `"$printerName`" -print-settings `"$settings`" -silent `"$cleanPath`"" -Wait -WindowStyle Hidden
            Write-Host "   [SUCCESS] Print spooled successfully via engine." -ForegroundColor Green
            return
        } catch {
            # Fall through to standard print
        }
    }

    # B. Standard Windows Shell PrintTo
    try {
        Start-Process -FilePath $cleanPath -Verb PrintTo -ArgumentList "`"$printerName`"" -PassThru -WindowStyle Hidden | Out-Null
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
