$source = "c:\Users\msi-cyborg\.gemini\antigravity\scratch\angular-project-main\backend"
$destination = "C:\wamp64\www\backend"

if (Test-Path $source) {
    if (!(Test-Path $destination)) {
        New-Item -ItemType Directory -Force -Path $destination
    }
    Copy-Item -Path "$source\*" -Destination $destination -Recurse -Force
    Write-Host "Backend synced successfully to $destination"
} else {
    Write-Error "Source folder not found: $source"
}
