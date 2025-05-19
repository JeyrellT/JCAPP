# Script to build and deploy the Lean Six Sigma App to GitHub Pages
# Target Repository: https://github.com/JeyrellT/JCAPP

# Set error action preference
$ErrorActionPreference = "Stop"

# Configuration
$repositoryUrl = "https://github.com/JeyrellT/JCAPP.git"
$branchName = "main"
$ghPagesBranch = "gh-pages"
$buildDir = "./dist"

Write-Host "Starting GitHub Pages deployment process..." -ForegroundColor Cyan

# Check if npm is installed
try {
    $npmVersion = npm --version
    Write-Host "npm detected: $npmVersion" -ForegroundColor Green
} catch {
    Write-Host "Error: npm is not installed or not in PATH. Please install Node.js and npm and try again." -ForegroundColor Red
    exit 1
}

# Build the project
Write-Host "Building the project..." -ForegroundColor Yellow
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "Error building the project" -ForegroundColor Red
    exit 1
}

# Verify build directory exists
if (-not (Test-Path $buildDir)) {
    Write-Host "Error: Build directory '$buildDir' not found. Build may have failed." -ForegroundColor Red
    exit 1
}

# Create a temporary directory for the gh-pages branch
$tempDir = [System.IO.Path]::GetTempPath() + [System.Guid]::NewGuid().ToString()
Write-Host "Creating temporary directory for deployment: $tempDir" -ForegroundColor Yellow
New-Item -ItemType Directory -Path $tempDir | Out-Null

# Copy build files to temporary directory
Write-Host "Copying build files to temporary directory..." -ForegroundColor Yellow
Copy-Item -Path "$buildDir\*" -Destination $tempDir -Recurse

# Initialize git in temporary directory
Set-Location $tempDir
git init
if ($LASTEXITCODE -ne 0) {
    Write-Host "Error initializing git repository in temporary directory" -ForegroundColor Red
    exit 1
}

# Add remote
git remote add origin $repositoryUrl
if ($LASTEXITCODE -ne 0) {
    Write-Host "Error adding remote" -ForegroundColor Red
    exit 1
}

# Create and checkout gh-pages branch
git checkout -b $ghPagesBranch
if ($LASTEXITCODE -ne 0) {
    Write-Host "Error creating gh-pages branch" -ForegroundColor Red
    exit 1
}

# Add all files
git add -A
if ($LASTEXITCODE -ne 0) {
    Write-Host "Error adding files" -ForegroundColor Red
    exit 1
}

# Commit
git commit -m "Deploy to GitHub Pages"
if ($LASTEXITCODE -ne 0) {
    Write-Host "Error committing changes" -ForegroundColor Red
    exit 1
}

# Push to GitHub Pages
Write-Host "Pushing to GitHub Pages..." -ForegroundColor Yellow
git push -f origin $ghPagesBranch
if ($LASTEXITCODE -ne 0) {
    Write-Host "Error pushing to GitHub. You might need to authenticate." -ForegroundColor Red
    exit 1
} else {
    Write-Host "Successfully deployed to GitHub Pages!" -ForegroundColor Green
    Write-Host "Your application should be available at: https://jeyrellt.github.io/JCAPP/" -ForegroundColor Cyan
}

# Clean up
Set-Location -Path (Split-Path -Parent $tempDir)
Remove-Item -Path $tempDir -Recurse -Force
Write-Host "Temporary directory cleaned up" -ForegroundColor Green

# Return to project directory
Set-Location -Path (Get-Location | Split-Path -Parent)

Write-Host "Deployment completed successfully!" -ForegroundColor Green
