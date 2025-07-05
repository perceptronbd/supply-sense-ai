# Developer Guide: SupplySense Chat-Ops SaaS MVP

## Purpose

This document outlines end-to-end developer instructions for implementing the user onboarding flow, metadata collection, schema generation, and chat-ops integration for the SupplySense MVP. It covers UI prompts, API endpoints, data models, and schema refresh strategies.

## 1. Project Setup & Prerequisites

### Monorepo Structure (NX)

- `apps/frontend`: Next.js React app
- `apps/backend`: NestJS API + MCP services
- `libs/shared`: Shared types and utilities

### Databases

- App DB (PostgreSQL) for tenant records, metadata, credentials
- Customer DBs: tenant-specific Postgres or SQL Server instances

### Libraries & Tools

- pg / typeorm or prisma for DB introspection and queries
- bcrypt & Node.js crypto for credential hashing and encryption
- NestJS modules: @nestjs/typeorm, @nestjs/jwt, @nestjs/config, @nestjs/bull
- UI: TailwindCSS, shadcn/ui components

## 2. High-Level User Flow

1. Sign-Up / Login
2. Database Connection (Structured)
3. Table Discovery & Selection
4. Metadata Capture
5. Relationship Confirmation
6. Business Context Entry
7. Schema Assembly & Caching
8. Chat Interface Launch
9. Message Processing & SQL Execution
10. Schema Refresh (Post-Onboarding Updates)

## 3. Detailed Steps

### 3.1 Sign-Up / Login

#### Frontend

Next.js pages `/auth/signup` & `/auth/login`

#### Backend

NestJS AuthController:

- `POST /auth/register`: validate email/password, hash password, create Tenant
- `POST /auth/login`: verify hash, issue JWT with tenantId

#### App DB Schema

```sql
CREATE TABLE tenants (
  id UUID PRIMARY KEY,
  email TEXT UNIQUE,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT now()
);
```

### 3.2 Database Connection (Structured)

#### UI

`/onboarding/connect-db` form collects:

- host, port, database, username, password
- (Optional) schema name, ssl toggle

#### API

`POST /onboarding/db-connect`

**Flow:**

1. Validate JWT → extract tenantId
2. Attempt connection via pg or typeorm using structured fields
3. On success:
   - Encrypt sensitive fields (password) with AES-256-KMS
   - Hash non-sensitive fields (host, database, username) to detect duplicates
   - Upsert into db_connections table keyed by hashed connection info
   - Return success + proceed to table discovery

#### App DB Table

```sql
CREATE TABLE db_connections (
  tenant_id UUID REFERENCES tenants(id),
  host TEXT,
  port INTEGER,
  database TEXT,
  username TEXT,
  encrypted_password TEXT,
  ssl_enabled BOOLEAN DEFAULT false,
  connection_hash TEXT UNIQUE,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now(),
  PRIMARY KEY (tenant_id)
);
```

### 3.3 Table Discovery & Selection

#### API

`GET /onboarding/:tenantId/tables`

1. Decrypt credentials, connect to customer DB
2. Query table names:

```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public';
```

3. Return list

#### UI

Searchable, paginated checklist with defaults (order%, inventory%)

### 3.4 Metadata Capture

#### App DB Table

```sql
CREATE TABLE table_metadata (
  tenant_id UUID,
  table_name TEXT,
  friendly_label TEXT,
  purpose TEXT,
  update_frequency TEXT,
  data_sensitivity TEXT[],
  sample_questions TEXT[],
  PRIMARY KEY (tenant_id, table_name)
);
```

#### UI

Editable grid for selected tables:

- Friendly Label (auto-derived)
- Purpose (free-text)
- Update Frequency (dropdown)
- Data Sensitivity (multi-select)
- Sample Questions (multiline text)

#### API

`POST /onboarding/:tenantId/metadata` upserts rows

### 3.5 Relationship Confirmation

#### API

`GET /onboarding/:tenantId/relationships`

Query foreign keys:

```sql
SELECT tc.table_name AS foreign_table,
       kcu.column_name AS foreign_column,
       ccu.table_name AS primary_table,
       ccu.column_name AS primary_column
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name=kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name=tc.constraint_name
WHERE constraint_type='FOREIGN KEY'
  AND tc.table_schema='public';
```

Filter to selected tables

#### UI

For each relation, prompt: "Does orders.customer_id refer to customers.id?" with Yes/No radio

#### App DB Table

```sql
CREATE TABLE table_relationships (
  tenant_id UUID,
  table_name TEXT,
  column_name TEXT,
  ref_table TEXT,
  ref_column TEXT,
  is_confirmed BOOLEAN,
  PRIMARY KEY (tenant_id, table_name, column_name)
);
```

#### API

`POST /onboarding/:tenantId/relationships` to upsert

### 3.6 Business Context Entry

#### UI

Single `<textarea>` "Describe your business & goals (1–2 sentences)."

#### App DB Table

```sql
CREATE TABLE tenant_context (
  tenant_id UUID PRIMARY KEY,
  description TEXT
);
```

#### API

`POST /onboarding/:tenantId/context` stores it

### 3.7 Schema Assembly & Caching

#### Trigger

After metadata & relationships are saved

#### Service

`SchemaBuilderService.buildSchema(tenantId)`

1. Load db_connections, table_metadata, table_relationships, tenant_context
2. Connect to Customer DB
3. For each table in metadata, query columns:

```sql
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name=$1;
```

4. Build JSON schema:

```json
{
  "tables": {
    "orders": {
      "label": "Orders",
      "purpose": "Customer purchase records",
      "columns": {"id":"integer",...},
      "relationships":[{"column":"customer_id","refTable":"customers","refColumn":"id"}]
    }
  }
}
```

5. Cache in Redis or in schema_cache table with 24h TTL

#### Schema Cache Table

```sql
CREATE TABLE schema_cache (
  tenant_id UUID PRIMARY KEY,
  schema JSONB,
  cached_at TIMESTAMP DEFAULT now()
);
```

### 3.8 Chat Interface Launch

#### UI

`<ChatWidget tenantId={id} schema={cachedSchema} />` on `/chat`

#### API

WebSocket or `POST /chat/message`

- Body: `{ tenantId, message }`
- Auth: JWT validates tenant

### 3.9 Message Processing & SQL Execution

#### ChatService.processMessage(tenantId, message)

1. Retrieve cached schema & context
2. Build prompt via PromptTemplateService: include system instructions, context, schema, and user message
3. Pass prompt to MCP to generate SQL
4. Validate SQL (`/SELECT\s+/i` and append LIMIT 100)
5. Execute with per-tenant connection pool
6. Return result rows or human summary

#### Error Handling

Catch DB or LLM errors, return user-friendly prompts to rephrase

### 3.10 Schema Refresh (Post-Onboarding Updates)

#### Use Case

Tenant adds/removes tables or changes schema

#### UI Trigger

In settings, show "Refresh Schema" button

#### On Click

1. Call `POST /onboarding/:tenantId/refresh-schema`
2. Backend:
   - Re-run introspection (tables, columns, FKs)
   - Compare with cached metadata
   - For new tables: prompt user in UI to select & provide metadata
   - For removed tables: mark metadata & relationships as inactive
   - Rebuild and replace cached schema
   - Notify user when complete

#### Automated Checks

Nightly job via Bull to detect schema drift and email admin with summary of changes
