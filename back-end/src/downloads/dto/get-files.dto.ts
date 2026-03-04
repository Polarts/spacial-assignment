import { IsString, IsOptional, IsEnum, IsNumber, Min, Max } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { FileType } from '../../common/types/file.types';
import { Type } from 'class-transformer';

export class GetFilesDto {
  @ApiPropertyOptional({
    enum: FileType,
    description: 'Filter files by type',
    example: FileType.PDF,
    enumName: 'FileType',
  })
  @IsOptional()
  @IsEnum(FileType)
  type?: FileType;

  @ApiPropertyOptional({
    description: 'Maximum number of files to return',
    example: 20,
    minimum: 1,
    maximum: 100,
    default: 50,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 50;

  @ApiPropertyOptional({
    description: 'Pagination cursor for fetching next page of results',
    example: 'eyJwcm9qZWN0SWQiOiIxMjMiLCJmaWxlSWQiOiI0NTYifQ==',
  })
  @IsOptional()
  @IsString()
  cursor?: string;
}
