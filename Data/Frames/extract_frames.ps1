# --- Configuration ---
$VideoSourceDir = "C:\Users\murat\SeniorProject\Data\Segmented" 
$OutputDir = "C:\Users\murat\SeniorProject\Data\Frames\images"
$FramesPerSecond = 1 
$VideoExtension = "mp4" 
# --- End Configuration ---

if (-not (Test-Path $OutputDir)) {
    New-Item -ItemType Directory -Force -Path $OutputDir | Out-Null
}

Write-Host "Starting frame extraction..."
Write-Host "Source directory: $VideoSourceDir"
Write-Host "Output directory: $OutputDir"
Write-Host "Frames per second: $FramesPerSecond"
Write-Host "Looking for *.$VideoExtension files"

Get-ChildItem -Path $VideoSourceDir -Filter "*.$VideoExtension" -File | ForEach-Object {
    $videoFile = $_.FullName
    $baseNameNoExt = $_.BaseName

    Write-Host "Processing: $($_.Name)"

    ffmpeg -i "$videoFile" -vf "fps=$FramesPerSecond" -qscale:v 2 "$OutputDir\${baseNameNoExt}_frame_%04d.png" -loglevel error

    if ($LASTEXITCODE -eq 0) {
        Write-Host "Successfully extracted frames from $($_.Name)"
    } else {
        Write-Host "ERROR processing $($_.Name). Exit code: $LASTEXITCODE"
    }
}

Write-Host "Frame extraction complete."
Write-Host "Frames saved in: $OutputDir"