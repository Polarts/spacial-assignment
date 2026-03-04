import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v4 as uuidv4 } from 'uuid';
import { S3Service } from '../services/s3.service';
import { DynamoDBService } from '../services/dynamodb.service';
import { FileMetadata, FileStatus, PresignedUploadResponse } from '../common/types/file.types';
import { CreatePresignedUploadDto } from './dto/create-presigned-upload.dto';

@Injectable()
export class UploadsService {
  constructor(
    private readonly s3Service: S3Service,
    private readonly dynamoDBService: DynamoDBService,
    private readonly configService: ConfigService,
  ) {}

  async generatePresignedUpload(
    dto: CreatePresignedUploadDto,
    userId: string,
  ): Promise<PresignedUploadResponse> {
    const fileId = uuidv4();
    const timestamp = new Date().toISOString();
    const s3Key = this.s3Service.getS3Key(dto.projectId, fileId, dto.filename);

    // Create pending record in DynamoDB
    const metadata: FileMetadata = {
      projectId: dto.projectId,
      projectName: dto.projectName,
      fileId,
      filename: dto.filename,
      fileType: dto.fileType,
      contentType: this.getContentType(dto.fileType),
      size: dto.size,
      status: FileStatus.PENDING,
      s3Key,
      uploaderId: userId,
      tags: dto.tags,
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    // DynamoDB composite key
    const sortKey = `${timestamp}#${fileId}`;
    const recordToSave = {
      ...metadata,
      sortKey,
      GSI1PK: dto.projectId,
      GSI1SK: `${dto.fileType}#${timestamp}`,
    };

    await this.dynamoDBService.createFileRecord(recordToSave as any);

    // Generate presigned URL
    const { url, headers } = await this.s3Service.generatePresignedUploadUrl(
      s3Key,
      metadata.contentType,
      {
        fileId,
        projectId: dto.projectId,
        uploaderId: userId,
      },
    );

    return {
      uploadUrl: url,
      headers,
      fileId,
      s3Key,
    };
  }

  private getContentType(fileType: string): string {
    const contentTypeMap: Record<string, string> = {
      pdf: 'application/pdf',
      doc: 'application/msword',
      docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      xls: 'application/vnd.ms-excel',
      xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      png: 'image/png',
      gif: 'image/gif',
      mp4: 'video/mp4',
      mov: 'video/quicktime',
      avi: 'video/x-msvideo',
    };

    return contentTypeMap[fileType] || 'application/octet-stream';
  }
}
