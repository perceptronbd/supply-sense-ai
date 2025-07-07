# Developer Guide: SupplySense Chat-Ops SaaS MVP

> **Note:** This system uses a company-based schema for multi-tenancy. All references to "tenant" or "tenantId" in API, database, and logic should be interpreted as "company" or "companyId". There is no separate tenants schema; all isolation and tracking is company-based.

## Purpose

This document outlines end-to-end developer instructions for implementing the user onboarding flow, metadata collection, schema generation, chat-ops integration, and the subscription/payment/rate-limiting system for the SupplySense MVP. It covers UI prompts, API endpoints, data models, and schema refresh strategies.

---

## Subscription Packages & Payment Integration

### Packages

- **Starter (Free Trial)**: No credit card required. Basic features, lowest rate limits and token quota. Intended as a trial before upgrade. All usage limitations apply.
- **Business**: Paid. Increased rate limits and tokens, more features.
- **Enterprise**: Paid. Highest limits, premium features, priority support.

Each package defines:
- Maximum monthly API/chat rate limit (requests/messages).
- Monthly token quota (for LLM/AI usage).
- Feature access.

### Payment Integration

- Starter plan does not require payment or credit card.
- Payment required to activate Business or Enterprise subscription (Stripe or similar).
- Payment handled during onboarding after account creation, before database connection (except for Starter).
- Subscription status (active, trial, cancelled, etc.) is stored and checked on each request.

### Rate Limiting & Token Usage

- Each tenant's usage is tracked per connected database.
- Rate limits and token quotas are enforced per package and per database connection.
- Exceeding limits disables chat/API access until quota resets or package is upgraded.

---

## 1. Project Setup & Prerequisites

### Monorepo Structure (NX)

- `apps/frontend`: Next.js React app
- `apps/backend`: NestJS API + MCP services
- `libs/shared`: Shared types and utilities

### Databases

- App DB (PostgreSQL) for company records, metadata, credentials, subscription, payment, and usage tracking
- Customer DBs: company-specific Postgres or SQL Server instances

### Libraries & Tools

- pg / typeorm or prisma for DB introspection and queries
- bcrypt & Node.js crypto for credential hashing and encryption
- NestJS modules: @nestjs/typeorm, @nestjs/jwt, @nestjs/config, @nestjs/bull
- UI: TailwindCSS, shadcn/ui components

## 2. High-Level User Flow

1. Sign-Up / Login
2. **Subscription Selection & Payment**
3. Database Connection (Structured)
4. Table Discovery & Selection
5. Metadata Capture
6. Relationship Confirmation
7. Business Context Entry
8. Schema Assembly & Caching
9. Chat Interface Launch
10. Message Processing & SQL Execution (with rate limiting)
11. Schema Refresh (Post-Onboarding Updates)

> All steps below use "company" and "companyId" as the multi-tenancy key.

## 3. Detailed Steps

### 3.1 Sign-Up / Login

#### Frontend

Next.js pages `/auth/signup` & `/auth/login`

#### Backend

NestJS AuthController:

- `POST /auth/register`: validate email/password, hash password, create Company
- `POST /auth/login`: verify hash, issue JWT 


---

### 3.2 Subscription Selection & Payment

#### Frontend

- `/onboarding/subscription`: Choose package (starter, business, enterprise)
- `/onboarding/payment`: Enter payment details (Stripe, etc.)

#### Backend

- `POST /onboarding/subscribe`: Select package, initiate payment
- `POST /onboarding/payment`: Process payment, activate subscription

#### App DB Tables

```sql
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY,
  company_id UUID REFERENCES companies(id),
  package TEXT NOT NULL, -- 'starter', 'business', 'enterprise'
  status TEXT NOT NULL, -- 'active', 'trial', 'cancelled'
  started_at TIMESTAMP DEFAULT now(),
  expires_at TIMESTAMP,
  payment_provider TEXT,
  payment_id TEXT
);

CREATE TABLE usage_limits (
  id UUID PRIMARY KEY,
  company_id UUID REFERENCES companies(id),
  db_connection_id UUID, -- references db_connections
  package TEXT NOT NULL,
  rate_limit INTEGER NOT NULL, -- e.g. max requests per month
  token_quota INTEGER NOT NULL, -- e.g. max tokens per month
  used_requests INTEGER DEFAULT 0,
  used_tokens INTEGER DEFAULT 0,
  period_start TIMESTAMP DEFAULT now(),
  period_end TIMESTAMP
);
```

- On payment success, activate subscription and initialize usage_limits for each db connection.
- On downgrade/upgrade, update limits and quotas accordingly.

---

### 3.2 Database Connection (Structured)

#### UI

`/onboarding/connect-db` form collects:

- host, port, database, username, password
- (Optional) schema name, ssl toggle

#### API

`POST /onboarding/db-connect`

**Flow:**

1. Validate JWT → extract companyId
2. Attempt connection via pg or typeorm using structured fields
3. On success:
   - Encrypt sensitive fields (password) with AES-256-KMS
   - Hash non-sensitive fields (host, database, username) to detect duplicates
   - Upsert into db_connections table keyed by hashed connection info
   - Return success + proceed to table discovery

#### App DB Table

```sql
CREATE TABLE db_connections (
  company_id UUID REFERENCES companies(id),
  host TEXT,
  port INTEGER,
  database TEXT,
  username TEXT,
  encrypted_password TEXT,
  ssl_enabled BOOLEAN DEFAULT false,
  connection_hash TEXT UNIQUE,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now(),
  PRIMARY KEY (company_id)
);
```

### 3.3 Table Discovery & Selection

#### API

`GET /onboarding/:companyId/tables`

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

`POST /onboarding/:companyId/metadata` upserts rows

### 3.5 Relationship Confirmation

#### API

`GET /onboarding/:companyId/relationships`

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

`POST /onboarding/:companyId/relationships` to upsert

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

`POST /onboarding/:companyId/context` stores it

### 3.7 Schema Assembly & Caching

#### Trigger

After metadata & relationships are saved

#### Service

`SchemaBuilderService.buildSchema(companyId)`

1. Load db_connections, table_metadata, table_relationships, company_context
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
  company_id UUID PRIMARY KEY,
  schema JSONB,
  cached_at TIMESTAMP DEFAULT now()
);
```

### 3.8 Chat Interface Launch

#### UI

`<ChatWidget companyId={id} schema={cachedSchema} />` on `/chat`

#### API

WebSocket or `POST /chat/message`

- Body: `{ companyId, message }`
- Auth: JWT validates company

---

### 3.9 Message Processing, Rate Limiting & SQL Execution

#### ChatService.processMessage(companyId, message, dbConnectionId)

1. Retrieve cached schema & context
2. **Check subscription status and usage limits for company and dbConnectionId**
   - If over rate limit or token quota, reject with error and prompt upgrade.
   - Otherwise, increment usage counters.
3. Build prompt via PromptTemplateService: include system instructions, context, schema, and user message
4. Pass prompt to MCP to generate SQL
5. Validate SQL (`/SELECT\s+/i` and append LIMIT 100)
6. Execute with per-company connection pool
7. Return result rows or human summary

#### Usage Tracking

- Each chat/message increments `used_requests` and adds to `used_tokens` in `usage_limits` for the relevant db connection.
- Quotas reset monthly or on package change.
- Admin UI shows usage stats and upgrade prompts.

#### Error Handling

- If payment fails or subscription expires, disable chat/API access.
- If rate limit or token quota exceeded, return error and suggest upgrade.
- Catch DB or LLM errors, return user-friendly prompts to rephrase.

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
