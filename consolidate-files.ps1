# Script to consolidate all text files into one, excluding node_modules
# Output file
$outputFile = "consolidated_files.txt"

# Clear output file if it exists
if (Test-Path $outputFile) {
    Clear-Content $outputFile
} else {
    New-Item -Path $outputFile -ItemType File | Out-Null
}

# Counter for processed files
$fileCounter = 0

# Find all files except those in node_modules
Get-ChildItem -Path . -Recurse -File | Where-Object { $_.FullName -notlike "*\node_modules\*" } | ForEach-Object {
    $filePath = $_.FullName
    $relativePath = $filePath.Replace((Get-Location).Path + "\", "")
    $extension = [System.IO.Path]::GetExtension($filePath)
    
    # Skip binary files - basic check by extension
    $binaryExtensions = @(".exe", ".dll", ".obj", ".bin", ".jpg", ".jpeg", ".png", ".gif", ".pdf", ".zip", ".rar", 
                         ".ico", ".svg", ".ttf", ".woff", ".woff2", ".eot", ".mp3", ".mp4", ".webp", ".tif", ".tiff")
    
    if ($binaryExtensions -notcontains $extension) {
        try {
            Write-Host "Processing: $relativePath"
            Add-Content -Path $outputFile -Value "==============================================" -Encoding UTF8
            Add-Content -Path $outputFile -Value "FILE: $relativePath" -Encoding UTF8
            Add-Content -Path $outputFile -Value "==============================================" -Encoding UTF8
            Get-Content -Path $filePath -Raw -Encoding UTF8 -ErrorAction SilentlyContinue | Add-Content -Path $outputFile -Encoding UTF8
            Add-Content -Path $outputFile -Value "`n`n" -Encoding UTF8
            $fileCounter++
        } catch {
            $errorMessage = $_.Exception.Message
            Write-Host "Error processing $relativePath - $errorMessage" -ForegroundColor Red
        }
    }
}

Write-Host "Completed! $fileCounter files have been consolidated into $outputFile" -ForegroundColor Green
