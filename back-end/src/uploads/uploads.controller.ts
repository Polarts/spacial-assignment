import {
  Controller,
  Post,
  Body,
  Param,
  UseGuards,
  Request,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBearerAuth } from '@nestjs/swagger';
import { UploadsService } from './uploads.service';
import { CreatePresignedUploadDto } from './dto/create-presigned-upload.dto';
import { PresignedUploadResponse } from '../common/types/file.types';

@ApiTags('uploads')
@Controller('projects')
export class UploadsController {
  constructor(private readonly uploadsService: UploadsService) {}

  @Post(':projectId/upload')
  @ApiOperation({
    summary: 'Generate presigned URL for file upload',
    description:
      'Creates a presigned S3 URL that allows direct file upload to AWS S3. The URL expires after a configured time period.',
  })
  @ApiParam({
    name: 'projectId',
    description: 'Unique identifier of the project',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'Presigned upload URL successfully generated',
    type: PresignedUploadResponse,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Project ID mismatch or invalid input',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error - Failed to generate presigned URL',
  })
  @ApiBearerAuth('JWT-auth')
  async createPresignedUpload(
    @Param('projectId') projectId: string,
    @Body() createDto: CreatePresignedUploadDto,
    @Request() req: any,
  ): Promise<PresignedUploadResponse> {
    try {
      // Extract user ID from JWT (would be set by Cognito authorizer in API Gateway)
      const userId = req.user?.sub || 'anonymous';

      // Ensure projectId from URL matches the one in the body
      if (createDto.projectId && createDto.projectId !== projectId) {
        throw new HttpException('Project ID mismatch', HttpStatus.BAD_REQUEST);
      }
      createDto.projectId = projectId;

      return await this.uploadsService.generatePresignedUpload(createDto, userId);
    } catch (error) {
      throw new HttpException(
        error instanceof Error ? error.message : 'Failed to generate presigned URL',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
