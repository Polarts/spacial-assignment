import { Module } from '@nestjs/common';
import { DownloadsController } from './downloads.controller';
import { DownloadsService } from './downloads.service';
import { S3Service } from '../services/s3.service';
import { DynamoDBService } from '../services/dynamodb.service';

@Module({
  controllers: [DownloadsController],
  providers: [DownloadsService, S3Service, DynamoDBService],
})
export class DownloadsModule {}
