# Spatial File Repository - Serverless Backend

A serverless file repository built with NestJS and deployed on AWS Lambda using Terraform.

## Architecture

This application implements a project-aware file repository with the following AWS services:

- **Amazon Cognito** - User authentication and authorization
- **API Gateway** - RESTful API endpoint
- **AWS Lambda** - Serverless compute (NestJS application)
- **Amazon S3** - Object storage with encryption
- **Amazon DynamoDB** - File metadata and indexes
- **AWS KMS** - Encryption key management
- **Amazon CloudFront** - CDN for file delivery
- **AWS WAF** - Web application firewall

## Project Structure

```
├── src/
│   ├── common/
│   │   └── types/          # Shared types and interfaces
│   ├── services/           # AWS service integrations
│   │   ├── dynamodb.service.ts
│   │   └── s3.service.ts
│   ├── uploads/            # Upload functionality
│   │   ├── dto/
│   │   ├── uploads.controller.ts
│   │   ├── uploads.service.ts
│   │   └── uploads.module.ts
│   ├── downloads/          # Download functionality
│   │   ├── dto/
│   │   ├── downloads.controller.ts
│   │   ├── downloads.service.ts
│   │   └── downloads.module.ts
│   ├── verifier/           # Post-upload processing
│   │   ├── verifier.handler.ts
│   │   └── verifier.module.ts
│   ├── app.module.ts
│   ├── main.ts             # Local development entry point
│   └── lambda.ts           # Lambda handler
├── terraform/              # Infrastructure as Code
│   ├── main.tf
│   ├── variables.tf
│   ├── outputs.tf
│   ├── s3.tf
│   ├── dynamodb.tf
│   ├── lambda.tf
│   ├── api-gateway.tf
│   ├── cognito.tf
│   ├── cloudfront.tf
│   ├── waf.tf
│   ├── kms.tf
│   ├── iam.tf
│   └── environments/
│       ├── dev.tfvars
│       └── prod.tfvars
└── package.json
```

## Prerequisites

- Node.js 20.x or later
- npm or yarn
- AWS CLI configured with appropriate credentials
- Terraform 1.0 or later
- AWS Account with appropriate permissions

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

Copy the example environment file and configure:

```bash
cp .env.example .env
```

Edit `.env` with your AWS configuration (note: these will be set by Terraform after deployment).

### 3. Build the Application

```bash
npm run build
```

### 4. Deploy Infrastructure

#### Initialize Terraform

```bash
cd terraform
terraform init -backend-config="bucket=your-terraform-state-bucket" \
               -backend-config="key=spatial/terraform.tfstate" \
               -backend-config="region=us-east-1"
```

#### Plan Deployment

```bash
# For development
terraform plan -var-file=environments/dev.tfvars

# For production
terraform plan -var-file=environments/prod.tfvars
```

#### Apply Infrastructure

```bash
# For development
terraform apply -var-file=environments/dev.tfvars

# For production
terraform apply -var-file=environments/prod.tfvars
```

### 5. Get Outputs

After deployment, Terraform will output important values:

```bash
terraform output
```

Save these values and update your `.env` file or application configuration.

## API Endpoints

### Authentication

All endpoints require Cognito JWT authentication. Include the token in the `Authorization` header:

```
Authorization: Bearer <JWT_TOKEN>
```

### Upload Flow

#### 1. Request Pre-signed Upload URL

```http
POST /uploads/presign
Content-Type: application/json

{
  "projectId": "project-123",
  "fileType": "pdf",
  "filename": "document.pdf",
  "size": 5242880
}
```

**Response:**

```json
{
  "uploadUrl": "https://s3.amazonaws.com/...",
  "headers": {
    "Content-Type": "application/pdf"
  },
  "fileId": "uuid-v4",
  "s3Key": "projects/project-123/uuid-v4/document.pdf"
}
```

#### 2. Upload File to S3

Use the pre-signed URL to upload directly to S3:

```bash
curl -X PUT "<uploadUrl>" \
  -H "Content-Type: application/pdf" \
  --data-binary "@document.pdf"
```

#### 3. File Verification

The file is automatically verified by a Lambda function triggered by S3 events. The DynamoDB record is updated to `READY` or `FAILED` status.

### Download Flow

#### 1. List Project Files

```http
GET /projects/{projectId}/files?type=pdf&limit=50&cursor=<nextCursor>
```

**Query Parameters:**

- `type` (optional): Filter by file type (pdf, jpg, mp4, etc.)
- `limit` (optional): Number of results (1-100, default: 50)
- `cursor` (optional): Pagination cursor from previous response

**Response:**

```json
{
  "items": [
    {
      "fileId": "uuid-v4",
      "filename": "document.pdf",
      "fileType": "pdf",
      "contentType": "application/pdf",
      "size": 5242880,
      "status": "READY",
      "uploaderId": "user-id",
      "createdAt": "2026-03-04T10:00:00Z",
      "updatedAt": "2026-03-04T10:01:00Z"
    }
  ],
  "nextCursor": "eyJwcm9qZWN0SWQiOi..."
}
```

#### 2. Get Download URL

```http
GET /files/{fileId}/download?projectId={projectId}
```

**Response:**

```json
{
  "downloadUrl": "https://s3.amazonaws.com/...",
  "filename": "document.pdf",
  "fileId": "uuid-v4"
}
```

## Development

### Run Locally

```bash
npm run start:dev
```

The API will be available at `http://localhost:3000`.

### Run Tests

```bash
npm run test
npm run test:cov
```

### Format Code

```bash
npm run format
```

### Lint Code

```bash
npm run lint
```

## Deployment

### Update Lambda Function

After making code changes:

1. Build the application:

   ```bash
   npm run build
   ```

2. Redeploy with Terraform:
   ```bash
   cd terraform
   terraform apply -var-file=environments/dev.tfvars
   ```

## DynamoDB Schema

### Files Table

- **Primary Key:**
  - `projectId` (HASH): Project identifier
  - `sortKey` (RANGE): `{ISO_TIMESTAMP}#{fileId}`

- **Attributes:**
  - `fileId`: Unique file identifier
  - `filename`: Original filename
  - `fileType`: File type (pdf, jpg, etc.)
  - `contentType`: MIME type
  - `size`: File size in bytes
  - `checksum`: File checksum
  - `status`: PENDING | READY | FAILED
  - `s3Key`: S3 object key
  - `uploaderId`: User who uploaded the file
  - `tags`: Array of tags
  - `derived`: Derived metadata (thumbnails, etc.)
  - `createdAt`: ISO timestamp
  - `updatedAt`: ISO timestamp
  - `retentionAt`: TTL timestamp

- **Global Secondary Indexes:**
  - **GSI1**: Query by file type
    - `GSI1PK`: `projectId`
    - `GSI1SK`: `{fileType}#{createdAt}`
  - **GSI2**: Query by uploader
    - `GSI2PK`: `uploaderId`
    - `GSI2SK`: `createdAt`

## S3 Structure

Files are stored in S3 with the following key structure:

```
projects/{projectId}/{fileId}/{originalFilename}
```

Example:

```
projects/project-123/550e8400-e29b-41d4-a716-446655440000/document.pdf
```

## Security Features

- **Encryption at Rest**: All data encrypted with AWS KMS
- **Encryption in Transit**: TLS 1.2+
- **Authentication**: Cognito JWT tokens
- **Authorization**: Project-based access control
- **WAF Protection**: Rate limiting and OWASP rules
- **Pre-signed URLs**: Time-limited access to S3 objects
- **Private S3 Bucket**: No public access
- **CloudFront OAC**: Secure CDN access to S3

## Cost Optimization

- DynamoDB: On-Demand pricing for unpredictable workloads
- S3: Lifecycle policies for automatic archival
- Lambda: Pay-per-invocation with reserved concurrency
- CloudFront: Reduced egress costs
- S3 Intelligent-Tiering: Automatic cost optimization

## Monitoring and Logging

- CloudWatch Logs for Lambda and API Gateway
- X-Ray tracing enabled
- CloudWatch Metrics for all services
- WAF logging and metrics

## Troubleshooting

### Lambda Timeouts

Increase timeout in `terraform/variables.tf`:

```hcl
variable "lambda_timeout" {
  default = 60
}
```

### DynamoDB Throttling

Switch to provisioned capacity or increase on-demand limits.

### Large File Uploads

For files >100MB, implement multipart upload in the client.

## License

MIT

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## Support

For issues and questions, please open a GitHub issue.
