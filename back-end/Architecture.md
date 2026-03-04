# **Project‑Aware File Repository — Architecture Specification**

***

## **1. Overview**

This document describes a simplified but production‑grade serverless architecture for a **project‑aware file repository** on AWS.  
The system supports:

*   Authentication and authorization by project
*   File upload via pre‑signed URLs
*   File verification via asynchronous processing
*   File listing by project and type
*   Secure file downloads

The architecture is derived directly from the uploaded flow diagrams (Upload Flow + Download Flow).

***

# **2. High‑Level Architecture**

The architecture contains the following major components:

*   **Amazon Cognito** — JWT authentication; provides project membership claims.
*   **Amazon API Gateway** — Public REST interface.
*   **Lambda: Uploader** — Generates pre‑signed PUT URLs; writes pending metadata.
*   **Lambda: Verifier** — Triggered by S3 events; marks files Ready or Failed.
*   **Lambda: Downloader** — Returns pre‑signed GET URLs based on metadata & auth.
*   **Amazon S3** — Stores actual objects in project‑scoped prefixes.
*   **Amazon DynamoDB** — Stores file metadata and supports listing & querying.

***

# **3. Architecture Diagram (based on uploaded image)**

### **3.1 Upload Flow**

*   Client authenticates via Cognito → gets JWT.
*   Client calls **POST /projects/{projectId}/upload**.
*   API Gateway invokes **Lambda: Uploader**.
*   Uploader:
    *   Validates project access.
    *   Writes **Pending** metadata to DynamoDB.
    *   Generates S3 pre‑signed PUT URL and returns it.
*   Client uploads file directly to S3 using the pre‑signed URL.
*   S3 emits ObjectCreated event → triggers **Lambda: Verifier**.
*   Verifier:
    *   Validates the upload (type, size, possibly virus scan in extended version).
    *   Updates item in DynamoDB to **Ready** or **Failed**.

### **3.2 Download Flow**

*   Client authenticates via Cognito.
*   Client calls **GET /projects/{projectId}/files?type={fileType}**.
*   API Gateway invokes **Lambda: Downloader**.
*   Downloader:
    *   Queries DynamoDB for matching files.
    *   Verifies caller has project access.
    *   Generates pre‑signed GET URLs for each file.
*   Client downloads directly from S3.

***

# **4. API Endpoints**

## **4.1 POST /projects/{projectId}/upload**

Generates a pre‑signed upload URL and creates a *Pending* metadata record.

### **Request (JSON)**

```json
{
  "filename": "design.pdf",
  "fileType": "pdf",
  "size": 5242880
}
```

### **Response**

```json
{
  "fileId": "F12345",
  "uploadUrl": "https://s3.amazonaws.com/...",
  "headers": {
    "Content-Type": "application/pdf"
  }
}
```

### **Behavior**

*   Validates JWT → ensures user belongs to the project.
*   Validates filename, type, size policy.
*   Writes `PENDING` item to DynamoDB.
*   Returns pre‑signed PUT URL.

***

## **4.2 GET /projects/{projectId}/files?type={fileType}**

Lists files for a project filtered by fileType.

### **Sample Response**

```json
{
  "items": [
    {
      "fileId": "F12345",
      "filename": "design.pdf",
      "size": 5242880,
      "status": "READY"
    }
  ]
}
```

### **Behavior**

*   Validates JWT & project membership.
*   Queries DynamoDB GSI by `projectId` + `fileType`.
*   Returns list of metadata.

***

## **4.3 GET /files/{fileId}/download**

Returns a pre‑signed GET URL for downloading a single file.

### **Sample Response**

```json
{
  "downloadUrl": "https://s3.amazonaws.com/..."
}
```

### **Behavior**

*   Validates user has access to the file's project.
*   Loads metadata from DynamoDB.
*   Returns S3 pre‑signed GET URL.

***

# **5. Lambda Functions**

## **5.1 Lambda: Uploader**

### **Purpose**

*   Validate upload request.
*   Create pending metadata entry.
*   Generate pre‑signed S3 PUT URL.

### **Inputs**

*   HTTP request (API Gateway)
*   JWT with project claims

### **Outputs**

*   `{uploadUrl, fileId, headers}` JSON response

***

## **5.2 Lambda: Verifier**

### **Trigger**

*   `s3:ObjectCreated:*` event

### **Purpose**

*   Validate the uploaded object:
    *   MIME type checks
    *   Size check
    *   (Optional) Virus scanning
*   Update the DynamoDB item:
    *   `READY` or
    *   `FAILED`

### **Inputs**

*   S3 event record
*   Existing DynamoDB PENDING metadata

### **Outputs**

*   Updated metadata record

***

## **5.3 Lambda: Downloader**

### **Purpose**

*   Validate project access.
*   Query DynamoDB for files matching filters.
*   Generate pre‑signed GET URLs.

### **Inputs**

*   HTTP request
*   JWT project claims
*   DynamoDB lookup / query

### **Outputs**

*   `{items: [...download URLs...]}`

***

# **6. Database Structure (DynamoDB)**

## **Table: Files**

| Field                    | Type   | Description                     |
| ------------------------ | ------ | ------------------------------- |
| **PK: projectId**        | string | Project identifier              |
| **SK: createdAt#fileId** | string | Time‑ordered composite key      |
| **fileId**               | string | Unique file identifier          |
| **filename**             | string | Original filename               |
| **fileType**             | string | Logical type (pdf, image, etc.) |
| **contentType**          | string | MIME type                       |
| **size**                 | number | Size in bytes                   |
| **status**               | string | `PENDING`, `READY`, or `FAILED` |
| **s3Key**                | string | S3 object path                  |
| **uploaderId**           | string | User who initiated upload       |
| **tags**                 | list   | Optional labels                 |
| **derived**              | list   | Thumbnails, extracts, etc.      |
| **retentionAt (TTL)**    | number | Optional TTL timestamp          |

***

## **GSI1 — Files by Type**

Used for: *GET /projects/{projectId}/files?type=…*

*   **GSI1PK:** `projectId`
*   **GSI1SK:** `fileType#createdAt`

***

# **7. S3 Bucket Layout**

    s3://files/
        projects/
            {projectId}/
                {fileId}/
                    original.{ext}
                    thumbnail.jpg      (optional)
                    extract.json       (optional)

All objects use **SSE‑KMS encryption**.

***

# **8. Security Model**

*   **Authentication:**
    *   Cognito User Pool JWT.
*   **Authorization:**
    *   Custom claim: `projects:[P123, P456]`
    *   Lambdas validate project membership before granting access.
*   **S3 Access:**
    *   No public access.
    *   Only via presigned URLs.
*   **Encryption:**
    *   S3 SSE‑KMS.
*   **Input Validation:**
    *   File size, type, and allowed project ID.

***

# **9. Event Flow Summary**

## **Upload**

1.  Client requests pre‑signed PUT.
2.  Uploads file to S3.
3.  S3 event → Verifier Lambda.
4.  Verifier updates DynamoDB to READY or FAILED.

## **Download**

1.  Client lists files or requests specific file.
2.  Downloader Lambda returns pre‑signed GET URL.
3.  Client downloads directly from S3.

***

# **10. Optional Extensions**

Even though the diagram shows a simplified flow, the architecture supports drop‑in enhancements:

*   Virus scanning (Lambda + AV layer)
*   Thumbnails, PDF → text extract, video proxy versions
*   CloudFront distribution + OAC
*   Object lifecycle to Glacier

***
