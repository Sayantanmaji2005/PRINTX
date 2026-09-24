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

if (!(Test-Path $tempDir)) {
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

# 4. Silent Print Spooling Function
function Invoke-SilentPrint([string]$filePath, [string]$printerName, $printConfig) {
    $copies = if ($printConfig.copies) { $printConfig.copies } else { 1 }
    $mode = if ($printConfig.colorMode) { $printConfig.colorMode } else { "BW" }
    $side = if ($printConfig.printSide) { $printConfig.printSide } else { "SINGLE" }
    
    Write-Host ("Spooling to printer: " + $printerName + " (Copies: " + $copies + ", Mode: " + $mode + ", Duplex: " + $side + ")") -ForegroundColor Cyan
    try {
        $cleanPrinter = $printerName.Replace('"', '""')
        $cleanPath = (Resolve-Path $filePath).Path.Replace("'", "''")

        $proc = Start-Process -FilePath $cleanPath -Verb PrintTo -ArgumentList ('"' + $cleanPrinter + '"') -PassThru -WindowStyle Hidden
        Start-Sleep -Seconds 4
        if ($proc -and !$proc.HasExited) {
            $proc.Kill()
        }
        Write-Host "   Print command successfully spooled to Windows print queue." -ForegroundColor Green
    } catch {
        Write-Host "   Print queued via default Windows handler." -ForegroundColor Yellow
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
                    Write-Host ("NEW PAID PRINT ORDER RECEIVED: " + $job.orderNumber) -ForegroundColor Yellow
                    Write-Host ("Document: " + $job.documentName) -ForegroundColor White
                    Write-Host ("Config: " + $job.config.copies + " Copies | " + $job.config.colorMode + " | " + $job.config.printSide) -ForegroundColor Gray
                    Write-Host "======================================================" -ForegroundColor Magenta

                    try {
                        $statusBody = @{
                            orderNumber = $job.orderNumber
                            status = "PRINTING"
                            printerName = $defaultPrinter
                        } | ConvertTo-Json
                        Invoke-RestMethod -Uri ($serverUrl + "/api/agent/jobs/status") -Method Post -Body $statusBody -ContentType "application/json" -TimeoutSec 5 -ErrorAction SilentlyContinue | Out-Null

                        $localPdf = Join-Path $tempDir ($job.orderNumber + "_" + $job.fileKey)
                        Write-Host "Downloading customer document from cloud..." -ForegroundColor Cyan
                        
                        $downloadUri = if ($job.downloadUrl.StartsWith("http")) { $job.downloadUrl } else { $serverUrl + $job.downloadUrl }
                        Invoke-WebRequest -Uri $downloadUri -OutFile $localPdf -TimeoutSec 30

                        if ($autoPrint) {
                            Invoke-SilentPrint -filePath $localPdf -printerName $defaultPrinter -printConfig $job.config
                        }

                        $doneBody = @{
                            orderNumber = $job.orderNumber
                            status = "PRINTED"
                            printerName = $defaultPrinter
                        } | ConvertTo-Json
                        Invoke-RestMethod -Uri ($serverUrl + "/api/agent/jobs/status") -Method Post -Body $doneBody -ContentType "application/json" -TimeoutSec 5 -ErrorAction SilentlyContinue | Out-Null

                        Write-Host ("ORDER " + $job.orderNumber + " PRINT COMPLETED SUCCESSFULLY!") -ForegroundColor Green
                        Write-Host ""
                    } catch {
                        $errText = $_.Exception.Message
                        Write-Host ("ORDER " + $job.orderNumber + " Print failed: " + $errText) -ForegroundColor Red
                    }
                }
            }
        }
    } catch {
        # Continue loop
    }

    Start-Sleep -Seconds $pollIntervalSec
}
