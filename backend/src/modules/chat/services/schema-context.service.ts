import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@supplysense/prisma';

export interface TableMetadata {
  tableName: string;
  tableComment?: string;
  columns: ColumnMetadata[];
  relationships: RelationshipMetadata[];
  businessContext: string;
}

export interface ColumnMetadata {
  columnName: string;
  dataType: string;
  isNullable: boolean;
  columnDefault?: string;
  columnComment?: string;
  isPrimaryKey: boolean;
  isForeignKey: boolean;
  referencedTable?: string;
  referencedColumn?: string;
}

export interface RelationshipMetadata {
  type: 'one-to-many' | 'many-to-one' | 'many-to-many';
  targetTable: string;
  foreignKey: string;
  description: string;
}

export interface SchemaContext {
  tables: TableMetadata[];
  businessRules: string[];
  lastUpdated: Date;
}

interface RawSchemaRow {
  table_name: string;
  column_name: string;
  data_type: string;
  is_nullable: string;
  column_default: string | null;
  is_primary_key: boolean;
  ordinal_position: number;
}

interface ForeignKeyRow {
  table_name: string;
  column_name: string;
  referenced_table: string;
  referenced_column: string;
}

@Injectable()
export class SchemaContextService {
  private readonly logger = new Logger(SchemaContextService.name);
  private schemaCache: SchemaContext | null = null;
  private schemaCacheTime = 0;
  private readonly CACHE_TTL = 300000; // 5 minutes

  constructor(private prisma: PrismaService) {}

  /**
   * Get comprehensive schema context with business annotations
   */
  async getSchemaContext(): Promise<SchemaContext> {
    const now = Date.now();

    // Return cached schema if it's still valid
    if (this.schemaCache && now - this.schemaCacheTime < this.CACHE_TTL) {
      this.logger.debug('Returning cached schema context');
      return this.schemaCache;
    }

    try {
      this.logger.log('Refreshing schema context from database');

      // Get table and column information
      const rawSchema = await this.getRawSchemaInfo();

      // Get foreign key relationships
      const relationships = await this.getForeignKeyRelationships();

      // Build enhanced schema context
      const tables = this.buildTableMetadata(rawSchema, relationships);

      // Add business rules and context
      const businessRules = this.getBusinessRules();

      this.schemaCache = {
        tables,
        businessRules,
        lastUpdated: new Date(),
      };

      this.schemaCacheTime = now;
      this.logger.log(`Schema context refreshed with ${tables.length} tables`);

      return this.schemaCache;
    } catch (error) {
      this.logger.error('Failed to get schema context:', error);
      throw new Error('Failed to retrieve database schema context');
    }
  }

  /**
   * Format schema context for AI consumption
   */
  formatSchemaForAI(context: SchemaContext, userRole?: string): string {
    const sections: string[] = [];

    this.addHeaderSection(sections);
    this.addHumanReadableRequirements(sections);
    this.addBusinessRules(sections, context.businessRules);
    this.addTableInformation(sections, context.tables);
    this.addRoleSpecificContext(sections, userRole);

    return sections.join('\n');
  }

  /**
   * Add header section to schema output
   */
  private addHeaderSection(sections: string[]): void {
    sections.push(
      '=== SUPPLYSENSE DATABASE SCHEMA ===',
      '',
      '🏢 SUPPLY CHAIN MANAGEMENT SYSTEM',
      'Core entities: Users, Branches, Items, Suppliers, Purchase Flow, Inventory',
      ''
    );
  }

  /**
   * Add human-readable requirements section
   */
  private addHumanReadableRequirements(sections: string[]): void {
    sections.push(
      '',
      '🎯 CRITICAL: HUMAN-READABLE RESULTS REQUIRED',
      'ALWAYS include readable names alongside IDs:',
      '- Branch data: JOIN branches b to include b."name" as "branchName"',
      '- Item data: JOIN items i to include i."sku", i."name" as "itemName"',
      '- Supplier data: JOIN suppliers s to include s."name" as "supplierName"',
      '- User data: JOIN users u to include u."name" as "userName"',
      '- Use descriptive aliases for all joined name columns',
      '- Never return raw IDs without corresponding human-readable names',
      ''
    );
  }

  /**
   * Add business rules section
   */
  private addBusinessRules(sections: string[], businessRules: string[]): void {
    sections.push('📋 BUSINESS RULES:');
    for (const rule of businessRules) {
      sections.push(`- ${rule}`);
    }
    sections.push('');
  }

  /**
   * Add table information section
   */
  private addTableInformation(sections: string[], tables: TableMetadata[]): void {
    sections.push('🗃️ DATABASE TABLES:');
    for (const table of tables) {
      this.addSingleTableInfo(sections, table);
    }
  }

  /**
   * Add information for a single table
   */
  private addSingleTableInfo(sections: string[], table: TableMetadata): void {
    sections.push(`\n📊 ${table.tableName.toUpperCase()}`);
    sections.push(`Purpose: ${table.businessContext}`);

    // Debug logging for purchase_requests
    this.debugLogTableStructure(table);

    // Add key columns
    this.addKeyColumns(sections, table);

    // Add relationships
    this.addTableRelationships(sections, table);
  }

  /**
   * Debug log table structure for specific tables
   */
  private debugLogTableStructure(table: TableMetadata): void {
    if (table.tableName === 'purchase_requests') {
      console.log('\n🔍 DEBUG: purchase_requests table structure:');
      console.log(
        'All columns:',
        table.columns.map((col) => `${col.columnName} (${col.dataType})`)
      );
    }
  }

  /**
   * Add key columns for a table
   */
  private addKeyColumns(sections: string[], table: TableMetadata): void {
    const keyColumns = table.columns.filter(
      (col) =>
        col.isPrimaryKey ||
        col.isForeignKey ||
        ['name', 'title', 'status', 'quantity', 'price'].some((key) => col.columnName.includes(key))
    );

    sections.push('Key columns:');
    for (const col of keyColumns) {
      let colDesc = `  - ${col.columnName} (${col.dataType})`;
      if (col.isPrimaryKey) colDesc += ' [PK]';
      if (col.isForeignKey) colDesc += ` [FK → ${col.referencedTable}]`;
      if (col.columnComment) colDesc += ` - ${col.columnComment}`;
      sections.push(colDesc);
    }
  }

  /**
   * Add table relationships
   */
  private addTableRelationships(sections: string[], table: TableMetadata): void {
    if (table.relationships.length > 0) {
      sections.push('Relationships:');
      for (const rel of table.relationships) {
        sections.push(`  - ${rel.type} with ${rel.targetTable} via ${rel.foreignKey}`);
      }
    }
  }

  /**
   * Add role-specific context if provided
   */
  private addRoleSpecificContext(sections: string[], userRole?: string): void {
    if (userRole) {
      sections.push('');
      sections.push(`👤 USER ROLE CONTEXT: ${userRole.toUpperCase()}`);
      sections.push(this.getRoleSpecificContext(userRole));
    }
  }

  /**
   * Get raw schema information from database
   */
  private async getRawSchemaInfo(): Promise<RawSchemaRow[]> {
    return await this.prisma.$queryRaw`
      SELECT 
        t.table_name,
        c.column_name,
        c.data_type,
        c.is_nullable,
        c.column_default,
        CASE WHEN pk.column_name IS NOT NULL THEN true ELSE false END as is_primary_key,
        c.ordinal_position
      FROM information_schema.tables t
      LEFT JOIN information_schema.columns c ON t.table_name = c.table_name
      LEFT JOIN (
        SELECT kcu.column_name, kcu.table_name
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
        WHERE tc.constraint_type = 'PRIMARY KEY'
      ) pk ON c.column_name = pk.column_name AND c.table_name = pk.table_name
      WHERE t.table_schema = 'public'
      AND t.table_name IN (
        'users', 'branches', 'items', 'suppliers', 'stock', 'item_suppliers',
        'purchase_requests', 'pr_items', 'pr_templates', 'pr_template_items',
        'purchase_orders', 'po_items', 
        'request_forms', 'rf_items', 'rf_templates', 'rf_template_items',
        'material_requisitions', 'mr_items',
        'goods_receipts', 'gr_items',
        'manufacturing_lists', 'formulas', 'formula_items',
        'ai_suggestions', 'notifications', 'audit_logs'
      )
      ORDER BY t.table_name, c.ordinal_position;
    `;
  }

  /**
   * Get foreign key relationships
   */
  private async getForeignKeyRelationships(): Promise<ForeignKeyRow[]> {
    return await this.prisma.$queryRaw`
      SELECT 
        kcu.table_name,
        kcu.column_name,
        ccu.table_name AS referenced_table,
        ccu.column_name AS referenced_column,
        tc.constraint_name
      FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
      JOIN information_schema.constraint_column_usage ccu ON tc.constraint_name = ccu.constraint_name
      WHERE tc.constraint_type = 'FOREIGN KEY'
      AND tc.table_schema = 'public';
    `;
  }

  /**
   * Build table metadata with business context
   */
  private buildTableMetadata(
    rawSchema: RawSchemaRow[],
    relationships: ForeignKeyRow[]
  ): TableMetadata[] {
    const tableMap = new Map<string, TableMetadata>();

    // Group by table
    for (const row of rawSchema) {
      if (!tableMap.has(row.table_name)) {
        tableMap.set(row.table_name, {
          tableName: row.table_name,
          tableComment: undefined, // PostgreSQL doesn't have table_comment in information_schema
          columns: [],
          relationships: [],
          businessContext: this.getTableBusinessContext(row.table_name),
        });
      }

      const table = tableMap.get(row.table_name);
      if (!table) {
        continue; // Skip if table not found
      }

      // Find foreign key info for this column
      const fkInfo = relationships.find(
        (rel) => rel.table_name === row.table_name && rel.column_name === row.column_name
      );

      table.columns.push({
        columnName: row.column_name,
        dataType: row.data_type,
        isNullable: row.is_nullable === 'YES',
        columnDefault: row.column_default,
        columnComment: undefined, // PostgreSQL doesn't have column_comment in information_schema
        isPrimaryKey: row.is_primary_key,
        isForeignKey: !!fkInfo,
        referencedTable: fkInfo?.referenced_table,
        referencedColumn: fkInfo?.referenced_column,
      });
    }

    // Add relationship metadata
    for (const rel of relationships) {
      const table = tableMap.get(rel.table_name);
      if (table) {
        table.relationships.push({
          type: 'many-to-one', // Most FKs are many-to-one
          targetTable: rel.referenced_table,
          foreignKey: rel.column_name,
          description: `Links to ${rel.referenced_table}`,
        });
      }
    }

    return Array.from(tableMap.values());
  }

  /**
   * Get business context for each table
   */
  private getTableBusinessContext(tableName: string): string {
    const contexts: Record<string, string> = {
      users:
        'System users with role-based access (admins, managers, clerks, specialists, planners). Always show user "name" not just ID.',
      branches:
        'Physical locations/warehouses where inventory is stored and operations occur. Always show branch "name" and "code" not just ID.',
      items:
        'Product catalog with SKU, descriptions, units, and categories. Always show item "sku" and "name" not just ID.',
      suppliers:
        'Vendor information including contact details, ratings, and payment terms. Always show supplier "name" not just ID.',
      item_suppliers:
        'Item-supplier relationships with pricing and terms. Links items to their suppliers.',
      stock:
        'Real-time inventory levels per item per branch with stock movements. Join with items and branches for readable names.',
      purchase_requests:
        'Internal requests for items needed, requiring approval workflow. Include user names, branch names, and supplier names.',
      pr_items:
        'Individual line items within purchase requests. CRITICAL: Join with items table to show item names and SKUs, not just IDs.',
      pr_templates: 'Reusable purchase request templates for common scenarios.',
      pr_template_items: 'Template line items for purchase request templates.',
      purchase_orders:
        'Formal orders sent to suppliers after PR approval. Include supplier names, branch names, and user names.',
      po_items:
        'Individual line items within purchase orders. Always join with items table to show item details.',
      request_forms:
        'Inter-branch transfer requests. Include source/destination branch names and user context.',
      rf_items:
        'Individual items requested in transfer forms. Always include item names and details.',
      rf_templates: 'Reusable request form templates.',
      rf_template_items: 'Template line items for request form templates.',
      material_requisitions:
        'Execution of transfers or production consumption. Include branch names and item details.',
      mr_items: 'Individual items in material requisitions. Always join with items for names.',
      goods_receipts:
        'Records of items received from suppliers, updating inventory. Include supplier names and item details.',
      gr_items:
        'Individual items received in goods receipts. Always include item names and details.',
      manufacturing_lists:
        'Production planning lists specifying required materials. Include item names and branch context.',
      formulas:
        'Manufacturing recipes defining component requirements. Include item names for inputs and outputs.',
      formula_items:
        'Individual components within manufacturing formulas. Always include item names and details.',
      ai_suggestions: 'AI-generated recommendations for optimization and insights',
      notifications: 'System alerts and user notifications',
      audit_logs: 'Complete audit trail of all system operations',
    };

    return contexts[tableName] || 'Business entity in supply chain management system';
  }
  /**
   * Get business rules for the schema
   */
  private getBusinessRules(): string[] {
    return [
      'CRITICAL: Always include human-readable names (branch names, item names, user names, etc.) in query results',
      'Users are assigned to specific branches and can only access their branch data (unless admin)',
      'Purchase Requests must be approved before becoming Purchase Orders',
      'Stock levels are updated when Goods Receipts are processed',
      'Material Requisitions transfer items between branches',
      'All operations maintain complete audit trails',
      'Role-based access: SYSTEM_ADMIN (all), BRANCH_MANAGER (branch scope), others (limited)',
      'Financial amounts are stored in decimal format for precision',
      'All records include created/updated timestamps for tracking',
      'Status fields follow defined workflows (PENDING → APPROVED → COMPLETED)',
      'Foreign key relationships maintain data integrity across entities',
    ];
  }

  /**
   * Get role-specific context for queries
   */
  private getRoleSpecificContext(role: string): string {
    const contexts: Record<string, string> = {
      SYSTEM_ADMIN:
        'Full access to all data across all branches. Can view system-wide reports and analytics.',
      BRANCH_MANAGER:
        'Access to all data within assigned branch. Can approve requests and manage branch operations.',
      INVENTORY_CLERK:
        'Focus on goods receipts, stock levels, and inventory movements within branch.',
      PROCUREMENT_SPECIALIST:
        'Access to purchase requests, orders, and supplier information for purchasing activities.',
      PRODUCTION_PLANNER:
        'Access to manufacturing lists, formulas, and material requirements for production planning.',
    };

    return (
      contexts[role] || 'Standard user access with limited scope to assigned branch operations.'
    );
  }

  /**
   * Invalidate schema cache (useful for tests or schema changes)
   */
  invalidateCache(): void {
    this.schemaCache = null;
    this.schemaCacheTime = 0;
    this.logger.log('Schema cache invalidated');
  }
}
