import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../app/prisma.service';
import { GeminiService } from '../../ai/services/gemini.service';
import { DatabaseSchemaService } from './database-schema.service';

interface SQLQueryResult {
  sql: string | null;
  values: unknown[];
  explanation: string;
}

interface ParsedAIResponse {
  sql: string | null;
  values: unknown[];
  explanation: string;
}

@Injectable()
export class DynamicSQLService {
  private readonly logger = new Logger(DynamicSQLService.name);

  constructor(
    private prisma: PrismaService,
    private geminiService: GeminiService,
    private databaseSchemaService: DatabaseSchemaService
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
      // Step 1: Get comprehensive database schema context for AI
      const schemaForAI = this.databaseSchemaService.formatSchemaForAI(userContext.userRole);

      // Log the initial request
      console.log('\n🔍 ===== AI SQL GENERATION STARTED =====');
      console.log('📝 User Question:', question);
      console.log('👤 User Context:', JSON.stringify(userContext, null, 2));
      console.log('🏗️ Schema Context Length:', schemaForAI.length, 'characters'); // Step 2: Generate SQL using AI with comprehensive schema context
      const sqlResult = await this.generateSecureSQL(question, schemaForAI, userContext); // Check if AI could not generate SQL
      if (sqlResult.sql === null) {
        console.log('\n⚠️ ===== AI CANNOT GENERATE SQL FOR THIS QUERY =====');
        console.log('💭 Returning AI explanation to user:', sqlResult.explanation);

        return {
          result: [],
          explanation: sqlResult.explanation, // Return the AI's explanation directly without prefix
          sql: undefined,
        };
      } // Enhanced logging for generated SQL
      console.log('\n🎯 ===== AI GENERATED SQL RESULT =====');
      console.log('📊 Generated SQL Query:');
      console.log(sqlResult.sql);
      console.log('\n🔧 SQL Parameters:', sqlResult.values);
      console.log('💬 AI Explanation:', sqlResult.explanation);

      this.logger.log('🔧 Generated SQL Query from AI:');
      this.logger.log(sqlResult.sql);
      this.logger.log('📋 SQL Parameters:', sqlResult.values);

      // Step 3: Validate and execute the SQL (we know sql is not null here)
      if (typeof sqlResult.sql !== 'string') {
        throw new Error('Expected SQL to be a string at this point');
      }

      const validationResult = this.validateSQL(sqlResult.sql);
      if (!validationResult.isValid) {
        console.log('\n❌ ===== SQL VALIDATION FAILED =====');
        console.log('🚫 Validation Errors:', validationResult.errors);
        throw new Error(`Invalid SQL query: ${validationResult.errors.join(', ')}`);
      }

      console.log('\n✅ SQL Validation: PASSED');

      // Step 4: Execute the query
      const startTime = Date.now();
      const rows = await this.executeSQL(sqlResult.sql, sqlResult.values);
      const executionTime = Date.now() - startTime;

      // Log execution results
      console.log('\n📊 ===== SQL EXECUTION RESULTS =====');
      console.log('⏱️ Execution Time:', executionTime, 'ms');
      console.log('📈 Row Count:', rows.length);
      console.log('🔍 Sample Data (first 2 rows):');
      console.log(JSON.stringify(rows.slice(0, 2), null, 2));

      // Step 5: Generate human-readable response
      const explanation = await this.generateExplanation(question, rows, sqlResult.explanation);

      console.log('\n💬 ===== FINAL AI EXPLANATION =====');
      console.log(explanation);
      console.log('\n🏁 ===== AI SQL GENERATION COMPLETED =====\n');
      return {
        result: rows,
        explanation,
        sql: sqlResult.sql, // We know this is not null here due to the type check above
      };
    } catch (error) {
      console.log('\n💥 ===== DYNAMIC SQL SERVICE ERROR =====');
      console.log('🚫 Error Type:', error.constructor.name);
      console.log('🚫 Error Message:', error.message);
      console.log('🚫 Error Stack:', error.stack);
      this.logger.error('Failed to process natural language query:', error);

      throw new Error(`Failed to process query: ${error.message}`);
    }
  }

  /**
   * Generate secure SQL using AI with context and constraints
   */
  private async generateSecureSQL(
    question: string,
    schemaContext: string,
    userContext: {
      userId: string;
      branchId?: string;
      userRole: string;
    }
  ): Promise<SQLQueryResult> {
    const prompt = `
You are a SQL query generator for SupplySense, a supply chain management system. Convert the natural language question into a parameterized PostgreSQL SELECT query.

${schemaContext}

IMPORTANT SCHEMA NOTES:
🔴 PURCHASE FLOW STRUCTURE:
- purchase_requests table does NOT have supplierId column
- Suppliers are linked through purchase_orders, not purchase_requests  
- To get supplier info for purchase requests: purchase_requests → purchase_orders → suppliers
- purchase_requests contains: prNumber, title, status, branchId, createdById, requiredDate, totalAmount
- pr_items contains: purchaseRequestId, itemId, requestedQty, unitPrice, etc.

🔴 TABLE RELATIONSHIPS:
- purchase_requests → pr_items (one-to-many via purchaseRequestId) 
- pr_items → items (many-to-one via itemId)
- purchase_requests → branches (many-to-one via branchId)
- purchase_requests → users (many-to-one via createdById)
- purchase_orders → suppliers (many-to-one via supplierId)

CRITICAL REQUIREMENT - HUMAN-READABLE RESULTS:
🚨🚨🚨 ABSOLUTE RULE: Users should NEVER see raw UUIDs/IDs in results - this is MANDATORY 🚨🚨🚨
- ALWAYS JOIN to get human-readable names for ALL foreign key references  
- For branches: ALWAYS include b."name" as "branchName" (NEVER just branchId)
- For items: ALWAYS include i."sku" and i."name" as "itemName" (NEVER just itemId)
- For suppliers: ALWAYS include s."name" as "supplierName" (NEVER just supplierId)
- For users: ALWAYS include CONCAT(u."firstName", ' ', u."lastName") or u."firstName" || ' ' || u."lastName" as "userName" (users have firstName/lastName, NOT name!)
- Use descriptive column aliases for ALL result columns
- Even if user doesn't ask for names, ALWAYS include them in results

❌ WRONG (returns UUIDs):
SELECT pr."id", pri."itemId", pr."branchId" FROM purchase_requests pr...

✅ CORRECT (returns human-readable names):
SELECT pr."prNumber", pr."title", i."sku", i."name" as "itemName", b."name" as "branchName" 
FROM purchase_requests pr 
JOIN pr_items pri ON pr."id" = pri."purchaseRequestId"
JOIN items i ON pri."itemId" = i."id" 
JOIN branches b ON pr."branchId" = b."id"...

EXAMPLE for "pending purchase requests for items with low stock":
SELECT 
  pr."prNumber" as "requestNumber",
  pr."title" as "requestTitle", 
  pr."status",
  i."sku" as "itemSku",
  i."name" as "itemName",
  pri."requestedQty" as "requestedQuantity",
  st."quantity" as "currentStock",
  st."availableQty" as "availableStock",
  b."name" as "branchName",
  u."firstName" || ' ' || u."lastName" as "requestedBy"
FROM purchase_requests pr
JOIN pr_items pri ON pr."id" = pri."purchaseRequestId"
JOIN items i ON pri."itemId" = i."id"
JOIN stock st ON i."id" = st."itemId" AND pr."branchId" = st."branchId"
JOIN branches b ON pr."branchId" = b."id"
JOIN users u ON pr."createdById" = u."id"
WHERE pr."status" IN ('DRAFT', 'SUBMITTED') AND st."quantity" <= 10

🚨 NOTICE: purchase_requests does NOT have supplierId - suppliers are in purchase_orders only!
🚨 NOTICE: For "pending" purchase requests, use status IN ('DRAFT', 'SUBMITTED') - NO 'PENDING' status exists!

MANDATORY JOIN REQUIREMENTS:
🚨 CRITICAL: You MUST always include JOINs to get human-readable names when referencing related data:
- When selecting from purchase_requests: JOIN with users table to get user names, branches table to get branch names
- When selecting from purchase_request_items: JOIN with items table to get item names and SKUs
- When selecting from purchase_orders: JOIN with suppliers table to get supplier names
- When selecting from stock: JOIN with items table to get item names and SKUs
- When selecting from any table with foreign keys: JOIN with related tables to get descriptive names

NEVER select raw IDs without corresponding names. ALWAYS include human-readable columns like:
- i."name" as "itemName", i."sku" as "itemSku" (not just item IDs)
- b."name" as "branchName" (not just branch IDs)  
- s."name" as "supplierName" (not just supplier IDs)
- u."firstName" || ' ' || u."lastName" as "userName" (users have firstName/lastName fields, NOT a single name field!)

🚨 CRITICAL SCHEMA FACTS:
- users table has "firstName" and "lastName" columns, NOT "name" 
- Use u."firstName" || ' ' || u."lastName" or CONCAT(u."firstName", ' ', u."lastName") for user names
- purchase_requests table does NOT have "supplierId" - suppliers are linked through purchase_orders only
- Table names use snake_case: pr_items, po_items, rf_items, mr_items, gr_items (NOT camelCase)
- Column names use camelCase with quotes: "itemId", "branchId", "createdById"

🚨 ENUM VALUES - USE EXACT VALUES:
- PRStatus: 'DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED', 'CONVERTED_TO_PO' (NO 'PENDING'!)
- POStatus: 'DRAFT', 'SENT_TO_SUPPLIER', 'CONFIRMED', 'CLOSED', 'CANCELLED'
- RFStatus: 'DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED', 'TRANSFERRED'
- MRStatus: 'DRAFT', 'APPROVED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'
- GRStatus: 'DRAFT', 'RECEIVED', 'COMPLETED'
- MLStatus: 'DRAFT', 'APPROVED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'
- UserRole: 'SYSTEM_ADMIN', 'BRANCH_MANAGER', 'INVENTORY_CLERK', 'PROCUREMENT_SPECIALIST', 'PRODUCTION_PLANNER'

⚠️ CRITICAL: For "pending" requests, use status IN ('DRAFT', 'SUBMITTED') - there is NO 'PENDING' status!
⚠️ CRITICAL: For "sent" purchase orders, use status = 'SENT_TO_SUPPLIER' - NOT 'SENT'!

SECURITY CONSTRAINTS:
- ONLY generate SELECT queries. No INSERT, UPDATE, DELETE, DROP, CREATE, ALTER, or other modifications allowed.
- Use parameterized queries with $1, $2, etc. for all user inputs.
- Always include proper WHERE clauses to limit data access based on user context.
- Limit results with LIMIT clause (max 100 rows unless specifically asked for more).

USER CONTEXT:
- User ID: ${userContext.userId}
- Branch ID: ${userContext.branchId || 'N/A'}
- User Role: ${userContext.userRole}

QUESTION: "${question}"

🚨 FINAL REMINDER: Your SQL MUST include JOINs to get human-readable names. Users should see item names, branch names, etc. - NOT UUIDs! 🚨

Respond with JSON in this exact format:
{
  "sql": "SELECT ... FROM ... JOIN ... WHERE ... LIMIT ...",
  "values": [value1, value2, ...],
  "explanation": "Brief explanation of what the query does"
}

Make sure the SQL includes JOINs for readable names and is valid PostgreSQL syntax with proper parameterization.
    `.trim();

    try {
      // Log the AI prompt being sent
      console.log('\n🤖 ===== AI PROMPT BEING SENT =====');
      console.log('📝 Prompt Length:', prompt.length, 'characters');
      console.log('🎯 Key sections:');
      console.log('  - Question:', question);
      console.log('  - User Role:', userContext.userRole);
      console.log('  - Branch ID:', userContext.branchId || 'N/A');
      console.log('\n📋 Full AI Prompt:');
      console.log('='.repeat(80));
      console.log(prompt);
      console.log('='.repeat(80));
      const response = await this.geminiService.generateText(prompt);

      console.log('\n🔄 ===== RAW AI RESPONSE =====');
      console.log('📤 Raw Response Length:', response.length, 'characters');
      console.log('📤 Raw AI Response:');
      console.log(response);

      // Parse the JSON response with improved error handling
      const cleanResponse = response.replace(/```json|```/g, '').trim();

      console.log('\n🧹 ===== CLEANED AI RESPONSE =====');
      console.log('🔧 Cleaned Response:');
      console.log(cleanResponse);

      // Parse the JSON response with improved error handling
      const parsed = await this.parseAIResponse(cleanResponse);

      console.log('\n✅ ===== PARSED AI RESPONSE =====');
      console.log('📊 Parsed SQL:', parsed.sql);
      console.log('🔧 Parsed Values:', parsed.values);
      console.log('💬 Parsed Explanation:', parsed.explanation); // Validate the response structure
      if (!Array.isArray(parsed.values) || !parsed.explanation) {
        console.log('\n❌ ===== AI RESPONSE VALIDATION FAILED =====');
        console.log('🚫 Missing required fields in AI response');
        throw new Error('Invalid response format from AI');
      } // Handle cases where AI cannot generate SQL (sql: null)
      if (parsed.sql === null) {
        console.log('\n⚠️ ===== AI CANNOT GENERATE SQL =====');
        console.log('💭 AI Explanation:', parsed.explanation);

        // Return a valid SQLQueryResult with null SQL
        return {
          sql: null,
          values: [],
          explanation: parsed.explanation,
        };
      }

      // Validate SQL is a non-empty string when provided
      if (typeof parsed.sql !== 'string' || parsed.sql.trim() === '') {
        console.log('\n❌ ===== INVALID SQL FORMAT =====');
        console.log('🚫 SQL must be a non-empty string');
        throw new Error('Invalid SQL format from AI');
      }

      console.log('\n✅ AI Response Validation: PASSED');

      return {
        sql: parsed.sql,
        values: parsed.values,
        explanation: parsed.explanation,
      };
    } catch (error) {
      console.log('\n❌ ===== AI SQL GENERATION ERROR =====');
      console.log('🚫 Error Details:', error);
      this.logger.error('Failed to generate SQL with AI:', error);
      throw new Error('Failed to generate SQL query');
    }
  }

  /**
   * Validate SQL query for security
   */
  private validateSQL(sql: string): { isValid: boolean; errors: string[] } {
    console.log('\n🔍 ===== SQL VALIDATION STARTED =====');
    console.log('📝 SQL to validate:', sql);

    const errors: string[] = [];
    const lowerSQL = sql.toLowerCase().trim();

    // Check if it's a SELECT query
    if (!lowerSQL.startsWith('select')) {
      errors.push('Only SELECT queries are allowed');
    }

    // Check for dangerous keywords using word boundaries to avoid false positives
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
      'declare',
      'set',
      'grant',
      'revoke',
    ];

    // Use word boundaries to ensure we match whole words, not parts of column names
    for (const keyword of dangerousKeywords) {
      const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
      if (regex.test(lowerSQL)) {
        console.log(`🚫 Found dangerous keyword: ${keyword}`);
        errors.push(`Dangerous keyword detected: ${keyword}`);
      }
    }

    // Check for comment patterns that could be used for SQL injection
    const commentPatterns = ['--', '/*', '*/'];
    for (const pattern of commentPatterns) {
      if (lowerSQL.includes(pattern)) {
        console.log(`🚫 Found dangerous comment pattern: ${pattern}`);
        errors.push(`Dangerous comment pattern detected: ${pattern}`);
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
        console.log(`🚫 Found SQL injection pattern: ${pattern}`);
        errors.push('Potential SQL injection pattern detected');
      }
    }

    console.log('🔍 Validation result:', errors.length === 0 ? 'PASSED' : 'FAILED');
    if (errors.length > 0) {
      console.log('🚫 Validation errors:', errors);
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
   */ private async generateExplanation(
    originalQuestion: string,
    results: unknown[],
    queryExplanation: string
  ): Promise<string> {
    const prompt = `
You are a SupplySense management assistant. A user asked: "${originalQuestion}"

The database query returned ${
      results.length
    } results. Here's the query explanation: ${queryExplanation}

Sample of the data (first 3 rows):
${JSON.stringify(results.slice(0, 3), null, 2)}

CRITICAL INSTRUCTIONS FOR HUMAN-READABLE RESPONSES:
- NEVER reference item IDs like "78802d98-5b57-4e7b-a269-2c9fed5236cb" in your response
- ALWAYS use item names, SKUs, or descriptions instead of IDs
- NEVER reference branch IDs - use branch names instead  
- NEVER reference supplier IDs - use supplier names instead
- NEVER reference user IDs - use user names instead
- If you see fields like "itemName", "itemSku", "branchName", "supplierName", "userName" - use those values
- If the data contains both IDs and names, ONLY mention the names in your response

🚨 MANDATORY TABULAR FORMAT REQUIREMENT:
- ALWAYS present the data in a clean, readable table format using Markdown tables
- Include relevant columns with descriptive headers
- Show all rows (or a reasonable sample if too many)
- Use proper table alignment and formatting
- Add a summary/insights section after the table

Example format:
## Query Results

| Request Number | Item Name | SKU | Current Stock | Requested Qty | Branch | Status |
|----------------|-----------|-----|---------------|---------------|--------|--------|
| PR000123 | Office Supplies | OFF-001 | 5 | 50 | Main Branch | DRAFT |
| PR000124 | Electronic Components | ELC-002 | 2 | 25 | Warehouse A | SUBMITTED |

### Summary & Insights:
- Found 2 purchase requests for low stock items
- Office Supplies and Electronic Components need immediate attention
- Both items are below safety stock levels

Example of what NOT to do:
❌ "Item 78802d98-5b57-4e7b-a269-2c9fed5236cb needs attention"

Example of what TO do: 
✅ Present data in clean tables with proper headers and readable values
✅ "Electronic Component XYZ needs attention"
✅ "Office Supplies (SKU: OFF-001) are running low"

RESPONSE FORMAT REQUIREMENTS:
1. Start with a brief introduction
2. Present data in a markdown table with appropriate columns
3. Add a "Summary & Insights" section with key findings
4. Include actionable recommendations if applicable
5. Use proper markdown formatting (headers, tables, bullet points)

Keep the response professional and relevant to supply chain management.
REMEMBER: Users should never see database IDs in your response - only human-readable names and values!
    `.trim();

    try {
      return await this.geminiService.generateText(prompt);
    } catch (error) {
      this.logger.error('Failed to generate explanation:', error);
      // Fallback to basic explanation      return `Found ${results.length} results for your query: ${queryExplanation}`;
    }
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

  /**
   * Parse AI response with robust error handling and fallback mechanisms
   */
  private async parseAIResponse(cleanResponse: string): Promise<ParsedAIResponse> {
    try {
      return JSON.parse(cleanResponse) as ParsedAIResponse;
    } catch (jsonError) {
      console.log('\n❌ ===== JSON PARSING FAILED =====');
      console.log('🚫 JSON Parse Error:', (jsonError as Error).message);
      console.log('🔍 Attempting to extract and fix valid JSON...');

      return this.extractJsonFromResponse(cleanResponse);
    }
  }

  /**
   * Extract and fix JSON from malformed AI response
   */
  private extractJsonFromResponse(cleanResponse: string): ParsedAIResponse {
    // Try to extract JSON from response that might contain extra text
    const jsonMatch = cleanResponse.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.log('🚫 No valid JSON structure found in response');
      throw new Error(
        `AI response does not contain valid JSON. Response: ${cleanResponse.substring(0, 200)}...`
      );
    }

    console.log('🔍 Found potential JSON block, attempting to fix and parse...');
    const extractedJson = jsonMatch[0];

    try {
      // First attempt: Parse as-is
      const parsed = JSON.parse(extractedJson) as ParsedAIResponse;
      console.log('✅ Successfully parsed extracted JSON as-is');
      return parsed;
    } catch (_extractError) {
      console.log('🔧 JSON extraction failed, attempting to fix SQL field issues...');
      return this.fixAndParseJson(extractedJson, cleanResponse);
    }
  }

  /**
   * Fix common JSON issues and parse, with manual extraction fallback
   */
  private fixAndParseJson(extractedJson: string, cleanResponse: string): ParsedAIResponse {
    try {
      // Fix common issues with SQL field containing unescaped content
      let fixedJson = extractedJson.replace(
        /"sql":\s*"([^"]*(?:\\.[^"]*)*)"/,
        (_match, sqlContent) => {
          // Handle SQL with newlines, comments, and quotes
          const fixedSql = sqlContent
            .replace(/\\/g, '\\\\') // Escape backslashes
            .replace(/"/g, '\\"') // Escape quotes
            .replace(/\n/g, '\\n') // Escape newlines
            .replace(/\r/g, '\\r') // Escape carriage returns
            .replace(/\t/g, '\\t'); // Escape tabs
          return `"sql": "${fixedSql}"`;
        }
      );

      // Also fix explanation field if it has similar issues
      fixedJson = fixedJson.replace(
        /"explanation":\s*"([^"]*(?:\\.[^"]*)*)"/,
        (_match, explanation) => {
          const fixedExplanation = explanation
            .replace(/\\/g, '\\\\')
            .replace(/"/g, '\\"')
            .replace(/\n/g, '\\n')
            .replace(/\r/g, '\\r')
            .replace(/\t/g, '\\t');
          return `"explanation": "${fixedExplanation}"`;
        }
      );

      console.log('🔧 Fixed JSON structure:');
      console.log(fixedJson);

      const parsed = JSON.parse(fixedJson) as ParsedAIResponse;
      console.log('✅ Successfully parsed fixed JSON');
      return parsed;
    } catch (fixError) {
      console.log('🚫 Failed to fix and parse JSON:', (fixError as Error).message);
      return this.manuallyExtractFields(cleanResponse);
    }
  }

  /**
   * Manual field extraction as final fallback
   */
  private manuallyExtractFields(cleanResponse: string): ParsedAIResponse {
    console.log('🔧 Attempting manual field extraction...');
    try {
      const sqlMatch =
        cleanResponse.match(/"sql":\s*"([^"]*(?:\\.[^"]*)*)"/) ||
        cleanResponse.match(/SELECT[\s\S]*?(?="|$)/i);
      const valuesMatch = cleanResponse.match(/"values":\s*(\[[^\]]*\])/);
      const explanationMatch =
        cleanResponse.match(/"explanation":\s*"([^"]*(?:\\.[^"]*)*)"/) ||
        cleanResponse.match(/explanation['"]\s*:\s*['"]([^'"]*?)['"](?:\s*[,}])/);

      if (sqlMatch && valuesMatch && explanationMatch) {
        let sql = sqlMatch[1] || sqlMatch[0];
        const valuesStr = valuesMatch[1];
        let explanation = explanationMatch[1];

        // Clean up SQL
        sql = sql.replace(/\\n/g, '\n').replace(/\\"/g, '"').trim();
        explanation = explanation.replace(/\\"/g, '"').trim();

        // Parse values array
        let values: unknown[] = [];
        try {
          values = JSON.parse(valuesStr) as unknown[];
        } catch {
          values = [];
        }

        console.log('✅ Manual extraction successful');
        return { sql, values, explanation };
      }

      throw new Error('Could not extract required fields from AI response');
    } catch (manualError) {
      console.log('🚫 Manual extraction failed:', (manualError as Error).message);
      throw new Error(
        `AI returned invalid JSON format that could not be fixed. Response: ${cleanResponse.substring(0, 300)}...`
      );
    }
  }
}
