# Script to sync the Lean Six Sigma App to GitHub
# Target Repository: https://github.com/JeyrellT/JCAPP

# Configuration
$repositoryUrl = "https://github.com/JeyrellT/JCAPP.git"
$branchName = "main"
$commitMessage = "Sync Lean Six Sigma App"

Write-Host "Starting GitHub synchronization process..." -ForegroundColor Cyan

# Check if git is installed
try {
    $gitVersion = git --version
    Write-Host "Git detected: $gitVersion" -ForegroundColor Green
} catch {
    Write-Host "Error: Git is not installed or not in PATH. Please install Git and try again." -ForegroundColor Red
    Write-Host "You can download Git from https://git-scm.com/downloads" -ForegroundColor Yellow
    exit 1
}

# Check if the folder is already a git repository
if (Test-Path ".git") {
    Write-Host "Git repository already initialized" -ForegroundColor Green
} else {
    # Initialize git repository
    Write-Host "Initializing git repository..." -ForegroundColor Yellow
    git init
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Error initializing git repository" -ForegroundColor Red
        exit 1
    }
}

# Check if remote origin exists
$remoteExists = git remote | Where-Object { $_ -eq "origin" }
if ($remoteExists) {
    # Update remote URL if it's different
    $currentRemote = git remote get-url origin
    if ($currentRemote -ne $repositoryUrl) {
        Write-Host "Updating remote URL to $repositoryUrl" -ForegroundColor Yellow
        git remote set-url origin $repositoryUrl
    } else {
        Write-Host "Remote already set to $repositoryUrl" -ForegroundColor Green
    }
} else {
    # Add remote
    Write-Host "Adding remote origin: $repositoryUrl" -ForegroundColor Yellow
    git remote add origin $repositoryUrl
}

# Create .gitignore if it doesn't exist
if (-not (Test-Path ".gitignore")) {
    Write-Host "Creating .gitignore file..." -ForegroundColor Yellow
    @"
# Dependency directories
node_modules/
npm-debug.log
yarn-debug.log
yarn-error.log

# Build outputs
dist/
build/

# Environment variables
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# Editor directories and files
.idea/
.vscode/
*.suo
*.ntvs*
*.njsproj
*.sln
*.sw?

# OS specific
.DS_Store
Thumbs.db

# Consolidated files output
consolidated_files.txt
"@ | Out-File -FilePath ".gitignore" -Encoding utf8
    Write-Host ".gitignore file created" -ForegroundColor Green
}

# Stage all files
Write-Host "Staging files..." -ForegroundColor Yellow
git add .
if ($LASTEXITCODE -ne 0) {
    Write-Host "Error staging files" -ForegroundColor Red
    exit 1
}

# Commit changes
Write-Host "Committing changes..." -ForegroundColor Yellow
git commit -m $commitMessage
if ($LASTEXITCODE -ne 0) {
    Write-Host "No changes to commit or error in commit process" -ForegroundColor Yellow
}

# Push to GitHub (will ask for credentials if not already authenticated)
Write-Host "Pushing to GitHub..." -ForegroundColor Yellow
git push -u origin $branchName
if ($LASTEXITCODE -ne 0) {
    Write-Host "Error pushing to GitHub. You might need to:" -ForegroundColor Red
    Write-Host "1. Make sure you have the right permissions for the repository" -ForegroundColor Yellow
    Write-Host "2. Try authenticating with a personal access token if using HTTPS" -ForegroundColor Yellow
    Write-Host "3. Check your network connection" -ForegroundColor Yellow
    exit 1
} else {
    Write-Host "Successfully pushed to GitHub!" -ForegroundColor Green
    Write-Host "Your project is now available at: $repositoryUrl" -ForegroundColor Cyan
}

Write-Host "Synchronization completed successfully!" -ForegroundColor Green