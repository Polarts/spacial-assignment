import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum FileType {
  PDF = 'pdf',
  DOC = 'doc',
  DOCX = 'docx',
  XLS = 'xls',
  XLSX = 'xlsx',
  JPG = 'jpg',
  JPEG = 'jpeg',
  PNG = 'png',
  GIF = 'gif',
  MP4 = 'mp4',
  MOV = 'mov',
  AVI = 'avi',
}

export enum FileStatus {
  PENDING = 'PENDING',
  READY = 'READY',
  FAILED = 'FAILED',
}

export class FileMetadata {
  @ApiProperty({
    description: 'Project identifier',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  projectId: string;

  @ApiProperty({ description: 'Project name', example: 'Marketing Campaign Q1' })
  projectName: string;

  @ApiProperty({ description: 'File identifier', example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' })
  fileId: string;

  @ApiProperty({ description: 'Original filename', example: 'document.pdf' })
  filename: string;

  @ApiProperty({ enum: FileType, description: 'File type', example: FileType.PDF })
  fileType: FileType;

  @ApiProperty({ description: 'MIME type', example: 'application/pdf' })
  contentType: string;

  @ApiProperty({ description: 'File size in bytes', example: 1048576 })
  size: number;

  @ApiPropertyOptional({ description: 'File checksum', example: 'a1b2c3d4e5f6...' })
  checksum?: string;

  @ApiProperty({
    enum: FileStatus,
    description: 'File processing status',
    example: FileStatus.READY,
  })
  status: FileStatus;

  @ApiProperty({ description: 'S3 object key', example: 'projects/123/files/456.pdf' })
  s3Key: string;

  @ApiProperty({ description: 'User ID who uploaded the file', example: 'user-123' })
  uploaderId: string;

  @ApiPropertyOptional({
    description: 'File tags',
    example: ['invoice', 'q1-2024'],
    type: [String],
  })
  tags?: string[];

  @ApiPropertyOptional({
    description: 'Derived metadata',
    example: { pages: 10, author: 'John Doe' },
  })
  derived?: Record<string, any>;

  @ApiProperty({ description: 'Creation timestamp', example: '2024-03-01T10:00:00Z' })
  createdAt: string;

  @ApiProperty({ description: 'Last update timestamp', example: '2024-03-01T10:05:00Z' })
  updatedAt: string;

  @ApiPropertyOptional({ description: 'Retention expiry timestamp', example: 1735689600 })
  retentionAt?: number;
}

export class PresignedUploadResponse {
  @ApiProperty({
    description: 'Presigned S3 upload URL',
    example: 'https://s3.amazonaws.com/bucket/key?signature=...',
  })
  uploadUrl: string;

  @ApiProperty({
    description: 'Headers to include in upload request',
    example: { 'x-amz-server-side-encryption': 'aws:kms' },
  })
  headers: Record<string, string>;

  @ApiProperty({
    description: 'Generated file ID',
    example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
  })
  fileId: string;

  @ApiProperty({ description: 'S3 object key', example: 'projects/123/files/456.pdf' })
  s3Key: string;
}

export class PresignedDownloadResponse {
  @ApiProperty({
    description: 'Presigned S3 download URL',
    example: 'https://s3.amazonaws.com/bucket/key?signature=...',
  })
  downloadUrl: string;

  @ApiProperty({ description: 'Original filename', example: 'document.pdf' })
  filename: string;

  @ApiProperty({ description: 'File identifier', example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' })
  fileId: string;
}
