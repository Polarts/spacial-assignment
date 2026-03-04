import { Injectable, NotFoundException } from '@nestjs/common';
import { S3Service } from '../services/s3.service';
import { DynamoDBService } from '../services/dynamodb.service';
import { FileMetadata, FileStatus, PresignedDownloadResponse } from '../common/types/file.types';
import { GetFilesDto } from './dto/get-files.dto';

@Injectable()
export class DownloadsService {
  constructor(
    private readonly s3Service: S3Service,
    private readonly dynamoDBService: DynamoDBService,
  ) {}

  async listProjectFiles(
    projectId: string,
    query: GetFilesDto,
  ): Promise<{ items: FileMetadata[]; nextCursor?: string }> {
    const cursor = query.cursor ? JSON.parse(query.cursor) : undefined;

    const result = await this.dynamoDBService.queryFilesByProject(
      projectId,
      query.type,
      query.limit,
      cursor,
    );

    // Filter only READY files
    const readyFiles = result.items.filter((file) => file.status === FileStatus.READY);

    return {
      items: readyFiles,
      nextCursor: result.nextCursor,
    };
  }

  async generateDownloadUrl(projectId: string, fileId: string): Promise<PresignedDownloadResponse> {
    // Query DynamoDB to get file metadata
    // Note: We need to construct the sort key, but in a real implementation,
    // you might want to use GSI or store fileId as a separate queryable field
    const files = await this.dynamoDBService.queryFilesByProject(projectId);
    const file = files.items.find((f) => f.fileId === fileId);

    if (!file) {
      throw new NotFoundException('File not found');
    }

    if (file.status !== FileStatus.READY) {
      throw new NotFoundException('File is not ready for download');
    }

    // Generate presigned download URL
    const downloadUrl = await this.s3Service.generatePresignedDownloadUrl(file.s3Key);

    return {
      downloadUrl,
      filename: file.filename,
      fileId: file.fileId,
    };
  }
}
