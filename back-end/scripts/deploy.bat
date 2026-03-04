@echo off
REM Deployment script for Windows
setlocal enabledelayedexpansion

set ENVIRONMENT=%1
if "%ENVIRONMENT%"=="" set ENVIRONMENT=dev

set AWS_REGION=%2
if "%AWS_REGION%"=="" set AWS_REGION=us-east-1

echo.
echo ========================================
echo   Deploying to %ENVIRONMENT% environment
echo ========================================
echo.

REM Check if environment is valid
if not "%ENVIRONMENT%"=="dev" if not "%ENVIRONMENT%"=="prod" (
    echo [ERROR] Invalid environment. Use 'dev' or 'prod'
    exit /b 1
)

REM Install dependencies
echo [1/10] Installing dependencies...
call npm ci
if errorlevel 1 (
    echo [ERROR] Failed to install dependencies
    exit /b 1
)

REM Run tests
echo.
echo [2/10] Running tests...
call npm run test
if errorlevel 1 (
    echo [ERROR] Tests failed
    exit /b 1
)

REM Build application
echo.
echo [3/10] Building application...
call npm run build
if errorlevel 1 (
    echo [ERROR] Build failed
    exit /b 1
)

REM Navigate to terraform directory
cd terraform

REM Check Terraform formatting
echo.
echo [4/10] Checking Terraform formatting...
terraform fmt -check
if errorlevel 1 (
    echo [WARNING] Terraform files are not formatted. Running terraform fmt...
    terraform fmt -recursive
)

REM Initialize Terraform
echo.
echo [5/10] Initializing Terraform...
terraform init -upgrade
if errorlevel 1 (
    echo [ERROR] Terraform init failed
    exit /b 1
)

REM Validate Terraform
echo.
echo [6/10] Validating Terraform configuration...
terraform validate
if errorlevel 1 (
    echo [ERROR] Terraform validation failed
    exit /b 1
)

REM Plan deployment
echo.
echo [7/10] Planning Terraform deployment...
terraform plan -var-file="environments\%ENVIRONMENT%.tfvars" -out=tfplan
if errorlevel 1 (
    echo [ERROR] Terraform plan failed
    exit /b 1
)

REM Confirm deployment
echo.
echo [8/10] Ready to deploy to %ENVIRONMENT%
set /p CONFIRM="Continue with deployment? (yes/no): "
if not "%CONFIRM%"=="yes" (
    echo [INFO] Deployment cancelled
    del tfplan 2>nul
    exit /b 0
)

REM Apply Terraform
echo.
echo [9/10] Applying Terraform changes...
terraform apply tfplan
if errorlevel 1 (
    echo [ERROR] Terraform apply failed
    exit /b 1
)

REM Clean up
del tfplan 2>nul

REM Get outputs
echo.
echo [10/10] Deployment complete!
echo.
echo Outputs:
terraform output

REM Save outputs
echo.
echo Saving outputs to outputs-%ENVIRONMENT%.json...
terraform output -json > "..\outputs-%ENVIRONMENT%.json"

echo.
echo ========================================
echo   Deployment Successful!
echo ========================================
echo.
echo API Gateway URL:
terraform output -raw api_gateway_url
echo.
echo CloudFront Domain:
terraform output -raw cloudfront_distribution_domain
echo.

cd ..
