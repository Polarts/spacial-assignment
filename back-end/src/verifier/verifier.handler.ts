import { Handler, S3Event } from 'aws-lambda';
import { DynamoDBService } from '../services/dynamodb.service';
import { S3Service } from '../services/s3.service';
import { FileStatus } from '../common/types/file.types';
import { ConfigService } from '@nestjs/config';

const dynamoDBService = new DynamoDBService(new ConfigService());
const s3Service = new S3Service(new ConfigService());

export const handler: Handler = async (event: S3Event) => {
  console.log('S3 Event received:', JSON.stringify(event, null, 2));

  for (const record of event.Records) {
    const bucket = record.s3.bucket.name;
    const key = decodeURIComponent(record.s3.object.key.replace(/\+/g, ' '));
    const size = record.s3.object.size;

    try {
      // Parse S3 key to extract projectId and fileId
      // Format: projects/{projectId}/{fileId}/original.{ext}
      const keyParts = key.split('/');
      if (
        keyParts.length < 4 ||
        keyParts[0] !== 'projects' ||
        keyParts[3].indexOf('original.') !== 0
      ) {
        console.warn(`Invalid S3 key format: ${key}`);
        continue;
      }

      const projectId = keyParts[1];
      const fileId = keyParts[2];

      // Validate file (simplified - in production, add virus scan, MIME validation)
      const isValid = await validateFile(bucket, key, size);

      if (isValid) {
        // Update DynamoDB record to READY
        // Note: In production, you'd need to fetch the exact sort key
        const files = await dynamoDBService.queryFilesByProject(projectId);
        const file = files.items.find((f) => f.fileId === fileId);

        if (file) {
          const sortKey = `${file.createdAt}#${fileId}`;
          await dynamoDBService.updateFileStatus(projectId, sortKey, FileStatus.READY, {
            checksum: 'placeholder-checksum', // Calculate actual checksum
          });
          console.log(`File ${fileId} marked as READY`);
        }
      } else {
        // Mark as FAILED
        const files = await dynamoDBService.queryFilesByProject(projectId);
        const file = files.items.find((f) => f.fileId === fileId);

        if (file) {
          const sortKey = `${file.createdAt}#${fileId}`;
          await dynamoDBService.updateFileStatus(projectId, sortKey, FileStatus.FAILED);
          console.log(`File ${fileId} marked as FAILED`);
        }
      }
    } catch (error) {
      console.error(`Error processing file ${key}:`, error);
      // In production, send to DLQ or SNS for alerts
    }
  }

  return {
    statusCode: 200,
    body: JSON.stringify({ message: 'Processing complete' }),
  };
};

async function validateFile(bucket: string, key: string, size: number): Promise<boolean> {
  // Simplified validation
  // In production:
  // 1. Scan with ClamAV or similar
  // 2. Validate MIME type matches declared type
  // 3. Check file integrity
  // 4. Validate file size limits

  // For now, just check if file exists
  const maxSize = 100 * 1024 * 1024; // 100MB
  if (size > maxSize) {
    console.error(`File too large: ${size} bytes`);
    return false;
  }

  return true;
}
