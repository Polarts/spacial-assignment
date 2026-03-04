import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { FileMetadata } from '../../common/types/file.types';

export class ListFilesResponseDto {
  @ApiProperty({
    description: 'Array of file metadata',
    type: [FileMetadata],
  })
  items: FileMetadata[];

  @ApiPropertyOptional({
    description: 'Cursor for fetching the next page of results',
    example: 'eyJwcm9qZWN0SWQiOiIxMjMiLCJmaWxlSWQiOiI0NTYifQ==',
  })
  nextCursor?: string;
}
