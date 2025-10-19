import * as crypto from 'node:crypto';
import { Pool, PoolClient } from 'pg';

const ALGORITHM = 'aes-256-gcm' as const;

export interface DbCredentials {
  title?: string;
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
  sslEnabled?: boolean;
}
// Module-level connection pools storage
const connectionPools = new Map<string, Pool>();

/**
 * Convert table name to human-readable format
 * Examples:
 * - "Item_Master" -> "Item Master"
 * - "itemMaster" -> "Item Master"
 * - "item-master" -> "Item Master"
 * - "user_profiles" -> "User Profiles"
 */
export function formatTableName(tableName: string): string {
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

// Create a 32-byte key from the encryption key
export const createEncryptionKey = (encryptionKey: string) => {
  return crypto.createHash('sha256').update(encryptionKey).digest();
};

/**
 * Encrypt password for storage
 */
export function encryptPassword(password: string, encryptionKey: string): string {
  try {
    const iv = crypto.randomBytes(16);

    const key = createEncryptionKey(encryptionKey);

    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

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
export function decryptPassword(encryptedPassword: string, encryptionKey: string): string {
  try {
    const parts = encryptedPassword.split(':');
    if (parts.length !== 3) {
      throw new Error('Invalid encrypted password format');
    }

    const iv = Buffer.from(parts[0], 'hex');
    const authTag = Buffer.from(parts[1], 'hex');
    const encrypted = parts[2];

    // Create a 32-byte key from the encryption key
    const key = createEncryptionKey(encryptionKey);

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
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
 * Parse connection string into DbCredentials
 * Supports PostgreSQL connection strings like:
 * postgresql://username:password@host:port/database
 * postgres://username:password@host:port/database
 */
export function parseConnectionString(connectionString: string): DbCredentials {
  try {
    const url = new URL(connectionString);

    if (!['postgresql:', 'postgres:'].includes(url.protocol)) {
      throw new Error('Only PostgreSQL connection strings are supported');
    }

    const host = url.hostname;
    const port = url.port ? Number.parseInt(url.port, 10) : 5432;
    const database = url.pathname.slice(1); // Remove leading slash
    const username = url.username;
    let password = url.password;

    // Try to decode password, but if it fails, use the raw string
    try {
      password = decodeURIComponent(password);
    } catch {
      // If decodeURIComponent fails, just use the raw password string
      // This allows connection attempts even with malformed percent-encoding
    }

    // Check for SSL parameter
    const sslEnabled =
      url.searchParams.get('sslmode') === 'require' || url.searchParams.get('ssl') === 'true';

    if (!host || !database || !username || !password) {
      throw new Error('Connection string must include host, database, username, and password');
    }

    return {
      host,
      port,
      database,
      username,
      password,
      sslEnabled,
    };
  } catch (error) {
    throw new Error(`Invalid connection string: ${(error as Error).message}`);
  }
}

/**
 * Test database connection
 */
export async function testConnection(credentials: DbCredentials): Promise<boolean> {
  let pool: Pool | null = null;
  let client: PoolClient | null = null;

  try {
    pool = createPool(credentials);
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
export function generateConnectionHash(credentials: DbCredentials): string {
  const connectionString = `${credentials.host}:${credentials.port}:${credentials.database}:${credentials.username}`;
  return crypto.createHash('sha256').update(connectionString).digest('hex');
}

/**
 * Create a new connection pool
 */
export function createPool(credentials: DbCredentials): Pool {
  const poolConfig = {
    host: credentials.host,
    port: credentials.port,
    database: credentials.database,
    user: credentials.username,
    password: credentials.password,
    ssl: credentials.sslEnabled ? { rejectUnauthorized: false } : false,
    max: 10, // Maximum number of connections
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 30000,
  };

  return new Pool(poolConfig);
}

/**
 * Get or create a connection pool for the given connection hash
 */
export function getOrCreatePool(connectionHash: string, credentials: DbCredentials): Pool {
  let pool = connectionPools.get(connectionHash);
  if (!pool) {
    pool = createPool(credentials);
    connectionPools.set(connectionHash, pool);
  }
  return pool;
}

/**
 * Close all connection pools
 */
export async function closeAllConnections(): Promise<void> {
  const closePromises = Array.from(connectionPools.values()).map((pool) => pool.end());
  await Promise.all(closePromises);
  connectionPools.clear();
}

/**
 * Close a specific connection pool
 */
export async function closeConnection(connectionHash: string): Promise<void> {
  const pool = connectionPools.get(connectionHash);
  if (pool) {
    await pool.end();
    connectionPools.delete(connectionHash);
  }
}

/**
 * Helper function to execute database operations with proper connection handling
 * @param credentials Database credentials or connection hash
 * @param callback Async callback function that receives a database client
 * @returns The result of the callback function
 */
export async function withDbConnection<T>(
  credentials: DbCredentials | string,
  callback: (client: PoolClient) => Promise<T>
): Promise<T> {
  const connectionHash =
    typeof credentials === 'string' ? credentials : generateConnectionHash(credentials);

  const pool =
    typeof credentials === 'string'
      ? connectionPools.get(connectionHash)
      : getOrCreatePool(connectionHash, credentials);

  if (!pool) {
    throw new Error('Database connection pool not found');
  }

  const client = await pool.connect();
  try {
    return await callback(client);
  } finally {
    client.release();
  }
}
