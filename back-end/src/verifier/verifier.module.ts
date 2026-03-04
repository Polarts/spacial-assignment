import { Module } from '@nestjs/common';
import { S3Service } from '../services/s3.service';
import { DynamoDBService } from '../services/dynamodb.service';

@Module({
  providers: [S3Service, DynamoDBService],
})
export class VerifierModule {}
