import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../app/prisma.service';
import { GeminiService } from '../../ai/services/gemini.service';

interface SQLQueryResult {
  sql: string;
  values: unknown[];
  explanation: string;
}

interface SchemaInfo {
  tableName: string;
  columnName: string;
  dataType: string;
  isNullable: string;
  columnDefault: string | null;
}

interface ColumnInfo {
  column: string;
  type: string;
  nullable: boolean;
  default: string | null;
}

@Injectable()
export class DynamicSQLService {
  private readonly logger = new Logger(DynamicSQLService.name);
  private schemaCache: SchemaInfo[] | null = null;
  private schemaCacheTime = 0;
  private readonly CACHE_TTL = 300000; // 5 minutes

  constructor(
    private prisma: PrismaService,
    private geminiService: GeminiService
  ) {}

  /**
   * Convert natural language question to SQL query using AI
   */
  async generateSQLFromNaturalLanguage(
    question: string,
    userContext: {
      userId: string;
      branchId?: string;
      userRole: string;
    }
  ): Promise<{
    result: unknown[];
    explanation: string;
    sql?: string;
  }> {
    try {
      // Step 1: Get database schema context
      const schema = await this.getDatabaseSchema(); // Step 2: Generate SQL using AI with security constraints
      const sqlResult = await this.generateSecureSQL(question, schema, userContext);

      // Log the generated SQL query
      this.logger.log('🔧 Generated SQL Query from AI:');
      this.logger.log(sqlResult.sql);
      this.logger.log('📋 SQL Parameters:', sqlResult.values);

      // Step 3: Validate and execute the SQL
      const validationResult = this.validateSQL(sqlResult.sql);
      if (!validationResult.isValid) {
        throw new Error(`Invalid SQL query: ${validationResult.errors.join(', ')}`);
      }

      // Step 4: Execute the query
      const rows = await this.executeSQL(sqlResult.sql, sqlResult.values);

      // Step 5: Generate human-readable response
      const explanation = await this.generateExplanation(question, rows, sqlResult.explanation);

      return {
        result: rows,
        explanation,
        sql: sqlResult.sql,
      };
    } catch (error) {
      this.logger.error('Failed to process natural language query:', error);
      throw new Error(`Failed to process query: ${error.message}`);
    }
  }

  /**
   * Get database schema with caching
   */
  private async getDatabaseSchema(): Promise<SchemaInfo[]> {
    const now = Date.now();

    // Return cached schema if it's still valid
    if (this.schemaCache && now - this.schemaCacheTime < this.CACHE_TTL) {
      return this.schemaCache;
    }

    try {
      // Get schema information from PostgreSQL information_schema
      const schema = await this.prisma.$queryRaw<SchemaInfo[]>`
        SELECT 
          table_name as "tableName",
          column_name as "columnName", 
          data_type as "dataType",
          is_nullable as "isNullable",
          column_default as "columnDefault"
        FROM information_schema.columns 
        WHERE table_schema = 'public'
        AND table_name IN (
          'users', 'branches', 'items', 'suppliers', 'stock',
          'purchase_requests', 'purchase_orders', 'goods_receipts',
          'material_requisitions', 'request_forms', 'manufacturing_lists'
        )
        ORDER BY table_name, ordinal_position;
      `;

      this.schemaCache = schema;
      this.schemaCacheTime = now;

      return schema;
    } catch (error) {
      this.logger.error('Failed to get database schema:', error);
      throw new Error('Failed to retrieve database schema');
    }
  }

  /**
   * Generate secure SQL using AI with context and constraints
   */
  private async generateSecureSQL(
    question: string,
    schema: SchemaInfo[],
    userContext: {
      userId: string;
      branchId?: string;
      userRole: string;
    }
  ): Promise<SQLQueryResult> {
    const schemaDescription = this.formatSchemaForAI(schema);

    const prompt = `
You are a SQL query generator for a supply chain management system. Convert the natural language question into a parameterized PostgreSQL SELECT query.

IMPORTANT SECURITY CONSTRAINTS:
- ONLY generate SELECT queries. No INSERT, UPDATE, DELETE, DROP, CREATE, ALTER, or other modifications allowed.
- Use parameterized queries with $1, $2, etc. for all user inputs.
- Always include proper WHERE clauses to limit data access based on user context.
- Limit results with LIMIT clause (max 100 rows unless specifically asked for more).

USER CONTEXT:
- User ID: ${userContext.userId}
- Branch ID: ${userContext.branchId || 'N/A'}
- User Role: ${userContext.userRole}

DATABASE SCHEMA:
${schemaDescription}

SECURITY RULES:
1. If user role is not 'admin' or 'BRANCH_MANAGER', always filter by branchId where applicable
2. Users can only see data from their own branch unless they have admin privileges
3. Sensitive columns (passwords, tokens) should never be selected
4. Always use proper JOINs instead of subqueries when possible for performance

QUESTION: "${question}"

Respond with JSON in this exact format:
{
  "sql": "SELECT ... FROM ... WHERE ... LIMIT ...",
  "values": [value1, value2, ...],
  "explanation": "Brief explanation of what the query does"
}

Make sure the SQL is valid PostgreSQL syntax with proper parameterization.
    `.trim();

    try {
      const response = await this.geminiService.generateText(prompt);

      // Parse the JSON response
      const cleanResponse = response.replace(/```json|```/g, '').trim();
      const parsed = JSON.parse(cleanResponse);

      // Validate the response structure
      if (!parsed.sql || !Array.isArray(parsed.values) || !parsed.explanation) {
        throw new Error('Invalid response format from AI');
      }

      return {
        sql: parsed.sql,
        values: parsed.values,
        explanation: parsed.explanation,
      };
    } catch (error) {
      this.logger.error('Failed to generate SQL with AI:', error);
      throw new Error('Failed to generate SQL query');
    }
  }

  /**
   * Validate SQL query for security
   */
  private validateSQL(sql: string): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    const lowerSQL = sql.toLowerCase().trim();

    // Check if it's a SELECT query
    if (!lowerSQL.startsWith('select')) {
      errors.push('Only SELECT queries are allowed');
    }

    // Check for dangerous keywords
    const dangerousKeywords = [
      'insert',
      'update',
      'delete',
      'drop',
      'create',
      'alter',
      'truncate',
      'exec',
      'execute',
      'procedure',
      'function',
      '--',
      '/*',
      '*/',
      'union',
      'declare',
      'set',
      'grant',
      'revoke',
    ];

    for (const keyword of dangerousKeywords) {
      if (lowerSQL.includes(keyword)) {
        errors.push(`Dangerous keyword detected: ${keyword}`);
      }
    }

    // Check for SQL injection patterns
    const injectionPatterns = [
      /;[\s]*?(select|insert|update|delete|drop|create|alter)/gi,
      /union[\s]+select/gi,
      /'\s*or\s*'.*?'[\s]*=/gi,
      /'\s*and\s*'.*?'[\s]*=/gi,
    ];

    for (const pattern of injectionPatterns) {
      if (pattern.test(sql)) {
        errors.push('Potential SQL injection pattern detected');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Execute SQL query safely
   */
  private async executeSQL(sql: string, values: unknown[]): Promise<unknown[]> {
    try {
      // Use Prisma's raw query execution with parameterized values
      const result = await this.prisma.$queryRawUnsafe(sql, ...values);

      // Convert BigInt to number for JSON serialization
      return this.serializeResult(result as unknown[]);
    } catch (error) {
      this.logger.error('Failed to execute SQL query:', error);
      throw new Error('Failed to execute database query');
    }
  }

  /**
   * Generate human-readable explanation of results
   */
  private async generateExplanation(
    originalQuestion: string,
    results: unknown[],
    queryExplanation: string
  ): Promise<string> {
    const prompt = `
You are a supply chain management assistant. A user asked: "${originalQuestion}"

The database query returned ${results.length} results. Here's the query explanation: ${queryExplanation}

Sample of the data (first 3 rows):
${JSON.stringify(results.slice(0, 3), null, 2)}

Provide a clear, concise summary of the results in natural language. Focus on:
- What was found
- Key insights or patterns
- Actionable information
- Any recommendations if applicable

Keep the response professional and relevant to supply chain management.
    `.trim();

    try {
      return await this.geminiService.generateText(prompt);
    } catch (error) {
      this.logger.error('Failed to generate explanation:', error);
      // Fallback to basic explanation
      return `Found ${results.length} results for your query: ${queryExplanation}`;
    }
  }
  /**
   * Format schema for AI consumption
   */
  private formatSchemaForAI(schema: SchemaInfo[]): string {
    const tables = schema.reduce(
      (acc, col) => {
        if (!acc[col.tableName]) {
          acc[col.tableName] = [];
        }
        acc[col.tableName].push({
          column: col.columnName,
          type: col.dataType,
          nullable: col.isNullable === 'YES',
          default: col.columnDefault,
        });
        return acc;
      },
      {} as Record<string, ColumnInfo[]>
    );

    let schemaDescription =
      'IMPORTANT: PostgreSQL is case-sensitive. Use exact column names with proper case and double quotes.\n\n';

    // Add specific supply chain context
    schemaDescription += `SUPPLY CHAIN BUSINESS CONTEXT:
- stock table contains inventory data with "quantity", "reservedQty", "availableQty"
- branches table contains branch information with "name" and "code" (like 'BR002')
- items table contains product information
- Use proper JOINs to connect related tables

AVAILABLE TABLES:\n\n`;

    schemaDescription += Object.entries(tables)
      .map(([tableName, columns]) => {
        const columnList = columns
          .map((col) => `  "${col.column}" (${col.type}${col.nullable ? ', nullable' : ''})`)
          .join('\n');
        return `Table: ${tableName}\n${columnList}`;
      })
      .join('\n\n');

    // Add common query patterns
    schemaDescription += `\n\nCOMMON PATTERNS FOR THIS SYSTEM:
- For stock below threshold in specific branch: 
  SELECT i."name", i."sku", s."quantity", b."name" as branch_name, b."code" as branch_code
  FROM stock s 
  JOIN branches b ON s."branchId" = b."id" 
  JOIN items i ON s."itemId" = i."id" 
  WHERE b."code" = $1 AND s."quantity" < $2
- Always use double quotes around column names: s."itemId", b."branchId"
- Use proper case: "itemId" not "itemid", "branchId" not "branchid"
- For branch filtering use: b."code" = 'BR002' (exact branch code match)`;

    return schemaDescription;
  }

  /**
   * Serialize database results for JSON compatibility
   */
  private serializeResult(result: unknown[]): unknown[] {
    return result.map((row) => {
      if (typeof row !== 'object' || row === null) {
        return row;
      }

      const serialized = { ...(row as Record<string, unknown>) };
      for (const [key, value] of Object.entries(serialized)) {
        if (typeof value === 'bigint') {
          serialized[key] = Number(value);
        } else if (value instanceof Date) {
          serialized[key] = value.toISOString();
        }
      }
      return serialized;
    });
  }
}
