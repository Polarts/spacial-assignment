# Quick Start Guide

## Prerequisites

1. **AWS Account** with Administrator access
2. **Node.js** 20.x or later
3. **Terraform** 1.0 or later
4. **AWS CLI** configured with credentials

## Initial Setup (First Time Only)

### 1. Install Dependencies

```bash
npm install
```

### 2. Create Terraform State Bucket

Create an S3 bucket for Terraform state:

```bash
aws s3 mb s3://your-terraform-state-bucket --region us-east-1
aws s3api put-bucket-versioning \
  --bucket your-terraform-state-bucket \
  --versioning-configuration Status=Enabled
```

### 3. Configure Backend

Edit `terraform/main.tf` or use initialization flags:

```bash
cd terraform
terraform init \
  -backend-config="bucket=your-terraform-state-bucket" \
  -backend-config="key=spatial/terraform.tfstate" \
  -backend-config="region=us-east-1"
```

### 4. Review Variables

Edit `terraform/environments/dev.tfvars` for development or `prod.tfvars` for production.

### 5. Deploy Infrastructure

#### Option A: Using Deployment Script (Recommended)

**Linux/Mac:**

```bash
chmod +x scripts/deploy.sh
./scripts/deploy.sh dev
```

**Windows:**

```cmd
scripts\deploy.bat dev
```

#### Option B: Manual Deployment

```bash
# Build application
npm run build

# Deploy with Terraform
cd terraform
terraform plan -var-file=environments/dev.tfvars
terraform apply -var-file=environments/dev.tfvars
```

### 6. Save Outputs

After deployment, save the outputs:

```bash
cd terraform
terraform output -json > ../outputs-dev.json
```

Important outputs:

- `api_gateway_url` - Your API endpoint
- `cognito_user_pool_id` - For authentication
- `cognito_client_id` - For authentication
- `s3_bucket_name` - File storage bucket
- `cloudfront_distribution_domain` - CDN domain

## Testing the API

### 1. Create a Cognito User

```bash
aws cognito-idp sign-up \
  --client-id YOUR_COGNITO_CLIENT_ID \
  --username user@example.com \
  --password 'YourPassword123!' \
  --user-attributes Name=email,Value=user@example.com Name=name,Value="Test User"
```

### 2. Confirm User (Admin)

```bash
aws cognito-idp admin-confirm-sign-up \
  --user-pool-id YOUR_USER_POOL_ID \
  --username user@example.com
```

### 3. Get Authentication Token

```bash
aws cognito-idp initiate-auth \
  --client-id YOUR_COGNITO_CLIENT_ID \
  --auth-flow USER_PASSWORD_AUTH \
  --auth-parameters USERNAME=user@example.com,PASSWORD='YourPassword123!'
```

Save the `IdToken` from the response.

### 4. Test Upload Endpoint

```bash
curl -X POST https://YOUR_API_URL/uploads/presign \
  -H "Authorization: Bearer YOUR_ID_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "projectId": "test-project",
    "fileType": "pdf",
    "filename": "test.pdf",
    "size": 1024
  }'
```

### 5. Upload File to S3

Use the pre-signed URL from step 4:

```bash
curl -X PUT "PRESIGNED_URL" \
  -H "Content-Type: application/pdf" \
  --data-binary "@test.pdf"
```

### 6. List Files

```bash
curl https://YOUR_API_URL/projects/test-project/files \
  -H "Authorization: Bearer YOUR_ID_TOKEN"
```

## Update Deployment

To deploy code changes:

```bash
# Make your changes
# ...

# Build
npm run build

# Redeploy
cd terraform
terraform apply -var-file=environments/dev.tfvars
```

Terraform will detect the changes in the Lambda zip files and update only the necessary resources.

## Local Development

Run NestJS locally (without Lambda):

```bash
# Set local environment variables
cp .env.example .env
# Edit .env with your AWS resource names from Terraform outputs

# Run in development mode
npm run start:dev
```

The API will be available at `http://localhost:3000`.

## Monitoring

### CloudWatch Logs

View Lambda logs:

```bash
# API Lambda
aws logs tail /aws/lambda/spatial-files-api-dev --follow

# Verifier Lambda
aws logs tail /aws/lambda/spatial-files-verifier-dev --follow
```

### API Gateway Logs

```bash
aws logs tail /aws/apigateway/spatial-files-dev --follow
```

### DynamoDB

View table items:

```bash
aws dynamodb scan --table-name spatial-files-files-dev
```

### S3

List uploaded files:

```bash
aws s3 ls s3://spatial-files-dev/projects/ --recursive
```

## Cleanup

To destroy all infrastructure:

**Linux/Mac:**

```bash
chmod +x scripts/destroy.sh
./scripts/destroy.sh dev
```

**Windows:**

```cmd
cd terraform
terraform destroy -var-file=environments\dev.tfvars
```

**Warning:** This will permanently delete all data!

## Troubleshooting

### Lambda Permission Errors

If you get permission errors, check:

1. IAM roles have correct policies
2. KMS key policy allows Lambda
3. S3 bucket policy allows Lambda

### Cognito Token Issues

If authentication fails:

1. Verify user is confirmed
2. Check token hasn't expired (1 hour default)
3. Ensure correct client ID

### S3 Upload Failures

1. Check pre-signed URL hasn't expired
2. Verify Content-Type header matches
3. Check file size limits

### DynamoDB Throttling

If you see throttling:

1. Enable auto-scaling
2. Increase provisioned capacity
3. Or use on-demand billing mode (default)

## Next Steps

1. **Custom Domain**: Add Route 53 and ACM certificate for CloudFront
2. **CI/CD**: Set up GitHub Actions or AWS CodePipeline
3. **Monitoring**: Add CloudWatch Dashboards and Alarms
4. **Security**: Implement AWS Secrets Manager for sensitive data
5. **Backup**: Configure automated S3 and DynamoDB backups
6. **Multi-Region**: Replicate to additional AWS regions

## Support

For issues, questions, or contributions, please refer to the main README.md.
