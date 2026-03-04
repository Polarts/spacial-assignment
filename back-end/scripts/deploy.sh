#!/bin/bash

# Deployment script for Spatial File Repository
set -e

ENVIRONMENT=${1:-dev}
AWS_REGION=${2:-us-east-1}

echo "🚀 Deploying to ${ENVIRONMENT} environment in ${AWS_REGION}"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if environment is valid
if [[ "$ENVIRONMENT" != "dev" && "$ENVIRONMENT" != "prod" ]]; then
    echo -e "${RED}❌ Invalid environment. Use 'dev' or 'prod'${NC}"
    exit 1
fi

# Step 1: Install dependencies
echo -e "\n${YELLOW}📦 Installing dependencies...${NC}"
npm ci

# Step 2: Run tests
echo -e "\n${YELLOW}🧪 Running tests...${NC}"
npm run test

# Step 3: Build application
echo -e "\n${YELLOW}🔨 Building application...${NC}"
npm run build

# Step 4: Check Terraform formatting
echo -e "\n${YELLOW}🔍 Checking Terraform formatting...${NC}"
cd terraform
terraform fmt -check

# Step 5: Initialize Terraform
echo -e "\n${YELLOW}📥 Initializing Terraform...${NC}"
terraform init -upgrade

# Step 6: Validate Terraform
echo -e "\n${YELLOW}✅ Validating Terraform configuration...${NC}"
terraform validate

# Step 7: Plan deployment
echo -e "\n${YELLOW}📋 Planning Terraform deployment...${NC}"
terraform plan -var-file="environments/${ENVIRONMENT}.tfvars" -out=tfplan

# Step 8: Confirm deployment
echo -e "\n${YELLOW}⚠️  Ready to deploy to ${ENVIRONMENT}${NC}"
read -p "Continue with deployment? (yes/no): " CONFIRM

if [[ "$CONFIRM" != "yes" ]]; then
    echo -e "${RED}❌ Deployment cancelled${NC}"
    rm -f tfplan
    exit 0
fi

# Step 9: Apply Terraform
echo -e "\n${YELLOW}🚀 Applying Terraform changes...${NC}"
terraform apply tfplan

# Clean up plan file
rm -f tfplan

# Step 10: Get outputs
echo -e "\n${GREEN}✅ Deployment complete!${NC}"
echo -e "\n${YELLOW}📝 Outputs:${NC}"
terraform output

# Step 11: Save outputs to file
echo -e "\n${YELLOW}💾 Saving outputs to outputs.json...${NC}"
terraform output -json > "../outputs-${ENVIRONMENT}.json"

echo -e "\n${GREEN}🎉 Deployment successful!${NC}"
echo -e "${YELLOW}API Gateway URL:${NC} $(terraform output -raw api_gateway_url)"
echo -e "${YELLOW}CloudFront Domain:${NC} $(terraform output -raw cloudfront_distribution_domain)"
