import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { DynamoDBService } from '../services/dynamodb.service';
import { v4 as uuidv4 } from 'uuid';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';

export interface ProjectResponse {
  projectId: string;
  projectName: string;
  fileCount: number;
}

@Injectable()
export class ProjectsService {
  constructor(private readonly dynamoDBService: DynamoDBService) {}

  async getAllProjects(userId: string): Promise<{ projects: ProjectResponse[] }> {
    const projectsMap = await this.dynamoDBService.getAllProjects(userId);

    const projects = Array.from(projectsMap.entries()).map(([projectId, data]) => ({
      projectId,
      projectName: data.name,
      fileCount: data.fileCount,
    }));

    return { projects };
  }

  async createProject(dto: CreateProjectDto, userId: string): Promise<ProjectResponse> {
    const projectId = uuidv4();

    try {
      await this.dynamoDBService.createProject(projectId, dto.projectName, userId);

      return {
        projectId,
        projectName: dto.projectName,
        fileCount: 0,
      };
    } catch (error) {
      if (error instanceof Error && error.name === 'ConditionalCheckFailedException') {
        throw new ConflictException('Project already exists');
      }
      throw error;
    }
  }

  async deleteProject(projectId: string, userId: string): Promise<void> {
    try {
      await this.dynamoDBService.deleteProject(projectId, userId);
    } catch (error) {
      throw new NotFoundException('Project not found or access denied');
    }
  }

  async updateProject(
    projectId: string,
    dto: UpdateProjectDto,
    userId: string,
  ): Promise<ProjectResponse> {
    try {
      await this.dynamoDBService.updateProject(projectId, dto.projectName, userId);

      // Get updated file count
      const projectsMap = await this.dynamoDBService.getAllProjects(userId);
      const projectData = projectsMap.get(projectId);

      return {
        projectId,
        projectName: dto.projectName,
        fileCount: projectData?.fileCount || 0,
      };
    } catch (error) {
      throw new NotFoundException('Project not found or access denied');
    }
  }
}
