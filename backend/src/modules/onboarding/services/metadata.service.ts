import { PrismaService } from '@/app/prisma.service';
import { Inject, Injectable, Logger } from '@nestjs/common';
import type {
  ITableColumn,
  ITableMetadataRecord,
  ITableSchemaInput,
  MCPTableMetadataAgentRes,
  TUpdateFrequency,
} from '@supplysense/types';
import { McpClientService } from '../../chat/services/mcp-client.service';
import type { TableMetadataDto } from '../dto/db-connect.dto';

@Injectable()
export class MetadataService {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(McpClientService) private readonly mcpClient: McpClientService,
    private readonly logger = new Logger(MetadataService.name)
  ) {}

  /**
   * Call the MCP agent to generate metadata for a table
   */
  async generateTableMetadata(
    tableName: string,
    tableSchema: ITableSchemaInput,
    businessContext?: string
  ) {
    try {
      // In a real implementation, this would call the MCP server
      // For now, we'll simulate the agent response
      const agentResponse = await this.callMCPAgent(tableName, tableSchema, businessContext);
      console.log('🚀 ~ MetadataService ~ agentResponse:', agentResponse);

      return {
        tableName,
        friendlyLabel: agentResponse.friendlyLabel,
        purpose: agentResponse.purpose,
        updateFrequency: agentResponse.updateFrequency,
        sampleQuestions: agentResponse.sampleQuestions,
      };
    } catch (error) {
      console.error(`Error generating metadata for table ${tableName}:`, error);
      throw new Error(`Failed to generate metadata for table ${tableName}`);
    }
  }

  /**
   * Save generated metadata to the database
   */
  async saveTableMetadata(input: TableMetadataDto): Promise<ITableMetadataRecord> {
    console.log('🚀 ~ MetadataService ~ input:', input);
    const { companyId, ...data } = input;
    try {
      const isValidConnectionId = await this.prisma.dbConnection.findUnique({
        where: { id: data.dbConnectionId, companyId },
      });

      if (!isValidConnectionId) {
        throw new Error('Invalid database connection');
      }
      // Save the metadata record
      const metadataRecord = await this.prisma.tableMetadata.create({
        data,
      });
      return metadataRecord;
    } catch (error) {
      console.error('Error saving metadata for table ', error);
      throw new Error('Failed to save metadata for table');
    }
  }

  /**
   * Call the MCP agent to generate metadata for a table
   */
  private async callMCPAgent(
    tableName: string,
    tableSchema: ITableSchemaInput,
    businessContext?: string
  ): Promise<MCPTableMetadataAgentRes> {
    try {
      // Prepare the input for the metadata analysis tool
      const toolInput = {
        tableName,
        tableSchema,
        businessContext: businessContext || `Database table analysis for ${tableName}`,
      };

      // Create a more explicit and structured prompt for the MCP agent
      const query = [
        'You are an expert data analyst. Your task is to analyze the following database table and generate structured metadata for it.',
        '',
        `Table Name: "${tableName}"`,
        'Table Schema:',
        JSON.stringify(tableSchema, null, 2),
        businessContext ? `Business Context: ${businessContext}` : '',
        '',
        'Please provide the following metadata as a JSON object with these fields:',
        '{',
        '  "tableName": string, // The table\'s name',
        '  "friendlyLabel": string, // A human-friendly label for the table',
        '  "purpose": string, // A concise business purpose for this table (do not use asterisks or markdown)',
        '  "updateFrequency": string, // One of: "real-time", "daily", "weekly", "monthly", "rarely"',
        '  "sampleQuestions": string[] // 5-8 diverse, creative sample questions users might ask about this data',
        '}',
        '',
        'Use the analyze-table-metadata tool with this input:',
        JSON.stringify(toolInput, null, 2),
        '',
        'Important:',
        '- Do NOT use markdown or asterisks in any field values.',
        '- Make sure the JSON is valid and all fields are present.',
        '- Sample questions should be unique, relevant, and phrased as natural questions.',
        '- The purpose should be a single, clear sentence.',
      ]
        .filter(Boolean)
        .join('\n');
      // Call the MCP agent through the client service
      const response = await this.mcpClient.querySupplyChainAgent(query, {
        tableName,
        tableSchema,
        businessContext: businessContext || `Database table analysis for ${tableName}`,
      });
      this.logger.log(`MCP agent response for table ${tableName}: ${JSON.stringify(response)}`);

      if (!response.success) {
        throw new Error(response.error || 'MCP agent query failed');
      }

      // Parse the response to extract metadata
      // The response.response should contain the structured metadata
      let metadata: MCPTableMetadataAgentRes;

      try {
        // Try to parse if the response contains JSON
        const responseText = response.response || '';
        const jsonRegex = /\{[\s\S]*\}/;
        const jsonMatch = jsonRegex.exec(responseText);

        if (jsonMatch) {
          const parsedData = JSON.parse(jsonMatch[0]);
          console.log('🚀 ~ parsedData:', parsedData);
          metadata = {
            tableName: parsedData.tableName || tableName,
            friendlyLabel: parsedData.friendlyLabel || this.generateFriendlyLabel(tableName),
            purpose: parsedData.purpose || `Data storage for ${tableName}`,
            updateFrequency:
              parsedData.updateFrequency || this.determineUpdateFrequency(tableSchema),
            sampleQuestions:
              parsedData.sampleQuestions || this.generateBasicSampleQuestions(tableName),
          };
        } else {
          // Fallback: extract information from text response
          metadata = this.parseTextResponse(responseText, tableName, tableSchema);
        }
      } catch (parseError) {
        console.warn('Failed to parse MCP response, using fallback logic:', parseError);
        // Fallback to local generation
        metadata = {
          tableName,
          friendlyLabel: this.generateFriendlyLabel(tableName),
          purpose: this.generatePurpose(tableName, tableSchema),
          updateFrequency: this.determineUpdateFrequency(tableSchema),
          sampleQuestions: this.generateBasicSampleQuestions(tableName),
        };
      }

      return metadata;
    } catch (error) {
      console.error(`Error calling MCP agent for table ${tableName}:`, error);

      // Fallback to local generation if MCP fails
      return {
        tableName,
        friendlyLabel: this.generateFriendlyLabel(tableName),
        purpose: this.generatePurpose(tableName, tableSchema),
        updateFrequency: this.determineUpdateFrequency(tableSchema),
        sampleQuestions: this.generateBasicSampleQuestions(tableName),
      };
    }
  }

  private generateFriendlyLabel(tableName: string): string {
    return (
      tableName
        // Replace underscores and hyphens with spaces
        .replace(/[_-]/g, ' ')
        // Split camelCase words
        .replace(/([a-z])([A-Z])/g, '$1 $2')
        // Split consecutive capitals (like "XMLHttpRequest" -> "XML Http Request")
        .replace(/([A-Z])([A-Z][a-z])/g, '$1 $2')
        // Capitalize first letter of each word
        .replace(/\b\w/g, (char) => char.toUpperCase())
        // Clean up extra spaces
        .replace(/\s+/g, ' ')
        .trim()
    );
  }

  private generatePurpose(tableName: string, tableSchema: ITableSchemaInput): string {
    const columns = tableSchema.columns || [];
    const hasTimestamps = columns.some(
      (col: ITableColumn) =>
        col.columnName.includes('created_at') || col.columnName.includes('updated_at')
    );
    const hasStatus = columns.some(
      (col: ITableColumn) => col.columnName.includes('status') || col.columnName.includes('state')
    );

    if (hasTimestamps && hasStatus) {
      return `Transactional table for managing ${tableName.replace(
        /_/g,
        ' '
      )} with status tracking`;
    }
    if (hasTimestamps) {
      return `Data table for storing ${tableName.replace(/_/g, ' ')} information`;
    }
    return `Reference table for ${tableName.replace(/_/g, ' ')} data`;
  }

  private determineUpdateFrequency(tableSchema: ITableSchemaInput): TUpdateFrequency {
    const columns = tableSchema.columns || [];
    const hasStatus = columns.some(
      (col: ITableColumn) => col.columnName.includes('status') || col.columnName.includes('state')
    );
    const hasTimestamps = columns.some((col: ITableColumn) =>
      col.columnName.includes('updated_at')
    );

    if (hasStatus && hasTimestamps) {
      return 'real-time';
    }
    if (hasTimestamps) {
      return 'daily';
    }
    return 'rarely';
  }

  /**
   * Parse text response from MCP agent when JSON parsing fails
   */
  private parseTextResponse(
    responseText: string,
    tableName: string,
    tableSchema: ITableSchemaInput
  ): MCPTableMetadataAgentRes {
    // Extract information using simple text parsing
    const friendlyLabel =
      this.extractFromText(responseText, 'friendly label') || this.generateFriendlyLabel(tableName);

    const purpose =
      this.extractFromText(responseText, 'purpose') || this.generatePurpose(tableName, tableSchema);

    const updateFrequency =
      this.extractUpdateFrequency(responseText) || this.determineUpdateFrequency(tableSchema);

    const sampleQuestions =
      this.extractSampleQuestions(responseText) || this.generateBasicSampleQuestions(tableName);

    return {
      tableName,
      friendlyLabel,
      purpose,
      updateFrequency,
      sampleQuestions,
    };
  }

  /**
   * Extract specific information from text response
   */
  private extractFromText(text: string, field: string): string | null {
    const regex = new RegExp(`${field}[:\\s]*(.*?)(?:\n|$)`, 'i');
    const match = regex.exec(text);
    return match ? match[1].trim() : null;
  }

  /**
   * Extract update frequency from text response
   */
  private extractUpdateFrequency(text: string): TUpdateFrequency | null {
    const frequencies = ['real-time', 'daily', 'weekly', 'monthly', 'rarely'];
    for (const freq of frequencies) {
      if (text.toLowerCase().includes(freq)) {
        return freq as TUpdateFrequency;
      }
    }
    return null;
  }

  /**
   * Extract sample questions from text response
   */
  private extractSampleQuestions(text: string): string[] {
    // Simplified regex to find question lists
    const lines = text.split('\n');
    const questions: string[] = [];
    let inQuestionSection = false;

    for (const line of lines) {
      const trimmedLine = line.trim();

      // Check if we're entering a questions section
      if (/questions?|queries?/i.test(trimmedLine)) {
        inQuestionSection = true;
        continue;
      }

      // If we're in a questions section, look for list items
      if (inQuestionSection && trimmedLine) {
        // Check for list markers: 1., -, *, •
        const questionMatch = /^(?:\d+\.|-|\*|•)\s*(.+)/.exec(trimmedLine);
        if (questionMatch) {
          questions.push(questionMatch[1].trim());
        } else if (!trimmedLine.includes(':')) {
          // Plain text question (not a field label)
          questions.push(trimmedLine);
        } else {
          // End of questions section
          inQuestionSection = false;
        }
      }
    }

    return questions.length > 0 ? questions.slice(0, 5) : []; // Limit to 5 questions
  }

  /**
   * Generate basic sample questions as fallback
   */
  private generateBasicSampleQuestions(tableName: string): string[] {
    const friendlyName = this.generateFriendlyLabel(tableName);
    return [
      `What is the total count of records in ${friendlyName}?`,
      `What are the most recent entries in ${friendlyName}?`,
      `How many ${friendlyName} records were created this month?`,
      `What is the distribution of ${friendlyName} by status?`,
      `Show me the top 10 ${friendlyName} records by value`,
    ];
  }
}
