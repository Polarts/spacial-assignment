import {
  Controller,
  Get,
  Post,
  Delete,
  Put,
  Param,
  Body,
  HttpException,
  HttpStatus,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { ProjectsService, ProjectResponse } from './projects.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';

@ApiTags('projects')
@Controller('projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Get()
  @ApiOperation({
    summary: 'Get all projects for the authenticated user',
    description:
      'Retrieves a list of all projects belonging to the authenticated user with their names and file counts.',
  })
  @ApiResponse({
    status: 200,
    description: 'List of projects successfully retrieved',
    schema: {
      type: 'object',
      properties: {
        projects: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              projectId: {
                type: 'string',
                description: 'Unique identifier of the project',
                example: '123e4567-e89b-12d3-a456-426614174000',
              },
              projectName: {
                type: 'string',
                description: 'Name of the project',
                example: 'Marketing Campaign Q1',
              },
              fileCount: {
                type: 'number',
                description: 'Number of files in the project',
                example: 5,
              },
            },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error - Failed to retrieve projects',
  })
  @ApiBearerAuth('JWT-auth')
  async getAllProjects(@Request() req: any): Promise<{ projects: ProjectResponse[] }> {
    try {
      const userId = req.user?.sub || 'anonymous';
      return await this.projectsService.getAllProjects(userId);
    } catch (error) {
      throw new HttpException('Failed to retrieve projects', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Post()
  @ApiOperation({
    summary: 'Create a new project',
    description: 'Creates a new empty project for the authenticated user.',
  })
  @ApiResponse({
    status: 201,
    description: 'Project successfully created',
    schema: {
      type: 'object',
      properties: {
        projectId: {
          type: 'string',
          description: 'Unique identifier of the created project',
          example: '123e4567-e89b-12d3-a456-426614174000',
        },
        projectName: {
          type: 'string',
          description: 'Name of the project',
          example: 'Marketing Campaign Q1',
        },
        fileCount: {
          type: 'number',
          description: 'Number of files (always 0 for new projects)',
          example: 0,
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Invalid input',
  })
  @ApiResponse({
    status: 409,
    description: 'Conflict - Project already exists',
  })
  @ApiBearerAuth('JWT-auth')
  async createProject(
    @Body() createProjectDto: CreateProjectDto,
    @Request() req: any,
  ): Promise<ProjectResponse> {
    try {
      const userId = req.user?.sub || 'anonymous';
      return await this.projectsService.createProject(createProjectDto, userId);
    } catch (error) {
      if (error instanceof HttpException && error.getStatus() === HttpStatus.CONFLICT) {
        throw error;
      }
      throw new HttpException('Failed to create project', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Delete(':projectId')
  @ApiOperation({
    summary: 'Delete a project',
    description: 'Deletes a project and all its files. Only the project owner can delete it.',
  })
  @ApiParam({
    name: 'projectId',
    description: 'Unique identifier of the project to delete',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 204,
    description: 'Project successfully deleted',
  })
  @ApiResponse({
    status: 404,
    description: 'Project not found or access denied',
  })
  @ApiBearerAuth('JWT-auth')
  async deleteProject(@Param('projectId') projectId: string, @Request() req: any): Promise<void> {
    try {
      const userId = req.user?.sub || 'anonymous';
      await this.projectsService.deleteProject(projectId, userId);
    } catch (error) {
      if (error instanceof HttpException && error.getStatus() === HttpStatus.NOT_FOUND) {
        throw error;
      }
      throw new HttpException('Failed to delete project', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Put(':projectId')
  @ApiOperation({
    summary: 'Update a project name',
    description: 'Updates the name of an existing project. Only the project owner can update it.',
  })
  @ApiParam({
    name: 'projectId',
    description: 'Unique identifier of the project to update',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'Project successfully updated',
    schema: {
      type: 'object',
      properties: {
        projectId: {
          type: 'string',
          description: 'Unique identifier of the project',
          example: '123e4567-e89b-12d3-a456-426614174000',
        },
        projectName: {
          type: 'string',
          description: 'Updated name of the project',
          example: 'Marketing Campaign Q2',
        },
        fileCount: {
          type: 'number',
          description: 'Number of files in the project',
          example: 5,
        },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Project not found or access denied',
  })
  @ApiBearerAuth('JWT-auth')
  async updateProject(
    @Param('projectId') projectId: string,
    @Body() updateProjectDto: UpdateProjectDto,
    @Request() req: any,
  ): Promise<ProjectResponse> {
    try {
      const userId = req.user?.sub || 'anonymous';
      return await this.projectsService.updateProject(projectId, updateProjectDto, userId);
    } catch (error) {
      if (error instanceof HttpException && error.getStatus() === HttpStatus.NOT_FOUND) {
        throw error;
      }
      throw new HttpException('Failed to update project', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
