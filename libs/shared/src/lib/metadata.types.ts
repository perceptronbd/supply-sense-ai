// Type aliases for better maintainability
export type TUpdateFrequency = 'real-time' | 'daily' | 'weekly' | 'monthly' | 'rarely';

export interface ITableColumn {
  columnName: string;
  dataType: string;
  isNullable: boolean;
  isPrimaryKey: boolean;
  isForeignKey: boolean;
  referencedTable?: string;
  referencedColumn?: string;
  columnComment?: string;
}

export interface ITableRelationship {
  type: 'one-to-many' | 'many-to-one' | 'many-to-many';
  targetTable: string;
  foreignKey: string;
  description: string;
}

export interface ITableSchemaInput {
  columns: ITableColumn[];
  relationships?: ITableRelationship[];
}

export interface MCPTableMetadataAgentRes {
  tableName: string;
  friendlyLabel: string;
  purpose: string;
  updateFrequency: TUpdateFrequency;
  sampleQuestions: string[];
}

export interface ITableMetadataRecord {
  id: string;
  tableName: string;
  friendlyLabel: string;
  purpose: string;
  updateFrequency: string;
  dataSensitivity: string;
  sampleQuestions: string[];
}
