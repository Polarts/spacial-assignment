import { Module } from '@nestjs/common';
import { ProjectsController } from './projects.controller';
import { ProjectsService } from './projects.service';
import { DynamoDBService } from '../services/dynamodb.service';

@Module({
  controllers: [ProjectsController],
  providers: [ProjectsService, DynamoDBService],
  exports: [ProjectsService],
})
export class ProjectsModule {}
