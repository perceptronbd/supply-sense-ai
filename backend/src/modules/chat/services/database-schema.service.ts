import { PrismaService } from '@app/prisma.service';
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';

export interface SchemaColumn {
  name: string;
  type: string;
  nullable: boolean;
  default: string | null;
  maxLength?: number;
  precision?: number;
  scale?: number;
}

export interface SchemaForeignKey {
  column: string;
  references: string;
  referencedTable: string;
  referencedColumn: string;
}

export interface SchemaTable {
  name: string;
  columns: SchemaColumn[];
  foreignKeys: SchemaForeignKey[];
  primaryKeys: string[];
}

export interface DatabaseSchemaInfo {
  tables: SchemaTable[];
  relationships: Array<{
    fromTable: string;
    toTable: string;
    column: string;
    description: string;
  }>;
  criticalNotes: string[];
  humanReadableFields: Array<{
    tableName: string;
    idField: string;
    nameFields: string[];
    displayFormat: string;
  }>;
}

@Injectable()
export class DatabaseSchemaService implements OnModuleInit {
  private readonly logger = new Logger(DatabaseSchemaService.name);
  private schemaCache: DatabaseSchemaInfo | null = null;
  private isInitialized = false;

  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit() {
    if (!this.prisma) {
      this.logger.error('PrismaService not injected properly');
      return;
    }

    try {
      await this.loadDatabaseSchema();
      this.isInitialized = true;
      this.logger.log('Database schema loaded and cached successfully');
    } catch (error) {
      this.logger.error('Failed to load database schema on module init:', error);
    }
  }

  /**
   * Get complete database schema information (memoized)
   */
  async getDatabaseSchema(): Promise<DatabaseSchemaInfo> {
    if (!this.prisma) {
      throw new Error('PrismaService not available');
    }

    if (!this.schemaCache) {
      await this.loadDatabaseSchema();
    }

    if (!this.schemaCache) {
      throw new Error('Failed to load database schema');
    }

    return this.schemaCache;
  }

  /**
   * Load database schema from actual database
   */
  private async loadDatabaseSchema(): Promise<void> {
    this.logger.log('Loading database schema from information_schema...');

    try {
      // Get all tables in the public schema
      const tables = await this.prisma.$queryRaw<Array<{ table_name: string }>>`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_type = 'BASE TABLE'
        ORDER BY table_name;
      `;

      this.logger.log(
        `Found ${tables.length} tables: ${tables.map((t) => t.table_name).join(', ')}`
      );

      const schemaDoc: DatabaseSchemaInfo = {
        tables: [],
        relationships: [],
        criticalNotes: [],
        humanReadableFields: this.getHumanReadableFieldsConfig(),
      };

      // Get detailed info for each table
      for (const table of tables) {
        const tableName = table.table_name;

        // Get columns for this table
        const columns = await this.prisma.$queryRaw<
          Array<{
            column_name: string;
            data_type: string;
            is_nullable: string;
            column_default: string | null;
            character_maximum_length: number | null;
            numeric_precision: number | null;
            numeric_scale: number | null;
          }>
        >`
          SELECT 
            column_name,
            data_type,
            is_nullable,
            column_default,
            character_maximum_length,
            numeric_precision,
            numeric_scale
          FROM information_schema.columns 
          WHERE table_schema = 'public' 
          AND table_name = ${tableName}
          ORDER BY ordinal_position;
        `;

        // Get foreign keys for this table
        const foreignKeys = await this.prisma.$queryRaw<
          Array<{
            column_name: string;
            foreign_table_name: string;
            foreign_column_name: string;
            constraint_name: string;
          }>
        >`
          SELECT
            kcu.column_name,
            ccu.table_name AS foreign_table_name,
            ccu.column_name AS foreign_column_name,
            tc.constraint_name
          FROM information_schema.table_constraints tc
          JOIN information_schema.key_column_usage kcu 
            ON tc.constraint_name = kcu.constraint_name
          JOIN information_schema.constraint_column_usage ccu 
            ON tc.constraint_name = ccu.constraint_name
          WHERE tc.table_schema = 'public' 
          AND tc.table_name = ${tableName}
          AND tc.constraint_type = 'FOREIGN KEY';
        `;

        // Get primary keys for this table
        const primaryKeys = await this.prisma.$queryRaw<
          Array<{
            column_name: string;
          }>
        >`
          SELECT kcu.column_name
          FROM information_schema.table_constraints tc
          JOIN information_schema.key_column_usage kcu 
            ON tc.constraint_name = kcu.constraint_name
          WHERE tc.table_schema = 'public' 
          AND tc.table_name = ${tableName}
          AND tc.constraint_type = 'PRIMARY KEY'
          ORDER BY kcu.ordinal_position;
        `;

        const tableInfo: SchemaTable = {
          name: tableName,
          columns: columns.map((col) => ({
            name: col.column_name,
            type: col.data_type,
            nullable: col.is_nullable === 'YES',
            default: col.column_default,
            maxLength: col.character_maximum_length,
            precision: col.numeric_precision,
            scale: col.numeric_scale,
          })),
          foreignKeys: foreignKeys.map((fk) => ({
            column: fk.column_name,
            references: `${fk.foreign_table_name}.${fk.foreign_column_name}`,
            referencedTable: fk.foreign_table_name,
            referencedColumn: fk.foreign_column_name,
          })),
          primaryKeys: primaryKeys.map((pk) => pk.column_name),
        };

        schemaDoc.tables.push(tableInfo);

        // Add relationships
        for (const fk of foreignKeys) {
          schemaDoc.relationships.push({
            fromTable: tableName,
            toTable: fk.foreign_table_name,
            column: fk.column_name,
            description: `${tableName}.${fk.column_name} references ${fk.foreign_table_name}.${fk.foreign_column_name}`,
          });
        }
      }

      // Generate critical notes based on actual schema
      schemaDoc.criticalNotes = this.generateCriticalNotes(schemaDoc.tables);

      this.schemaCache = schemaDoc;
      this.logger.log('Database schema cached successfully');
    } catch (error) {
      this.logger.error('Failed to load database schema:', error);
      throw error;
    }
  }

  /**
   * Generate critical notes for AI based on actual schema
   */
  private generateCriticalNotes(tables: SchemaTable[]): string[] {
    const notes: string[] = [];

    this.checkUsersTableSchema(tables, notes);
    this.checkPrItemsTableSchema(tables, notes);
    this.checkPurchaseRequestsTableSchema(tables, notes);
    this.checkCommonFieldNamingIssues(tables, notes);

    return notes;
  }

  /**
   * Check users table schema for naming issues
   */
  private checkUsersTableSchema(tables: SchemaTable[], notes: string[]): void {
    const usersTable = tables.find((t) => t.name === 'users');
    if (!usersTable) return;

    const hasName = usersTable.columns.some((c) => c.name === 'name');
    const hasFirstName = usersTable.columns.some((c) => c.name === 'firstName');
    const hasLastName = usersTable.columns.some((c) => c.name === 'lastName');

    if (!hasName && hasFirstName && hasLastName) {
      notes.push(
        'CRITICAL: users table has firstName + lastName, NOT a single "name" field. Use CONCAT(firstName, \' \', lastName)'
      );
    }
  }

  /**
   * Check pr_items table schema for column naming
   */
  private checkPrItemsTableSchema(tables: SchemaTable[], notes: string[]): void {
    const prItemsTable = tables.find((t) => t.name === 'pr_items');
    if (!prItemsTable) return;

    const hasQuantity = prItemsTable.columns.some((c) => c.name === 'quantity');
    const hasRequestedQty = prItemsTable.columns.some((c) => c.name === 'requestedQty');

    if (!hasQuantity && hasRequestedQty) {
      notes.push('CRITICAL: pr_items table uses "requestedQty", NOT "quantity"');
    }
  }

  /**
   * Check purchase_requests table schema for supplier relationship
   */
  private checkPurchaseRequestsTableSchema(tables: SchemaTable[], notes: string[]): void {
    const purchaseRequestsTable = tables.find((t) => t.name === 'purchase_requests');
    if (!purchaseRequestsTable) return;

    const hasSupplierId = purchaseRequestsTable.columns.some((c) => c.name === 'supplierId');

    if (!hasSupplierId) {
      notes.push(
        'CRITICAL: purchase_requests table has NO supplierId field. Suppliers are linked via purchase_orders table'
      );
    }
  }

  /**
   * Check for common field naming issues across all tables
   */
  private checkCommonFieldNamingIssues(tables: SchemaTable[], notes: string[]): void {
    for (const table of tables) {
      this.checkCreatedByFieldNaming(table, notes);
      this.checkForeignKeyNaming(table, notes);
    }
  }

  /**
   * Check createdBy vs createdById naming
   */
  private checkCreatedByFieldNaming(table: SchemaTable, notes: string[]): void {
    const hasCreatedBy = table.columns.some((c) => c.name === 'createdBy');
    const hasCreatedById = table.columns.some((c) => c.name === 'createdById');

    if (!hasCreatedBy && hasCreatedById) {
      notes.push(`CRITICAL: ${table.name} table uses "createdById", NOT "createdBy"`);
    }
  }

  /**
   * Check foreign key naming patterns
   */
  private checkForeignKeyNaming(table: SchemaTable, notes: string[]): void {
    for (const fk of table.foreignKeys) {
      if (fk.column.endsWith('Id') && !fk.column.endsWith('_id')) {
        notes.push(
          `INFO: ${table.name}.${fk.column} uses camelCase (${fk.column}), not snake_case`
        );
      }
    }
  }

  /**
   * Get human-readable field configurations
   */
  private getHumanReadableFieldsConfig(): Array<{
    tableName: string;
    idField: string;
    nameFields: string[];
    displayFormat: string;
  }> {
    return [
      {
        tableName: 'users',
        idField: 'id',
        nameFields: ['firstName', 'lastName', 'email'],
        displayFormat: 'CONCAT(u."firstName", \' \', u."lastName", \' (\', u."email", \')\')',
      },
      {
        tableName: 'branches',
        idField: 'id',
        nameFields: ['name', 'code'],
        displayFormat: 'CONCAT(b."name", \' (\', b."code", \')\')',
      },
      {
        tableName: 'items',
        idField: 'id',
        nameFields: ['name', 'sku'],
        displayFormat: 'CONCAT(i."name", \' (\', i."sku", \')\')',
      },
      {
        tableName: 'suppliers',
        idField: 'id',
        nameFields: ['name', 'code'],
        displayFormat: 'CONCAT(s."name", \' (\', s."code", \')\')',
      },
      {
        tableName: 'purchase_requests',
        idField: 'id',
        nameFields: ['prNumber', 'title'],
        displayFormat: 'CONCAT(pr."prNumber", \': \', pr."title")',
      },
      {
        tableName: 'purchase_orders',
        idField: 'id',
        nameFields: ['poNumber', 'title'],
        displayFormat: 'CONCAT(po."poNumber", \': \', po."title")',
      },
    ];
  }

  /**
   * Format schema for AI consumption with accurate information
   */
  formatSchemaForAI(userRole?: string): string {
    if (!this.schemaCache) {
      throw new Error('Database schema not loaded. Call getDatabaseSchema() first.');
    }

    const { tables, relationships, criticalNotes, humanReadableFields } = this.schemaCache;

    let output = this.generateSchemaHeader();
    output += this.generateHumanReadableFieldMappings(humanReadableFields, tables);
    output += this.generateCriticalSchemaNotesSection(criticalNotes);
    output += this.generateTablesSection(tables);
    output += this.generateRelationshipsSection(relationships);
    output += this.generateSQLExamples();
    output += this.generateAccessControlSection(userRole);
    output += this.generateFinalReminders();

    return output;
  }

  /**
   * Generate schema header section
   */
  private generateSchemaHeader(): string {
    return `# SUPPLY CHAIN DATABASE SCHEMA (ACTUAL SCHEMA FROM DATABASE)

## 🚨 CRITICAL REQUIREMENTS - HUMAN-READABLE RESULTS
NEVER return raw UUIDs/IDs to users. ALWAYS use JOINs to include human-readable names:

`;
  }

  /**
   * Generate human-readable field mappings section
   */
  private generateHumanReadableFieldMappings(
    humanReadableFields: Array<{
      tableName: string;
      idField: string;
      nameFields: string[];
      displayFormat: string;
    }>,
    tables: SchemaTable[]
  ): string {
    let output = '';
    for (const field of humanReadableFields) {
      const table = tables.find((t) => t.name === field.tableName);
      if (table) {
        output += `### ${field.tableName.toUpperCase()}\n`;
        output += `- ID Field: ${field.idField}\n`;
        output += `- Name Fields: ${field.nameFields.join(', ')}\n`;
        output += `- Use: ${field.displayFormat}\n\n`;
      }
    }
    return output;
  }

  /**
   * Generate critical schema notes section
   */
  private generateCriticalSchemaNotesSection(criticalNotes: string[]): string {
    let output = '## 🚨 CRITICAL SCHEMA NOTES\n';
    for (const note of criticalNotes) {
      output += `- ${note}\n`;
    }
    return output;
  }

  /**
   * Generate database tables section
   */
  private generateTablesSection(tables: SchemaTable[]): string {
    let output = '\n## 📊 ACTUAL DATABASE TABLES\n\n';

    for (const table of tables) {
      output += this.generateSingleTableSection(table);
    }

    return output;
  }

  /**
   * Generate section for a single table
   */
  private generateSingleTableSection(table: SchemaTable): string {
    let output = `### ${table.name.toUpperCase()}\n`;
    output += '**Columns:**\n';

    output += this.generateTableColumns(table);
    output += this.generateTableForeignKeys(table);
    output += '\n';

    return output;
  }

  /**
   * Generate table columns information
   */
  private generateTableColumns(table: SchemaTable): string {
    let output = '';
    for (const col of table.columns) {
      const nullable = col.nullable ? 'nullable' : 'NOT NULL';
      const defaultVal = col.default ? ` DEFAULT ${col.default}` : '';
      const constraints = [];

      if (table.primaryKeys.includes(col.name)) {
        constraints.push('PRIMARY KEY');
      }

      const fk = table.foreignKeys.find((fk) => fk.column === col.name);
      if (fk) {
        constraints.push(`FK → ${fk.references}`);
      }

      const constraintStr = constraints.length > 0 ? ` [${constraints.join(', ')}]` : '';
      output += `- \`${col.name}\`: ${col.type} (${nullable})${defaultVal}${constraintStr}\n`;
    }
    return output;
  }

  /**
   * Generate table foreign keys information
   */
  private generateTableForeignKeys(table: SchemaTable): string {
    if (table.foreignKeys.length === 0) {
      return '';
    }

    let output = '**Foreign Keys:**\n';
    for (const fk of table.foreignKeys) {
      output += `- \`${fk.column}\` → \`${fk.referencedTable}.${fk.referencedColumn}\`\n`;
    }
    return output;
  }

  /**
   * Generate relationships section
   */
  private generateRelationshipsSection(relationships: Array<{ description: string }>): string {
    let output = '## 🔗 TABLE RELATIONSHIPS\n';
    for (const rel of relationships) {
      output += `- ${rel.description}\n`;
    }
    return output;
  }

  /**
   * Generate SQL examples section
   */
  private generateSQLExamples(): string {
    return `
## 📝 CORRECT SQL EXAMPLES

### Purchase Requests with Low Stock Items:
\`\`\`sql
SELECT 
  pr."id" as "purchaseRequestId",
  pr."prNumber" as "requestNumber", 
  pr."title" as "requestTitle",
  pr."status",
  i."sku" as "itemSku",
  i."name" as "itemName",
  pri."requestedQty" as "requestedQuantity",
  st."quantity" as "currentStock",
  b."name" as "branchName",
  CONCAT(u."firstName", ' ', u."lastName") as "requestedBy"
FROM purchase_requests pr
JOIN pr_items pri ON pr."id" = pri."prId"
JOIN items i ON pri."itemId" = i."id"
JOIN stock st ON i."id" = st."itemId" AND pr."branchId" = st."branchId"
JOIN branches b ON pr."branchId" = b."id"
JOIN users u ON pr."createdById" = u."id"
WHERE pr."status" = 'PENDING' 
  AND st."quantity" <= 10 
  AND pr."branchId" = $1
LIMIT 100;
\`\`\`

`;
  }

  /**
   * Generate access control section
   */
  private generateAccessControlSection(userRole?: string): string {
    if (!userRole || userRole === 'SYSTEM_ADMIN') {
      return '';
    }

    return `## 🔒 ACCESS CONTROL
Current User Role: ${userRole}
- Add WHERE branchId = $branchId for data isolation
- Filter results to user's assigned branch only

`;
  }

  /**
   * Generate final reminders section
   */
  private generateFinalReminders(): string {
    return `## ⚠️ FINAL REMINDERS
1. NEVER use non-existent columns (check the actual schema above)
2. ALWAYS use correct table names (e.g., pr_items, not purchase_request_items)
3. ALWAYS use correct column names (e.g., requestedQty, not quantity in pr_items)
4. ALWAYS JOIN to get human-readable names instead of just IDs
5. Use CONCAT for user names: CONCAT(firstName, ' ', lastName)
6. No supplierId in purchase_requests - suppliers linked via purchase_orders
`;
  }

  /**
   * Refresh schema cache (useful for development)
   */
  async refreshSchema(): Promise<void> {
    this.schemaCache = null;
    await this.loadDatabaseSchema();
    this.logger.log('Schema cache refreshed');
  }

  /**
   * Get schema for specific table
   */
  getTableSchema(tableName: string): SchemaTable | null {
    if (!this.schemaCache) {
      return null;
    }
    return this.schemaCache.tables.find((t) => t.name === tableName) || null;
  }

  /**
   * Check if service is ready
   */
  isReady(): boolean {
    return this.isInitialized && this.schemaCache !== null;
  }
}
