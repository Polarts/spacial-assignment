import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  DynamoDBClient,
  PutItemCommand,
  UpdateItemCommand,
  QueryCommand,
  GetItemCommand,
  ScanCommand,
  DeleteItemCommand,
} from '@aws-sdk/client-dynamodb';
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb';
import { FileMetadata, FileStatus } from '../common/types/file.types';

@Injectable()
export class DynamoDBService {
  private client: DynamoDBClient;
  private tableName: string;

  constructor(private configService: ConfigService) {
    this.client = new DynamoDBClient({
      region: this.configService.get('AWS_REGION'),
    });
    this.tableName = this.configService.get('DYNAMODB_FILES_TABLE');
  }

  async createFileRecord(
    metadata: FileMetadata & {
      sortKey: string;
      GSI1PK: string;
      GSI1SK: string;
      GSI2PK?: string;
      GSI2SK?: string;
    },
  ): Promise<void> {
    const command = new PutItemCommand({
      TableName: this.tableName,
      Item: marshall(metadata, { removeUndefinedValues: true }),
    });

    await this.client.send(command);
  }

  async updateFileStatus(
    projectId: string,
    sortKey: string,
    status: FileStatus,
    additionalData?: Partial<FileMetadata>,
  ): Promise<void> {
    const updateExpression = ['SET #status = :status', '#updatedAt = :updatedAt'];
    const expressionAttributeNames: Record<string, string> = {
      '#status': 'status',
      '#updatedAt': 'updatedAt',
    };
    const expressionAttributeValues: Record<string, any> = {
      ':status': { S: status },
      ':updatedAt': { S: new Date().toISOString() },
    };

    if (additionalData?.checksum) {
      updateExpression.push('#checksum = :checksum');
      expressionAttributeNames['#checksum'] = 'checksum';
      expressionAttributeValues[':checksum'] = { S: additionalData.checksum };
    }

    if (additionalData?.derived) {
      updateExpression.push('#derived = :derived');
      expressionAttributeNames['#derived'] = 'derived';
      expressionAttributeValues[':derived'] = { M: marshall(additionalData.derived) };
    }

    const command = new UpdateItemCommand({
      TableName: this.tableName,
      Key: marshall({
        projectId,
        sortKey,
      }),
      UpdateExpression: updateExpression.join(', '),
      ExpressionAttributeNames: expressionAttributeNames,
      ExpressionAttributeValues: expressionAttributeValues,
    });

    await this.client.send(command);
  }

  async getFileById(projectId: string, sortKey: string): Promise<FileMetadata | null> {
    const command = new GetItemCommand({
      TableName: this.tableName,
      Key: marshall({ projectId, sortKey }),
    });

    const result = await this.client.send(command);
    return result.Item ? (unmarshall(result.Item) as FileMetadata) : null;
  }

  async queryFilesByProject(
    projectId: string,
    fileType?: string,
    limit: number = 50,
    lastEvaluatedKey?: Record<string, any>,
  ): Promise<{ items: FileMetadata[]; nextCursor?: string }> {
    let indexName: string | undefined = undefined;
    let keyConditionExpression = '';
    const expressionAttributeValues: Record<string, any> = {};

    if (fileType) {
      // Use GSI1 when filtering by fileType
      indexName = 'GSI1';
      keyConditionExpression = 'GSI1PK = :projectId AND begins_with(GSI1SK, :fileType)';
      expressionAttributeValues[':projectId'] = { S: projectId };
      expressionAttributeValues[':fileType'] = { S: `${fileType}#` };
    } else {
      // Query main table when no fileType filter
      keyConditionExpression = 'projectId = :projectId';
      expressionAttributeValues[':projectId'] = { S: projectId };
    }

    const command = new QueryCommand({
      TableName: this.tableName,
      IndexName: indexName,
      KeyConditionExpression: keyConditionExpression,
      ExpressionAttributeValues: expressionAttributeValues,
      Limit: limit,
      ScanIndexForward: false, // Sort descending by createdAt
      ExclusiveStartKey: lastEvaluatedKey ? marshall(lastEvaluatedKey) : undefined,
    });

    const result = await this.client.send(command);
    const items = result.Items?.map((item) => unmarshall(item) as FileMetadata) || [];

    return {
      items,
      nextCursor: result.LastEvaluatedKey
        ? JSON.stringify(unmarshall(result.LastEvaluatedKey))
        : undefined,
    };
  }

  async getAllProjects(userId?: string): Promise<Map<string, { name: string; fileCount: number }>> {
    const projectsMap = new Map<string, { name: string; fileCount: number }>();
    let lastEvaluatedKey: Record<string, any> | undefined = undefined;

    do {
      const command = new ScanCommand({
        TableName: this.tableName,
        ProjectionExpression: 'projectId, projectName, uploaderId, isProject, sortKey',
        FilterExpression: userId ? 'uploaderId = :userId' : undefined,
        ExpressionAttributeValues: userId ? { ':userId': { S: userId } } : undefined,
        ExclusiveStartKey: lastEvaluatedKey ? marshall(lastEvaluatedKey) : undefined,
      });

      const result = await this.client.send(command);

      if (result.Items) {
        result.Items.forEach((item) => {
          const unmarshalled = unmarshall(item);
          const projectId = unmarshalled.projectId;
          const projectName = unmarshalled.projectName || 'Unnamed Project';
          const isProjectRecord = unmarshalled.isProject === true;

          if (projectsMap.has(projectId)) {
            const existing = projectsMap.get(projectId)!;
            // Only increment fileCount for non-project records (actual files)
            if (!isProjectRecord) {
              existing.fileCount += 1;
            }
          } else {
            // Initialize with fileCount 0 for project records, 1 for file records
            projectsMap.set(projectId, { name: projectName, fileCount: isProjectRecord ? 0 : 1 });
          }
        });
      }

      lastEvaluatedKey = result.LastEvaluatedKey ? unmarshall(result.LastEvaluatedKey) : undefined;
    } while (lastEvaluatedKey);

    return projectsMap;
  }

  async createProject(projectId: string, projectName: string, userId: string): Promise<void> {
    const timestamp = new Date().toISOString();
    const sortKey = `PROJECT#${timestamp}`;

    const projectRecord = {
      projectId,
      sortKey,
      projectName,
      uploaderId: userId,
      createdAt: timestamp,
      updatedAt: timestamp,
      isProject: true, // Flag to distinguish project records from file records
      GSI1PK: projectId,
      GSI1SK: `PROJECT#${timestamp}`,
    };

    const command = new PutItemCommand({
      TableName: this.tableName,
      Item: marshall(projectRecord, { removeUndefinedValues: true }),
      ConditionExpression: 'attribute_not_exists(projectId) AND attribute_not_exists(sortKey)',
    });

    await this.client.send(command);
  }

  async deleteProject(projectId: string, userId: string): Promise<void> {
    // First, get all items for this project to verify ownership and delete them
    let lastEvaluatedKey: Record<string, any> | undefined = undefined;
    const itemsToDelete: Array<{ projectId: string; sortKey: string }> = [];

    do {
      const queryCommand = new QueryCommand({
        TableName: this.tableName,
        KeyConditionExpression: 'projectId = :projectId',
        FilterExpression: 'uploaderId = :userId',
        ExpressionAttributeValues: {
          ':projectId': { S: projectId },
          ':userId': { S: userId },
        },
        ExclusiveStartKey: lastEvaluatedKey ? marshall(lastEvaluatedKey) : undefined,
      });

      const result = await this.client.send(queryCommand);

      if (result.Items) {
        result.Items.forEach((item) => {
          const unmarshalled = unmarshall(item);
          itemsToDelete.push({
            projectId: unmarshalled.projectId,
            sortKey: unmarshalled.sortKey,
          });
        });
      }

      lastEvaluatedKey = result.LastEvaluatedKey ? unmarshall(result.LastEvaluatedKey) : undefined;
    } while (lastEvaluatedKey);

    // Delete all items
    for (const item of itemsToDelete) {
      const deleteCommand = new DeleteItemCommand({
        TableName: this.tableName,
        Key: marshall({
          projectId: item.projectId,
          sortKey: item.sortKey,
        }),
      });
      await this.client.send(deleteCommand);
    }
  }

  async updateProject(projectId: string, projectName: string, userId: string): Promise<void> {
    // First, get all items for this project to verify ownership and update them
    let lastEvaluatedKey: Record<string, any> | undefined = undefined;
    const itemsToUpdate: Array<{ projectId: string; sortKey: string }> = [];

    do {
      const queryCommand = new QueryCommand({
        TableName: this.tableName,
        KeyConditionExpression: 'projectId = :projectId',
        FilterExpression: 'uploaderId = :userId',
        ExpressionAttributeValues: {
          ':projectId': { S: projectId },
          ':userId': { S: userId },
        },
        ExclusiveStartKey: lastEvaluatedKey ? marshall(lastEvaluatedKey) : undefined,
      });

      const result = await this.client.send(queryCommand);

      if (result.Items) {
        result.Items.forEach((item) => {
          const unmarshalled = unmarshall(item);
          itemsToUpdate.push({
            projectId: unmarshalled.projectId,
            sortKey: unmarshalled.sortKey,
          });
        });
      }

      lastEvaluatedKey = result.LastEvaluatedKey ? unmarshall(result.LastEvaluatedKey) : undefined;
    } while (lastEvaluatedKey);

    if (itemsToUpdate.length === 0) {
      throw new Error('Project not found or access denied');
    }

    // Update all items with the new project name
    const timestamp = new Date().toISOString();
    for (const item of itemsToUpdate) {
      const updateCommand = new UpdateItemCommand({
        TableName: this.tableName,
        Key: marshall({
          projectId: item.projectId,
          sortKey: item.sortKey,
        }),
        UpdateExpression: 'SET projectName = :projectName, updatedAt = :updatedAt',
        ExpressionAttributeValues: {
          ':projectName': { S: projectName },
          ':updatedAt': { S: timestamp },
        },
      });
      await this.client.send(updateCommand);
    }
  }
}
