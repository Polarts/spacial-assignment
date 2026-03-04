import { Controller, Get, Param, Query, Request, HttpException, HttpStatus } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { DownloadsService } from './downloads.service';
import { GetFilesDto } from './dto/get-files.dto';
import { ListFilesResponseDto } from './dto/list-files-response.dto';
import { FileMetadata, PresignedDownloadResponse } from '../common/types/file.types';

@ApiTags('downloads')
@Controller()
export class DownloadsController {
  constructor(private readonly downloadsService: DownloadsService) {}

  @Get('projects/:projectId/files')
  @ApiOperation({
    summary: 'List project files',
    description:
      'Retrieves a paginated list of files for a specific project. Supports filtering by file type and cursor-based pagination.',
  })
  @ApiParam({
    name: 'projectId',
    description: 'Unique identifier of the project',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'List of files successfully retrieved',
    type: ListFilesResponseDto,
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error - Failed to list files',
  })
  @ApiBearerAuth('JWT-auth')
  async getProjectFiles(
    @Param('projectId') projectId: string,
    @Query() query: GetFilesDto,
    @Request() req: any,
  ): Promise<{ items: FileMetadata[]; nextCursor?: string }> {
    try {
      return await this.downloadsService.listProjectFiles(projectId, query);
    } catch (error) {
      throw new HttpException(
        error instanceof Error ? error.message : 'Failed to list files',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('files/:fileId/download')
  @ApiOperation({
    summary: 'Generate presigned URL for file download',
    description:
      'Creates a presigned S3 URL that allows direct file download from AWS S3. The URL expires after a configured time period.',
  })
  @ApiParam({
    name: 'fileId',
    description: 'Unique identifier of the file',
    example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
  })
  @ApiQuery({
    name: 'projectId',
    description: 'Project ID to which the file belongs',
    example: '123e4567-e89b-12d3-a456-426614174000',
    required: true,
  })
  @ApiResponse({
    status: 200,
    description: 'Presigned download URL successfully generated',
    type: PresignedDownloadResponse,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - projectId is required',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error - Failed to generate download URL',
  })
  @ApiBearerAuth('JWT-auth')
  async getDownloadUrl(
    @Param('fileId') fileId: string,
    @Query('projectId') projectId: string,
    @Request() req: any,
  ): Promise<PresignedDownloadResponse> {
    try {
      if (!projectId) {
        throw new HttpException('projectId is required', HttpStatus.BAD_REQUEST);
      }

      return await this.downloadsService.generateDownloadUrl(projectId, fileId);
    } catch (error) {
      throw new HttpException(
        error instanceof Error ? error.message : 'Failed to generate download URL',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
