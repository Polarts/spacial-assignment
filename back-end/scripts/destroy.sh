#!/bin/bash

# Script to destroy infrastructure
set -e

ENVIRONMENT=${1:-dev}

echo "⚠️  WARNING: This will destroy all infrastructure for ${ENVIRONMENT} environment"
echo "This action cannot be undone!"
echo ""
read -p "Type 'destroy' to confirm: " CONFIRM

if [[ "$CONFIRM" != "destroy" ]]; then
    echo "❌ Destruction cancelled"
    exit 0
fi

cd terraform

echo "🔥 Destroying infrastructure..."
terraform destroy -var-file="environments/${ENVIRONMENT}.tfvars"

echo "✅ Infrastructure destroyed"
