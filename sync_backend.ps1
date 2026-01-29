$source = "c:\Users\LENOVO\.gemini\antigravity\scratch\proj_angular\AngularProject-version2\backend"
$destination = "C:\xampp\htdocs\backend"

if (Test-Path $source) {
    if (!(Test-Path $destination)) {
        New-Item -ItemType Directory -Force -Path $destination
    }
    Copy-Item -Path "$source\*" -Destination $destination -Recurse -Force
    Write-Host "Backend synced successfully to $destination"
} else {
    Write-Error "Source folder not found: $source"
}
