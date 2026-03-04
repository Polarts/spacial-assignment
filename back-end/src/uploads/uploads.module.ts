import { Module } from '@nestjs/common';
import { UploadsController } from './uploads.controller';
import { UploadsService } from './uploads.service';
import { S3Service } from '../services/s3.service';
import { DynamoDBService } from '../services/dynamodb.service';

@Module({
  controllers: [UploadsController],
  providers: [UploadsService, S3Service, DynamoDBService],
})
export class UploadsModule {}
