import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

@Injectable()
export class S3Service {
  private client: S3Client;
  private bucketName: string;

  constructor(private configService: ConfigService) {
    this.client = new S3Client({
      region: this.configService.get('AWS_REGION'),
    });
    this.bucketName = this.configService.get('S3_FILES_BUCKET');
  }

  async generatePresignedUploadUrl(
    s3Key: string,
    contentType: string,
    metadata: Record<string, string>,
  ): Promise<{ url: string; headers: Record<string, string> }> {
    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: s3Key,
      ContentType: contentType,
      Metadata: metadata,
      ServerSideEncryption: 'aws:kms',
    });

    const url = await getSignedUrl(this.client, command, {
      expiresIn: parseInt(this.configService.get('PRESIGNED_URL_EXPIRATION', '3600')),
    });

    return {
      url,
      headers: {
        'Content-Type': contentType,
      },
    };
  }

  async generatePresignedDownloadUrl(s3Key: string): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: this.bucketName,
      Key: s3Key,
    });

    return getSignedUrl(this.client, command, {
      expiresIn: parseInt(this.configService.get('PRESIGNED_URL_EXPIRATION', '3600')),
    });
  }

  async checkFileExists(s3Key: string): Promise<boolean> {
    try {
      const command = new HeadObjectCommand({
        Bucket: this.bucketName,
        Key: s3Key,
      });
      await this.client.send(command);
      return true;
    } catch (error) {
      return false;
    }
  }

  getS3Key(projectId: string, fileId: string, filename: string): string {
    // Extract extension from filename
    const lastDotIndex = filename.lastIndexOf('.');
    const extension = lastDotIndex > 0 ? filename.substring(lastDotIndex + 1) : 'bin';
    return `projects/${projectId}/${fileId}/original.${extension}`;
  }
}
