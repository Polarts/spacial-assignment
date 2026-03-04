import {
  IsString,
  IsEnum,
  IsNumber,
  IsNotEmpty,
  Min,
  Max,
  IsOptional,
  IsArray,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { FileType } from '../../common/types/file.types';

export class CreatePresignedUploadDto {
  @ApiPropertyOptional({
    description: 'Project ID (will be overridden by URL parameter)',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsString()
  @IsOptional()
  projectId?: string;

  @ApiProperty({
    description: 'Name of the project',
    example: 'Marketing Campaign Q1',
  })
  @IsString()
  @IsNotEmpty()
  projectName: string;

  @ApiProperty({
    enum: FileType,
    description: 'Type of file being uploaded',
    example: FileType.PDF,
    enumName: 'FileType',
  })
  @IsEnum(FileType)
  fileType: FileType;

  @ApiProperty({
    description: 'Name of the file',
    example: 'document.pdf',
    minLength: 1,
  })
  @IsString()
  @IsNotEmpty()
  filename: string;

  @ApiProperty({
    description: 'Size of the file in bytes',
    example: 1048576,
    minimum: 1,
    maximum: 104857600,
  })
  @IsNumber()
  @Min(1)
  @Max(100 * 1024 * 1024) // 100MB max
  size: number;

  @ApiPropertyOptional({
    description: 'Optional tags for file categorization',
    example: ['invoice', 'q1-2024'],
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];
}
