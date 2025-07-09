import * as crypto from 'node:crypto';
import { PrismaService } from '@/app/prisma.service';
import { Inject, Injectable } from '@nestjs/common';
import { Pool, PoolClient } from 'pg';
import { SaveDbConnectionDto } from './dto/db-connection.dto';
import type { DbCredentials, SaveConnectionResult } from './types/db-connection.type';

@Injectable()
export class OnboardingService {
  private readonly connectionPools = new Map<string, Pool>();
  private readonly encryptionKey: string;

  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {
    // Use environment variable for encryption key
    this.encryptionKey = process.env.DB_ENCRYPTION_KEY || 'your-32-character-secret-key-here';
  }

  /**
   * Save database connection with full validation and error handling
   */
  async saveDbConnection(dto: SaveDbConnectionDto): Promise<SaveConnectionResult> {
    try {
      // Validate that the company exists
      const company = await this.prisma.company.findUnique({
        where: { id: dto.companyId },
      });

      if (!company) {
        return {
          success: false,
          message: 'Company not found',
        };
      }

      if (!company.isActive) {
        return {
          success: false,
          message: 'Cannot create connection for inactive company',
        };
      }

      // Check if connection already exists for this company
      const existingConnection = await this.prisma.dbConnection.findUnique({
        where: { companyId: dto.companyId },
      });

      if (existingConnection) {
        return {
          success: false,
          message: 'Database connection already exists for this company',
        };
      }

      // Test connection first
      const isConnected = await this.testConnection(dto.credentials);
      if (!isConnected) {
        return {
          success: false,
          message: 'Cannot save connection - connection test failed',
        };
      }

      // Encrypt password
      const encryptedPassword = this.encryptPassword(dto.credentials.password);

      // Generate connection hash
      const connectionHash = this.generateConnectionHash(dto.credentials);

      // Save to database
      const savedConnection = await this.prisma.dbConnection.create({
        data: {
          companyId: dto.companyId,
          host: dto.credentials.host,
          port: dto.credentials.port,
          database: dto.credentials.database,
          username: dto.credentials.username,
          encryptedPassword,
          title: dto.credentials.title || dto.credentials.database, // Use database name as default title
          sslEnabled: dto.credentials.sslEnabled || false,
          connectionHash,
        },
      });

      return {
        success: true,
        message: 'Connection saved successfully',
        connectionId: savedConnection.id,
      };
    } catch (error) {
      console.error('Failed to save connection:', error);

      // Handle specific Prisma errors
      if (error.code === 'P2002') {
        return {
          success: false,
          message: 'A database connection with these details already exists',
        };
      }

      if (error.code === 'P2003') {
        return {
          success: false,
          message: 'Invalid company ID - company not found',
        };
      }

      return {
        success: false,
        message: `Failed to save connection: ${error.message}`,
      };
    }
  }

  /*
   * Retrieve the schema of the database tables for a specific company
   * This method connects to the database and retrieves the table names from the public schema.
   */

  async getTables(companyId: string) {
    const connection = await this.getDbConnection(companyId);
    if (!connection) {
      throw new Error('Database connection not found');
    }

    // Generate connection hash to get or create pool
    const connectionHash = this.generateConnectionHash(connection);
    let pool = this.connectionPools.get(connectionHash);

    if (!pool) {
      pool = this.createPool(connection);
      this.connectionPools.set(connectionHash, pool);
    }

    const client = await pool.connect();
    try {
      const result = await client.query(
        "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'"
      );

      // Transform the result to include human-readable table names
      const formattedTables = result.rows.map((row) => ({
        table_name: row.table_name,
        display_name: this.formatTableName(row.table_name),
      }));

      return formattedTables;
    } catch (error) {
      console.error('Failed to retrieve table schema:', error);
      throw new Error('Failed to retrieve table schema');
    } finally {
      client.release();
    }
  }

  // helper methods
  /**
   * Convert table name to human-readable format
   * Examples:
   * - "Item_Master" -> "Item Master"
   * - "itemMaster" -> "Item Master"
   * - "item-master" -> "Item Master"
   * - "user_profiles" -> "User Profiles"
   */
  private formatTableName(tableName: string): string {
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

  /**
   * Encrypt password for storage
   */
  encryptPassword(password: string): string {
    try {
      const algorithm = 'aes-256-gcm';
      const iv = crypto.randomBytes(16);

      // Create a 32-byte key from the encryption key
      const key = crypto.createHash('sha256').update(this.encryptionKey).digest();

      const cipher = crypto.createCipheriv(algorithm, key, iv);

      let encrypted = cipher.update(password, 'utf8', 'hex');
      encrypted += cipher.final('hex');

      const authTag = cipher.getAuthTag();

      // Combine iv + authTag + encrypted data
      return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
    } catch (error) {
      console.error('Password encryption failed:', error);
      throw new Error('Failed to encrypt password');
    }
  }

  /**
   * Decrypt password for use
   */
  decryptPassword(encryptedPassword: string): string {
    try {
      const parts = encryptedPassword.split(':');
      if (parts.length !== 3) {
        throw new Error('Invalid encrypted password format');
      }

      const iv = Buffer.from(parts[0], 'hex');
      const authTag = Buffer.from(parts[1], 'hex');
      const encrypted = parts[2];

      // Create a 32-byte key from the encryption key
      const key = crypto.createHash('sha256').update(this.encryptionKey).digest();

      const algorithm = 'aes-256-gcm';
      const decipher = crypto.createDecipheriv(algorithm, key, iv);
      decipher.setAuthTag(authTag);

      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');

      return decrypted;
    } catch (error) {
      console.error('Password decryption failed:', error);
      throw new Error('Failed to decrypt password');
    }
  }
  /**
   * Test database connection
   */
  async testConnection(credentials: DbCredentials): Promise<boolean> {
    let pool: Pool;
    let client: PoolClient;

    try {
      pool = this.createPool(credentials);
      client = await pool.connect();

      // Test with a simple query
      await client.query('SELECT 1');

      return true;
    } catch (error) {
      console.error('Database connection test failed:', error);
      return false;
    } finally {
      if (client) {
        client.release();
      }
      if (pool) {
        await pool.end();
      }
    }
  }
  /**
   * Generate connection hash for uniqueness
   */
  generateConnectionHash(credentials: DbCredentials): string {
    const connectionString = `${credentials.host}:${credentials.port}:${credentials.database}:${credentials.username}`;
    return crypto.createHash('sha256').update(connectionString).digest('hex');
  }

  /**
   * Create a new connection pool
   */
  private createPool(credentials: DbCredentials): Pool {
    const poolConfig = {
      host: credentials.host,
      port: credentials.port,
      database: credentials.database,
      user: credentials.username,
      password: credentials.password,
      ssl: credentials.sslEnabled ? { rejectUnauthorized: false } : false,
      max: 10, // Maximum number of connections
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    };

    return new Pool(poolConfig);
  }

  /**
   * Get database connection for a company
   */
  async getDbConnection(companyId: string): Promise<DbCredentials | null> {
    try {
      const connection = await this.prisma.dbConnection.findUnique({
        where: { companyId },
      });

      if (!connection) {
        return null;
      }

      // Decrypt password
      const decryptedPassword = this.decryptPassword(connection.encryptedPassword);

      return {
        host: connection.host,
        port: connection.port,
        database: connection.database,
        username: connection.username,
        password: decryptedPassword,
        sslEnabled: connection.sslEnabled,
      };
    } catch (error) {
      console.error('Failed to retrieve database connection:', error);
      throw new Error('Failed to retrieve database connection');
    }
  }

  /**
   * Close all connection pools
   */
  async closeAllConnections(): Promise<void> {
    const closePromises = Array.from(this.connectionPools.values()).map((pool) => pool.end());
    await Promise.all(closePromises);
    this.connectionPools.clear();
  }

  /**
   * Clean up on application shutdown
   */
  async onModuleDestroy(): Promise<void> {
    await this.closeAllConnections();
  }
}
