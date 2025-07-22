import { PrismaService } from "@/app/prisma.service";
import { ConnectionsService } from "@/modules/connections/connections.service";
import { Inject, Injectable, Logger } from "@nestjs/common";
import type {
  IDatabaseClient,
  IDatabaseRow,
  ITableColumn,
  ITableMetadataRecord,
  ITableRelationship,
  ITableSchemaInput,
  MCPTableMetadataAgentRes,
  TUpdateFrequency,
} from "@supplysense/types";
import { withDbConnection } from "src/helpers/db-connection.helper";
import { McpClientService } from "../../chat/services/mcp-client.service";
import { GET_TABLES_QUERY } from "../constant/table-schema";
import type { CaptureMetadataDto, TableMetadataDto } from "../dto/metadata.dto";
import type { DbCredentials } from "../types/db-connection.type";
import { metadataAgentInstructions } from "../constant/metadata-agent-instraction";

@Injectable()
export class MetadataService {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(McpClientService) private readonly mcpClient: McpClientService,
    @Inject(ConnectionsService)
    private readonly connectionsService: ConnectionsService,

    private readonly logger = new Logger(MetadataService.name)
  ) {}

  async captureMetadata(dto: CaptureMetadataDto) {
    const connection = await this.connectionsService.getCompanyConnection(
      dto.companyId,
      dto.dbConnectionId
    );

    if (!connection) {
      throw new Error("Specified database connection not found");
    }

    const generatedMetadata = await this.captureMetadataForConnection(
      connection,
      dto.tables
    );

    return {
      success: true,
      message: "Metadata captured and saved successfully",
      metadata: generatedMetadata,
    };
  }

  private async captureMetadataForConnection(
    connection: DbCredentials & { dbConnectionId: string; title?: string },
    tables: Array<{ tableName: string }>
  ) {
    return withDbConnection(connection, async (client) => {
      // Extract table names from the tables array
      const tableNames = tables.map((table) => table.tableName);

      const metadataResults = [];

      for (const tableName of tableNames) {
        try {
          // Get detailed table schema
          const tableSchema = await this.getTableSchema(client, tableName);
          //Call MCP agent to generate metadata
          const metadata = await this.generateTableMetadata(
            tableName,
            tableSchema
          );
          metadataResults.push(metadata);
        } catch (error) {
          console.error(`Error processing table ${tableName}:`, error);
          // Continue with other tables even if one fails
        }
      }

      return {
        dbConnectionId: connection.dbConnectionId,
        connectionTitle: connection.title || "Default Connection",
        generatedMetadata: metadataResults,
      };
    });
  }

  private async getTableSchema(
    client: IDatabaseClient,
    tableName: string
  ): Promise<ITableSchemaInput> {
    // Get column information
    const columnQuery = {
      qry: GET_TABLES_QUERY,
      values: [tableName],
    };

    const columnResult = await client.query(columnQuery);

    // Transform the result to match our interface
    const columns = columnResult.rows.map((row: IDatabaseRow) => ({
      columnName: String(row.column_name),
      dataType: String(row.data_type),
      isNullable: row.is_nullable === "YES",
      isPrimaryKey: Boolean(row.is_primary_key),
      isForeignKey: Boolean(row.is_foreign_key),
      referencedTable: row.foreign_table_name
        ? String(row.foreign_table_name)
        : undefined,
      referencedColumn: row.foreign_column_name
        ? String(row.foreign_column_name)
        : undefined,
      columnComment: row.column_comment
        ? String(row.column_comment)
        : undefined,
    }));

    // Get relationships (simplified for now)
    const relationships = columnResult.rows
      .filter((row: IDatabaseRow) => row.is_foreign_key)
      .map((row: IDatabaseRow) => {
        // Check if THIS foreign key column has a unique constraint
        const isOneToOne = Boolean(row.fk_is_unique);
        const type = isOneToOne ? "one-to-one" : "many-to-one";
        return {
          type: type as ITableRelationship["type"],
          targetTable: String(row.foreign_table_name),
          foreignKey: String(row.column_name),
          description: `Foreign key relationship to ${String(
            row.foreign_table_name
          )}`,
        };
      });

    return {
      columns,
      relationships,
    };
  }

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
      const agentResponse = await this.callMCPTableMetadataAgent(
        tableName,
        tableSchema,
        businessContext
      );
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
  async saveTableMetadata(
    input: TableMetadataDto
  ): Promise<ITableMetadataRecord> {
    const { companyId, ...data } = input;
    try {
      const isValidConnectionId = await this.prisma.dbConnection.findUnique({
        where: { id: data.dbConnectionId, companyId },
      });

      if (!isValidConnectionId) {
        throw new Error("Invalid database connection");
      }
      // Save the metadata record
      const metadataRecord = await this.prisma.tableMetadata.create({
        data,
      });
      return metadataRecord;
    } catch (error) {
      console.error("Error saving metadata for table ", error);
      throw new Error("Failed to save metadata for table");
    }
  }

  /**
   * Call the MCP agent to generate metadata for a table
   */
  private async callMCPTableMetadataAgent(
    tableName: string,
    tableSchema: ITableSchemaInput,
    businessContext?: string
  ): Promise<MCPTableMetadataAgentRes> {
    try {
      // Prepare the input for the metadata analysis tool
      const toolInput = {
        tableName,
        tableSchema,
        businessContext:
          businessContext || `Database table analysis for ${tableName}`,
      };

      const query = metadataAgentInstructions({
        tableName,
        tableSchema,
        toolInput,
        businessContext,
      });

      // Call the MCP agent through the client service
      const response = await this.mcpClient.querySupplyChainAgent(query, {
        tableName,
        tableSchema,
        businessContext:
          businessContext || `Database table analysis for ${tableName}`,
      });
      this.logger.log(
        `MCP agent response for table ${tableName}: ${JSON.stringify(response)}`
      );

      if (!response.success) {
        throw new Error(response.error || "MCP agent query failed");
      }

      // Parse the response to extract metadata
      // The response.response should contain the structured metadata
      let metadata: MCPTableMetadataAgentRes;

      try {
        // Try to parse if the response contains JSON
        const responseText = response.response || "";
        const jsonRegex = /\{[\s\S]*\}/;
        const jsonMatch = jsonRegex.exec(responseText);

        if (jsonMatch) {
          const parsedData = JSON.parse(jsonMatch[0]);
          metadata = {
            tableName: parsedData.tableName || tableName,
            friendlyLabel:
              parsedData.friendlyLabel || this.generateFriendlyLabel(tableName),
            purpose: parsedData.purpose || `Data storage for ${tableName}`,
            updateFrequency:
              parsedData.updateFrequency ||
              this.determineUpdateFrequency(tableSchema),
            sampleQuestions:
              parsedData.sampleQuestions ||
              this.generateBasicSampleQuestions(tableName),
          };
        } else {
          // Fallback: extract information from text response
          metadata = this.parseTextResponse(
            responseText,
            tableName,
            tableSchema
          );
        }
      } catch (parseError) {
        console.warn(
          "Failed to parse MCP response, using fallback logic:",
          parseError
        );
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
        .replace(/[_-]/g, " ")
        // Split camelCase words
        .replace(/([a-z])([A-Z])/g, "$1 $2")
        // Split consecutive capitals (like "XMLHttpRequest" -> "XML Http Request")
        .replace(/([A-Z])([A-Z][a-z])/g, "$1 $2")
        // Capitalize first letter of each word
        .replace(/\b\w/g, (char) => char.toUpperCase())
        // Clean up extra spaces
        .replace(/\s+/g, " ")
        .trim()
    );
  }

  private generatePurpose(
    tableName: string,
    tableSchema: ITableSchemaInput
  ): string {
    const columns = tableSchema.columns || [];
    const hasTimestamps = columns.some(
      (col: ITableColumn) =>
        col.columnName.includes("created_at") ||
        col.columnName.includes("updated_at")
    );
    const hasStatus = columns.some(
      (col: ITableColumn) =>
        col.columnName.includes("status") || col.columnName.includes("state")
    );

    if (hasTimestamps && hasStatus) {
      return `Transactional table for managing ${tableName.replace(
        /_/g,
        " "
      )} with status tracking`;
    }
    if (hasTimestamps) {
      return `Data table for storing ${tableName.replace(
        /_/g,
        " "
      )} information`;
    }
    return `Reference table for ${tableName.replace(/_/g, " ")} data`;
  }

  private determineUpdateFrequency(
    tableSchema: ITableSchemaInput
  ): TUpdateFrequency {
    const columns = tableSchema.columns || [];
    const hasStatus = columns.some(
      (col: ITableColumn) =>
        col.columnName.includes("status") || col.columnName.includes("state")
    );
    const hasTimestamps = columns.some((col: ITableColumn) =>
      col.columnName.includes("updated_at")
    );

    if (hasStatus && hasTimestamps) {
      return "real-time";
    }
    if (hasTimestamps) {
      return "daily";
    }
    return "rarely";
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
      this.extractFromText(responseText, "friendly label") ||
      this.generateFriendlyLabel(tableName);

    const purpose =
      this.extractFromText(responseText, "purpose") ||
      this.generatePurpose(tableName, tableSchema);

    const updateFrequency =
      this.extractUpdateFrequency(responseText) ||
      this.determineUpdateFrequency(tableSchema);

    const sampleQuestions =
      this.extractSampleQuestions(responseText) ||
      this.generateBasicSampleQuestions(tableName);

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
    const regex = new RegExp(`${field}[:\\s]*(.*?)(?:\n|$)`, "i");
    const match = regex.exec(text);
    return match ? match[1].trim() : null;
  }

  /**
   * Extract update frequency from text response
   */
  private extractUpdateFrequency(text: string): TUpdateFrequency | null {
    const frequencies = ["real-time", "daily", "weekly", "monthly", "rarely"];
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
    const lines = text.split("\n");
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
        } else if (!trimmedLine.includes(":")) {
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
