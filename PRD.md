# Product Requirements Document (PRD) for AI-Based Supply Chain Management MVP

## 1. Introduction

This document outlines the requirements for a Minimum Viable Product (MVP) of an AI-driven supply chain management solution for manufacturing industries. The goal is to provide a working prototype that demonstrates key features and allows early adopters to test core functionality. The MVP will focus on purchase requests, purchase orders, inter-branch transfers, stock handling, and production planning. It will integrate AI agents via a Model Context Protocol (MCP) layer to automate routine tasks and surface recommendations.

## 2. Product Vision

Create a system that helps manufacturing customers manage raw materials, inventory transfers, and production planning with AI assistance. The MVP will:

- Automate data gathering and simple decision making
- Give visibility into stock levels and expected needs
- Let branches request items from each other and from suppliers
- Support a basic production workflow using predefined formulas
- Show how AI agents can suggest when to reorder or transfer stock

This MVP is not a full-scale enterprise solution. It is a working prototype that proves the concept and lets a small set of customers provide feedback before building out more advanced features.

## 3. Goals and Objectives

### Basic Order Management

- Enable creation of purchase requests (PR) and purchase orders (PO)
- Offer templates for frequent items so users can create PRs and RFs quickly

### Inventory Transfers Across Branches

- Allow branches to request stock from each other (Request Form, RF)
- Let an authorized user create material requisitions (MR) and track shipments

### Stock Tracking and Cost Calculation

- Update stock levels when goods arrive (Good Received, GR)
- Calculate moving average cost for raw materials

### Production Planning Using Formulas

- Let users define product formulas based on raw materials
- Support a manufacturing list (ML) to build finished goods and adjust stock

### AI Assistance via MCP

- Implement an AI agent that watches stock levels and suggests when to create PRs
- Use MCP to let AI read and write to the database, generate simple reports, or send alerts

### Usability and Early Feedback

- Provide an intuitive user interface for core tasks
- Collect feedback on AI accuracy and overall workflow

## 4. User Roles

### System Administrator

- Manages user accounts and permissions
- Configures company-wide settings (units, currency)

### Branch Manager

- Creates and approves PRs, RFs, and MRs for their branch
- Reviews AI recommendations for reordering or transfers

### Inventory Clerk

- Executes receipt of goods (GR) and updates physical stock counts
- Prepares items for transfer (MR) and marks items as trimmed or wasted

### Procurement Specialist

- Generates POs based on approved PRs
- Communicates with suppliers and confirms delivery details

### Production Planner

- Defines formulas for recipes and manufacturing processes
- Creates ML entries to assemble finished products

### AI Agent (Automated Role)

- Monitors consumption rates and forecasts demand
- Suggests PRs, RFs, and MRs based on threshold rules
- Checks POs against receiving records to flag discrepancies

## 5. Scope of MVP

### In Scope

- Core database models for items, branches, suppliers, PRs, POs, RFs, MRs, GRs, formulas, and ML records
- Simple web interface for creating and viewing PR, PO, RF, MR, GR, and ML
- Templates for PR and RF that load common items automatically
- Stock management logic that uses a single "main unit" as base and performs unit conversions in code
- Moving average cost calculation on each receipt of goods
- AI agent connected via MCP for:
  - Notifying users when stock drops below threshold
  - Suggesting quantities for PRs or RFs
- Basic security and authentication

### Out of Scope

- Advanced forecasting models (e.g., neural networks for demand prediction)
- Supplier rate negotiation workflows
- Full audit trail with user activity logs beyond simple timestamps
- Complex approval chains (multi-level approvals)
- Mobile application (web only)
- Handling of multiple currencies or taxation rules
- Integration with external ERP systems (beyond MVP)

## 6. Functional Requirements

### 6.1. Item and Unit Definitions

- **FR-1:** Administrator can define each item with a name, SKU, and main unit.
- **FR-2:** Administrator can set conversion rates for "buying unit," "transferring unit," and "using unit."
  - Example: 1 main unit = 100 buying units = 50 transferring units = 0.01 using units.
- **FR-3:** System always stores stock quantities in main units. Conversions happen in real time when displaying or editing.

### 6.2. Branch and Supplier Management

- **FR-4:** Administrator can create branches with unique identifiers and contact details.
- **FR-5:** Procurement Specialist can add suppliers with basic info (name, contact, typical lead time).

### 6.3. Purchase Request (PR)

- **FR-6:** Branch Manager can create a PR by selecting items, quantity in desired unit, and desired delivery date.
- **FR-7:** **PR Template:** Administrator or Procurement Specialist can define a set of common raw materials for each branch.
  - When using a PR template, the system pre-loads those items and their default quantities.
- **FR-8:** PR status changes: Draft → Submitted → Approved → Converted to PO.
- **FR-9:** AI Agent monitors stock levels and triggers alerts if any item falls below its safety stock threshold. AI suggests creating a PR with recommended quantities.

### 6.4. Purchase Order (PO)

- **FR-10:** Procurement Specialist can create a PO from an approved PR.
  - PO links to a specific supplier.
  - PO captures item, quantity, unit price, taxes, and expected delivery date.
- **FR-11:** PO status changes: Draft → Sent to Supplier → Confirmed → Closed.
- **FR-12:** Once PO is confirmed by the supplier, AI Agent will track expected delivery and send a reminder if delivery is overdue.

### 6.5. Request Form (RF)

- **FR-13:** Branch Manager can create an RF to request items from another branch.
- **FR-14:** **RF Template:** Administrator can define common items that branches often share. Using a template pre-loads those items.
- **FR-15:** RF status: Draft → Submitted → Approved → Ready for MR.

### 6.6. Material Requisition (MR)

- **FR-16:** Branch Manager or Inventory Clerk can convert an approved RF into an MR for transfer.
- **FR-17:** MR captures: source branch, destination branch, list of items, quantities, transfer date.
- **FR-18:** MR also supports "trim and waste" mode: user can mark a quantity of an item as trimmed or wasted.
- **FR-19:** When MR is approved:
  - If transfer, deduct stock from source branch immediately (in main units).
  - If trim or waste, deduct stock from that branch immediately.

### 6.7. Goods Received (GR)

- **FR-20:** Inventory Clerk receives items from a PO or MR.
- **FR-21:** GR entry includes: reference to PO or MR, actual quantities received, and date of receipt.
- **FR-22:** On GR completion:
  - **For PO:** add stock in main units to the receiving branch. Compute new moving average cost using formula:
    ```
    New Cost = (Old Stock × Old Cost + Received Qty × Received Price) / (Old Stock + Received Qty)
    ```
  - **For MR:** add stock in main units to the receiving branch. No cost update is needed for inter-branch transfers.

### 6.8. Formula Management

- **FR-23:** Production Planner can define a formula by listing raw materials and consumption rates.
  - Example: Product A uses 2 kg of flour, 1 liter of oil, and 5 units of sugar.
- **FR-24:** Each formula has a name, description, and version.

### 6.9. Manufacturing List (ML)

- **FR-25:** Production Planner can create an ML entry by selecting one or more formulas and specifying desired output quantity.
- **FR-26:** When ML enters "In Progress":
  - Deduct stock for all raw materials in main units based on formula and desired quantity.
- **FR-27:** When ML is marked "Complete":
  - Add stock of the finished product in main units.
  - Record timestamp and user performing completion.
- **FR-28:** If stock is insufficient for any raw material at ML creation time, system warns user and blocks ML creation until stock is available.

### 6.10. AI Agent and MCP Integration

- **FR-29:** AI Agent connects to the database and relevant modules via MCP servers.
- **FR-30:** MCP endpoints expose:
  - Current stock levels per branch
  - Pending POs and expected dates
  - Consumption rates (based on historical ML and GR data)
  - User-defined safety stock thresholds
- **FR-31:** AI Agent functions:
  - **Stock Monitoring:** Every 24 hours, AI scans stock levels for each branch. If an item's stock dips below its threshold, AI creates a suggested PR draft with recommended quantity.
  - **Demand Forecasting (Simple):** Based on last 30 days of consumption, AI estimates next 7-day usage and suggests reorder point.
  - **Inter-branch Transfer Suggestion:** If one branch has excess stock (above a high-water mark) and another is below a low-water mark for the same item, AI suggests an RF.
  - **Cost Discrepancy Alert:** When GR arrives and actual unit price differs by more than 10% from average cost, AI flags the purchase for review.
- **FR-32:** AI suggestions appear in a dedicated dashboard: user can review, modify, and approve or reject.
- **FR-33:** AI logs its recommendations and user actions in a simple audit table for feedback loops.

## 7. User Stories

### PR Creation

**As a Branch Manager,** I want to use a template to quickly generate a purchase request for common raw materials so that I spend less time typing item details.

### PO Approval

**As a Procurement Specialist,** I want to convert an approved PR into a PO with a single click, selecting from available suppliers so that I can speed up order placement.

### RF and MR Flow

**As a Branch Manager,** I want to move surplus inventory from Branch A to Branch B by creating an RF. Then I want an Inventory Clerk at Branch A to generate an MR and ship the items.

### GR and Cost Update

**As an Inventory Clerk,** I want to receive goods against a PO, enter actual quantities and prices, and automatically update the moving average cost so that stock valuation stays accurate.

### Formula-Based Production

**As a Production Planner,** I want to define a formula for Product X using raw materials. Then I want to create a manufacturing list to produce 100 units of Product X and see raw materials get deducted.

### AI-Based Alerts

**As a Branch Manager,** I want the system to notify me when my stock of Item Y will run out in the next three days based on recent usage so I can place a PR ahead of time.

### AI Transfer Suggestion

**As a Branch Manager,** I want the system to suggest transferring excess stock from Branch C to my branch if I am running low on that item so I can avoid emergency purchases.

## 8. Technical Architecture

### 8.1. High-Level Components

#### Frontend (Web App)

- Built with React (or Next.js) and a UI library that offers forms, tables, and modals
- Communicates with backend over REST endpoints

#### Backend API

- Node.js (Express or Nest.js) serving JSON APIs
- Implements business logic for PR, PO, RF, MR, GR, formulas, ML, and AI calls

#### Database

PostgreSQL (or MongoDB) storing:

- Item definitions and unit conversions
- Branch and supplier records
- PR, PO, RF, MR, GR, Formula, ML tables
- AI suggestion logs and thresholds

#### AI Layer (AI Agent)

Hosted as a separate service that:

- Periodically queries data via MCP API
- Runs simple rule based and statistical logic for forecasting
- Writes back suggestion drafts via MCP API

#### MCP Middleware

- A set of small HTTP servers (one per module or grouped) that expose endpoints the AI agent can call
- Each MCP server handles authentication and maps requests to database queries or business logic calls

### 8.2. Data Flow

#### User Actions

User logs in → frontend fetches branch-specific data → user creates PR/PO/RF/MR/GR/ML → frontend sends payload to backend → backend updates database → frontend displays success or error.

#### AI Actions via MCP

At scheduled intervals, AI agent requests stock data from MCP endpoint → MCP server queries database and returns JSON → AI runs checks and generates suggestion JSON → AI sends suggestion to MCP endpoint → MCP server writes suggestion to "AI Suggestions" table.

#### Suggestion Review

User sees suggestion on dashboard → user accepts or rejects → frontend sends decision to backend → backend updates "AI Suggestions" status and, if accepted, creates a draft PR or RF record.

### 8.3. Security and Permissions

#### Authentication

- JWT authentication for API endpoints
- Role based access control: only Procurement Specialist can approve PR to PO; only Inventory Clerk can mark GR complete; only Production Planner can create formulas and ML.

#### Data Validation

- Backend validates all numerical fields (quantities, prices) to be positive numbers
- Ensure unit conversion logic is consistent (no fractional rounding errors)

#### MCP Access

- AI agent uses a separate API key to connect to MCP endpoints.
- MCP servers verify the API key and allow only read/write to specific tables (stock levels, suggestion logs, thresholds).

## 9. Non-Functional Requirements

### Performance

- Backend must handle at least 50 concurrent users without noticeable lag
- API response time for stock queries must be under 500ms under normal load

### Scalability

- Design database schema to accommodate thousands of items and dozens of branches
- MCP servers should be stateless so they can scale horizontally if needed

### Reliability

- System uptime target: 99.5% during business hours
- Automated database backup once every 24 hours

### Security

- All network traffic must use HTTPS
- Sensitive data (passwords, API keys) must be encrypted at rest
- Implement basic audit logging for key actions (PR approval, GR completion, ML creation)

### Usability

- Forms must have clear labels and minimal required fields to complete tasks
- Error messages must be specific (e.g. "Quantity exceeds stock level for Item X")

### Maintainability

- Code organized into modules for each feature (e.g. prController, mrController)
- Clear folder structure and naming conventions
- Unit tests for critical business logic (stock update, cost calculation, unit conversion)

## 10. User Interface Mockups (High-Level)

### Dashboard

- Summary of low stock items
- Pending POs and RFs
- AI suggestions list with "Review," "Accept," "Reject" buttons

### PR Page

- Dropdown to select branch (if user has multiple)
- Table with rows for item, unit dropdown, quantity input, add/remove row button
- "Use Template" button that loads predefined items

### PO Page

- Select from approved PRs
- Dropdown for suppliers (auto filters based on items requested)
- Fields for unit price, taxes, expected delivery, notes

### RF Page

- Similar to PR but with branch-to-branch selection
- Template button for common inter-branch items

### MR Page

- List of approved RFs
- For each approved RF, button to "Create MR"
- In MR form: select transfer or trim/waste, list items, enter quantity, confirm

### GR Page

- Choose from pending POs and pending MRs
- Enter actual received quantities
- Display current average cost and calculate new cost automatically

### Formula Management

- Form to add new formula name, description
- Dynamic table to list raw materials and consumption per unit of output
- Save and version control indicator

### ML Page

- Dropdown to pick one or more formulas
- Field for desired output quantity
- "Create ML" button that checks stock and either allows creation or shows missing items

### AI Suggestions Page

- Table of suggestions grouped by suggestion type (PR recommendation, RF recommendation, cost alert)
- For each row: branch, item, suggested quantity, reason, "Create PR" or "Ignore" button

## 11. Technical Details

### 11.1. Database Schema (Key Tables)

#### Items

- `item_id` (PK)
- `name`
- `sku`
- `main_unit`
- `conversion_buying` (float)
- `conversion_transferring` (float)
- `conversion_using` (float)
- `current_avg_cost` (decimal)

#### Branches

- `branch_id` (PK)
- `name`
- `location`

#### Suppliers

- `supplier_id` (PK)
- `name`
- `contact_info`
- `lead_time_days`

#### PurchaseRequests (PRs)

- `pr_id` (PK)
- `branch_id` (FK)
- `created_by` (user_id)
- `status` (enum: Draft, Submitted, Approved, Converted)
- `created_at`, `updated_at`

#### PurchaseRequestItems

- `pr_item_id` (PK)
- `pr_id` (FK)
- `item_id` (FK)
- `unit` (varchar)
- `quantity` (decimal)

#### PurchaseOrders (POs)

- `po_id` (PK)
- `pr_id` (FK)
- `supplier_id` (FK)
- `status` (enum: Draft, Sent, Confirmed, Closed)
- `expected_delivery_date` (date)
- `created_by`, `created_at`, `updated_at`

#### PurchaseOrderItems

- `po_item_id` (PK)
- `po_id` (FK)
- `item_id` (FK)
- `unit_price` (decimal)
- `quantity` (decimal)

#### RequestForms (RFs)

- `rf_id` (PK)
- `from_branch_id` (FK)
- `to_branch_id` (FK)
- `status` (enum: Draft, Submitted, Approved, Ready)
- `created_by`, `created_at`, `updated_at`

#### RequestFormItems

- `rf_item_id` (PK)
- `rf_id` (FK)
- `item_id` (FK)
- `unit` (varchar)
- `quantity` (decimal)

#### MaterialRequisitions (MRs)

- `mr_id` (PK)
- `rf_id` (FK)
- `type` (enum: Transfer, TrimWaste)
- `status` (enum: Draft, Submitted, Completed)
- `created_by`, `created_at`, `completed_at`

#### MaterialRequisitionItems

- `mr_item_id` (PK)
- `mr_id` (FK)
- `item_id` (FK)
- `quantity` (decimal)

#### GoodsReceived (GRs)

- `gr_id` (PK)
- `source_type` (enum: PO, MR)
- `source_id` (FK)
- `received_by` (user_id)
- `created_at`

#### GoodsReceivedItems

- `grid` (PK)
- `gr_id` (FK)
- `item_id` (FK)
- `quantity` (decimal)
- `unit_price` (decimal, only for PO receipts)

#### Formulas

- `formula_id` (PK)
- `name`
- `description`
- `version` (int)
- `created_by`, `created_at`

#### FormulaItems

- `formula_item_id` (PK)
- `formula_id` (FK)
- `item_id` (FK)
- `quantity_per_unit` (decimal)

#### Manufacturing Lists (MLs)

- `ml_id` (PK)
- `created_by` (user_id)
- `status` (enum: InProgress, Complete)
- `created_at`, `completed_at`

#### ManufacturingListItems

- `mli_id` (PK)
- `ml_id` (FK)
- `formula_id` (FK)
- `quantity_output` (decimal)

#### AISuggestions

- `suggestion_id` (PK)
- `branch_id` (FK)
- `item_id` (FK)
- `suggestion_type` (enum: PR, RF, CostAlert)
- `quantity` (decimal)
- `reason` (varchar)
- `status` (enum: Pending, Accepted, Rejected)
- `created_at`, `updated_at`

### 11.2. MCP Endpoints (Example)

#### GET /mcp/stock-levels?branch_id={branch_id}

Returns JSON of all items and current stock in main units for a given branch.

#### POST /mcp/create-pr

Payload: `{ branch_id, item_list: [{ item_id, quantity }], created_by }`
Creates a draft PR and returns pr_id.

#### GET /mcp/consumption-history?branch_id={branch_id}&days=30

Returns JSON of historical usage per item over past 30 days.

#### POST /mcp/create-rf

Payload: `{ from_branch_id, to_branch_id, item_list }`
Creates a draft RF.

#### POST /mcp/log-suggestion

Payload: `{ branch_id, item_id, suggestion_type, quantity, reason }`
Saves AI suggestion.

#### GET /mcp/po-status?po_id={po_id}

Returns current status and expected delivery date.

## 12. Non-Functional Technical Details

### Tech Stack for Backend

- Node.js with Express (or Nest.js)
- ORM/ODM: Prisma or TypeORM (if using PostgreSQL) or Mongoose (if using MongoDB)
- Authentication: JSON Web Token (JWT)

### Tech Stack for Frontend

- React (or Next.js)
- UI library such as Mantine or Material UI (choose one with minimal styling overhead)

### AI Agent

Node.js script or Python microservice that:

- Runs on a schedule (e.g. via cron or hosted service scheduler)
- Uses simple statistical logic for forecasting (average daily usage)
- Calls MCP endpoints over HTTP with an API key

### Infrastructure

- Host backend and MCP servers on a cloud provider (AWS, GCP, or Azure)
- PostgreSQL managed database instance
- Separate environment variables for database credentials, JWT secret, MCP API key

### Logging and Monitoring

- Basic logging to stdout for backend and MCP servers
- Monitor key metrics: API error rates, database connections, AI agent success/failure
- Simple alerting if AI agent fails to run or if MCP server returns errors

## 13. Acceptance Criteria

- **AC-1:** A user can create, submit, and approve a PR, then convert it to a PO and mark it as confirmed.
- **AC-2:** An Inventory Clerk can receive goods via GR, and stock levels are updated correctly with moving average cost recalculated.
- **AC-3:** Branch Manager can request items from another branch using RF; Inventory Clerk can transfer items via MR and stock is deducted/added appropriately.
- **AC-4:** Production Planner can define a formula and then create an ML for a product; raw material stock is deducted and finished product stock is added when ML is completed.
- **AC-5:** AI Agent runs at least once a day and logs suggestions in AISuggestions; suggestions appear on the dashboard for review.
- **AC-6:** MCP endpoints return correct stock and consumption data and allow creation of PR or RF drafts when called by AI.
- **AC-7:** Users see clear error messages if they attempt to create MR or ML with insufficient stock.

## 14. Success Metrics

### User Engagement

At least 5 pilot users create a PR or RF within first week of MVP launch.

### AI Accuracy

70% of AI-generated PR suggestions are viewed, modified, and approved by users.

### Inventory Data Integrity

No discrepancies greater than 2% between recorded stock and physical stock during first month of use.

### Feedback Collection

Collect at least 10 feedback items from pilot users on AI suggestions and UI usability.

## 15. Timeline and Milestones

### Week 1–2: Core Data Models and CRUD APIs

- Build database schema for items, branches, suppliers, PR, PO, RF, MR, GR, formulas, ML
- Implement basic REST endpoints for each model (create, read, update, delete)

### Week 3: Frontend Forms and Tables

- Build UI for PR, PO, RF, MR, GR, formula, ML
- Connect frontend to backend endpoints

### Week 4: Unit Conversion and Cost Calculation Logic

- Implement unit conversion functions in backend
- Add moving average cost calculation on GR

### Week 5: AI Agent and MCP Servers

- Set up MCP microservices for stock and consumption data
- Develop AI agent that queries MCP and logs suggestions

### Week 6: AI Dashboard and Suggestion Workflow

- Build UI for AI suggestions list
- Implement accept/reject actions that convert suggestions into drafts (PR or RF)

### Week 7: Testing and Refinement

- Perform end-to-end testing of workflows (PR → PO → GR, RF → MR → GR, formula → ML)
- Collect early feedback and fix critical bugs

### Week 8: Pilot Deployment

- Deploy MVP to a small group of pilot branches or internal testers
- Provide training materials and gather feedback

### Week 9–10: Iterate Based on Feedback

- Refine AI logic thresholds, improve UI flow
- Address any performance or security issues that emerge

## 16. Risks and Mitigations

### Risk: Inaccurate unit conversions lead to stock discrepancies.

**Mitigation:** Write thorough unit tests for conversion logic and show conversion result to user before finalizing PR, MR, and ML forms.

### Risk: AI suggestions are irrelevant or too often false positives.

**Mitigation:** Start with simple threshold-based logic and allow users to adjust safety stock levels per item. Log user actions to refine rules quickly.

### Risk: MCP integration adds latency to AI queries.

**Mitigation:** Cache recent stock data in AI agent for short periods (e.g., 1 hour) and only call MCP for items near thresholds.

### Risk: Users find UI confusing for multi-unit items.

**Mitigation:** In the first iteration, show all quantity fields in main units only, with an info icon explaining how conversion works. Add more unit choices in later versions.

## 17. Glossary

- **Main Unit:** The base unit in which stock is stored (e.g. kilograms for flour).
- **Buying Unit:** The smallest increment in which an item is purchased (e.g. grams).
- **Transferring Unit:** The unit used when moving items between branches (e.g. half-kilograms).
- **Using Unit:** The unit used when consuming items in formulas (e.g. grams or ounces).
- **Moving Average Cost:** A method of recalculating the average cost of stock on hand after each receipt of goods.
- **MCP (Model Context Protocol):** A standard layer that lets AI agents access and update data in other systems without custom integration code.

---

This PRD provides a detailed blueprint for the development of your MVP. It specifies the core features, user roles, workflows, AI integration, technical architecture, timelines, and success metrics. Sharing this with your team will align everyone on scope and priorities, allowing a focused effort on building a working prototype that demonstrates AI-driven supply chain automation for manufacturing industries.
