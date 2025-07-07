# Product Requirements Document (PRD) for AI-Based SupplySense Management SaaS MVP

## 1. Introduction

This document outlines the requirements for a Minimum Viable Product (MVP) of an AI-driven supply chain management SaaS solution for manufacturing industries. The goal is to provide a working multi-tenant prototype that demonstrates key features and allows companies to register, manage multiple branches, and test core functionality. The MVP will focus on company registration, role-based access control, purchase requests, purchase orders, inter-branch transfers, stock handling, and production planning. It will integrate AI agents via a Model Context Protocol (MCP) layer to automate routine tasks and surface recommendations.

## 2. Product Vision

Create a multi-tenant SaaS system that helps manufacturing companies manage raw materials, inventory transfers, and production planning with AI assistance. The MVP will:

- Enable company registration and self-service onboarding
- Provide multi-tenant architecture with complete data isolation
- Automate data gathering and simple decision making within each company
- Give visibility into stock levels and expected needs across company branches
- Let branches request items from each other and from suppliers
- Support a basic production workflow using predefined formulas
- Show how AI agents can suggest when to reorder or transfer stock
- Implement Discord-like role and permission management system

This MVP is not a full-scale enterprise solution. It is a working SaaS prototype that proves the concept and lets multiple companies provide feedback before building out more advanced features.

## 3. Goals and Objectives

### Multi-Tenant SaaS Architecture

- Enable company self-registration with automatic tenant creation
- Provide complete data isolation between companies
- Support unlimited companies with unlimited branches per company
- Implement scalable role and permission management

### Company Onboarding and Management

- Self-service company registration with automatic super-admin creation
- Automatic HQ branch creation for new companies
- Super-admin dashboard for complete company management

### Advanced Role and Permission System

- Discord-like role creation and management
- Granular module-level permissions per role
- Branch-specific user assignments with shared permissions
- Dynamic role creation during user assignment

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

## 4. User Roles and Access Control

### Company Registration Role

**Anonymous User**
- Can register a new company with basic information
- Automatically becomes Super Admin upon successful registration

### Super Administrator (Company Owner)

- **Complete company control**: Manages all aspects of the company
- **User management**: Creates, edits, and deactivates users
- **Role management**: Creates custom roles and assigns permissions
- **Branch management**: Creates, edits, and manages all company branches
- **System configuration**: Configures company-wide settings (units, currency, policies)
- **Access control**: Can access and modify everything within their company
- **AI oversight**: Reviews and configures AI agent settings and thresholds

### Custom Roles (Discord-like System)

**Role Creation Process:**
1. Super Admin creates role with a name and description
2. Assigns module-level permissions to the role
3. Assigns users to the role
4. Assigns role-holders to specific branches

**Standard Role Templates (Can be customized):**

**Branch Manager**
- Creates and approves PRs, RFs, and MRs for assigned branches
- Reviews AI recommendations for reordering or transfers
- Manages branch-specific operations and staff
- Can view branch performance metrics

**Inventory Clerk**
- Executes receipt of goods (GR) and updates physical stock counts
- Prepares items for transfer (MR) and marks items as trimmed or wasted
- Performs stock adjustments and cycle counts
- Limited to operational tasks within assigned branches

**Procurement Specialist**
- Generates POs based on approved PRs
- Communicates with suppliers and confirms delivery details
- Manages supplier relationships and pricing
- Can work across multiple branches if assigned

**Production Planner**
- Defines formulas for recipes and manufacturing processes
- Creates ML entries to assemble finished products
- Plans production schedules and capacity
- Manages production workflows

**Finance/Accounting**
- Reviews costs and pricing
- Approves budget-related requests
- Monitors financial metrics and reports
- Read-only access to most operational data

### Permission Granularity

**Module-Level Permissions:**
- **Purchase Requests**: Create, View, Edit, Approve, Delete
- **Purchase Orders**: Create, View, Edit, Send to Supplier, Confirm, Cancel
- **Request Forms**: Create, View, Edit, Approve, Transfer
- **Material Requisitions**: Create, View, Edit, Execute, Complete
- **Goods Receipts**: Create, View, Edit, Post, Cancel
- **Inventory Management**: View Stock, Adjust Stock, Transfer Stock, Count Stock
- **Formula Management**: Create, View, Edit, Delete, Version Control
- **Manufacturing Lists**: Create, View, Edit, Start Production, Complete Production
- **Suppliers**: Create, View, Edit, Deactivate, Manage Contracts
- **AI Suggestions**: View, Accept, Reject, Configure Thresholds
- **Reports & Analytics**: View Branch Reports, View Company Reports, Export Data
- **User Management**: View Users, Create Users, Edit Users, Deactivate Users (Super Admin only)

### AI Agent (Automated Role)

- Monitors consumption rates and forecasts demand per company
- Suggests PRs, RFs, and MRs based on company-specific threshold rules
- Checks POs against receiving records to flag discrepancies
- Operates with company-level data isolation

## 5. Scope of MVP

### In Scope

- **Multi-tenant SaaS architecture** with complete data isolation between companies
- **Company registration system** with self-service onboarding
- **Super admin automatic creation** and HQ branch initialization
- **Advanced role and permission system** similar to Discord's approach
- **Dynamic role creation** during user assignment process
- **Module-level permission granularity** for fine-grained access control
- **Branch-based user assignments** with shared role permissions
- Core database models for companies, branches, users, roles, permissions, items, suppliers, PRs, POs, RFs, MRs, GRs, formulas, and ML records
- Simple web interface for company registration and management
- User management interface for Super Admins
- Role and permission management system
- Branch management and assignment functionality
- Templates for PR and RF that load common items automatically
- Stock management logic that uses a single "main unit" as base and performs unit conversions in code
- Moving average cost calculation on each receipt of goods
- AI agent connected via MCP for:
  - Notifying users when stock drops below threshold (per company)
  - Suggesting quantities for PRs or RFs (company-specific)
- Basic security and authentication with multi-tenant support
- Company-level data isolation and security

### Out of Scope

- Advanced forecasting models (e.g., neural networks for demand prediction)
- Supplier rate negotiation workflows
- Full audit trail with user activity logs beyond simple timestamps
- Complex approval chains (multi-level approvals)
- Mobile application (web only)
- Handling of multiple currencies or taxation rules (single currency per company)
- Integration with external ERP systems (beyond MVP)
- Advanced billing and subscription management
- White-label solutions
- Multi-language support
- Advanced reporting and analytics dashboards

## 6. Functional Requirements

### 6.0. Multi-Tenant Company Management

- **FR-0.1:** **Company Registration:** Anonymous users can register a company by providing:
  - Company name
  - Tax ID/Business registration number
  - Business address and location
  - Primary contact number
  - Primary email address
  - Initial password for Super Admin account
- **FR-0.2:** **Automatic Tenant Setup:** Upon successful registration:
  - Create isolated company tenant with unique identifier
  - Create Super Admin user with provided credentials
  - Create default "HQ" branch for the company
  - Initialize company-specific settings and configurations
- **FR-0.3:** **Data Isolation:** Ensure complete data isolation between companies:
  - All database queries filtered by company ID
  - No cross-company data leakage
  - Company-specific AI suggestions and monitoring

### 6.0.1. Advanced Role and Permission Management

- **FR-0.4:** **Role Creation:** Super Admin can create custom roles by:
  - Providing role name and description
  - Selecting module-level permissions from a comprehensive list
  - Setting role as active/inactive
- **FR-0.5:** **Dynamic Role Assignment:** During user creation, if a role doesn't exist:
  - Super Admin can create the role on-the-fly
  - Assign permissions immediately
  - Role becomes available for future user assignments
- **FR-0.6:** **Module-Level Permissions:** Each role can have granular permissions for:
  - Purchase Requests (Create, View, Edit, Approve, Delete)
  - Purchase Orders (Create, View, Edit, Send, Confirm, Cancel)
  - Request Forms (Create, View, Edit, Approve, Transfer)
  - Material Requisitions (Create, View, Edit, Execute, Complete)
  - Goods Receipts (Create, View, Edit, Post, Cancel)
  - Inventory Management (View, Adjust, Transfer, Count)
  - Formula Management (Create, View, Edit, Delete, Version)
  - Manufacturing Lists (Create, View, Edit, Start, Complete)
  - Suppliers (Create, View, Edit, Deactivate, Manage)
  - AI Suggestions (View, Accept, Reject, Configure)
  - Reports (View Branch, View Company, Export)
  - User Management (Super Admin only)
- **FR-0.7:** **Branch Assignment:** Super Admin can assign users to specific branches:
  - Users can be assigned to multiple branches
  - Role permissions apply consistently across all assigned branches
  - Branch-specific data access based on assignments

### 6.0.2. User Management

- **FR-0.8:** **User Creation:** Super Admin can create users by providing:
  - First name and last name
  - Contact information (phone, email)
  - Government ID number or employee ID
  - Login email and temporary password
  - Role assignment (existing or new role creation)
  - Branch assignments (multiple selection allowed)
- **FR-0.9:** **User Profile Management:** Super Admin can:
  - Edit user information and contact details
  - Change user role assignments
  - Modify branch assignments
  - Activate/deactivate user accounts
  - Reset user passwords
- **FR-0.10:** **Branch Management:** Super Admin can:
  - Create additional branches beyond HQ
  - Edit branch information and contact details
  - Assign managers to branches
  - Set branch-specific configurations

### 6.1. Item and Unit Definitions

- **FR-1:** Super Admin can define each item with a name, SKU, and main unit.
- **FR-2:** Super Admin can set conversion rates for "buying unit," "transferring unit," and "using unit."
  - Example: 1 main unit = 100 buying units = 50 transferring units = 0.01 using units.
- **FR-3:** System always stores stock quantities in main units. Conversions happen in real time when displaying or editing.

### 6.2. Branch and Supplier Management

- **FR-4:** Super Admin can create branches with unique identifiers and contact details.
- **FR-5:** Users with supplier management permissions can add suppliers with basic info (name, contact, typical lead time).

### 6.3. Purchase Request (PR)

- **FR-6:** Users with PR creation permissions can create a PR by selecting items, quantity in desired unit, and desired delivery date.
- **FR-7:** **PR Template:** Super Admin or users with template management permissions can define a set of common raw materials for each branch.
  - When using a PR template, the system pre-loads those items and their default quantities.
- **FR-8:** PR status changes: Draft → Submitted → Approved → Converted to PO.
- **FR-9:** AI Agent monitors stock levels and triggers alerts if any item falls below its safety stock threshold. AI suggests creating a PR with recommended quantities (company-specific).

### 6.4. Purchase Order (PO)

- **FR-10:** Users with PO creation permissions can create a PO from an approved PR.
  - PO links to a specific supplier.
  - PO captures item, quantity, unit price, taxes, and expected delivery date.
- **FR-11:** PO status changes: Draft → Sent to Supplier → Confirmed → Closed.
- **FR-12:** Once PO is confirmed by the supplier, AI Agent will track expected delivery and send a reminder if delivery is overdue (company-specific).

### 6.5. Request Form (RF)

- **FR-13:** Users with RF creation permissions can create an RF to request items from another branch within the same company.
- **FR-14:** **RF Template:** Super Admin can define common items that branches often share. Using a template pre-loads those items.
- **FR-15:** RF status: Draft → Submitted → Approved → Ready for MR.

### 6.6. Material Requisition (MR)

- **FR-16:** Users with MR management permissions can convert an approved RF into an MR for transfer.
- **FR-17:** MR captures: source branch, destination branch, list of items, quantities, transfer date.
- **FR-18:** MR also supports "trim and waste" mode: user can mark a quantity of an item as trimmed or wasted.
- **FR-19:** When MR is approved:
  - If transfer, deduct stock from source branch immediately (in main units).
  - If trim or waste, deduct stock from that branch immediately.

### 6.7. Goods Received (GR)

- **FR-20:** Users with GR permissions can receive items from a PO or MR.
- **FR-21:** GR entry includes: reference to PO or MR, actual quantities received, and date of receipt.
- **FR-22:** On GR completion:
  - **For PO:** add stock in main units to the receiving branch. Compute new moving average cost using formula:
    ```
    New Cost = (Old Stock × Old Cost + Received Qty × Received Price) / (Old Stock + Received Qty)
    ```
  - **For MR:** add stock in main units to the receiving branch. No cost update is needed for inter-branch transfers.

### 6.8. Formula Management

- **FR-23:** Users with formula management permissions can define a formula by listing raw materials and consumption rates.
  - Example: Product A uses 2 kg of flour, 1 liter of oil, and 5 units of sugar.
- **FR-24:** Each formula has a name, description, and version.

### 6.9. Manufacturing List (ML)

- **FR-25:** Users with ML permissions can create an ML entry by selecting one or more formulas and specifying desired output quantity.
- **FR-26:** When ML enters "In Progress":
  - Deduct stock for all raw materials in main units based on formula and desired quantity.
- **FR-27:** When ML is marked "Complete":
  - Add stock of the finished product in main units.
  - Record timestamp and user performing completion.
- **FR-28:** If stock is insufficient for any raw material at ML creation time, system warns user and blocks ML creation until stock is available.

### 6.10. AI Agent and MCP Integration

- **FR-29:** AI Agent connects to the database and relevant modules via MCP servers with company-level data isolation.
- **FR-30:** MCP endpoints expose (company-filtered):
  - Current stock levels per branch per company
  - Pending POs and expected dates per company
  - Consumption rates (based on historical ML and GR data) per company
  - Company-specific safety stock thresholds
- **FR-31:** AI Agent functions (company-isolated):
  - **Stock Monitoring:** Every 24 hours, AI scans stock levels for each branch within each company. If an item's stock dips below its threshold, AI creates a suggested PR draft with recommended quantity.
  - **Demand Forecasting (Simple):** Based on last 30 days of consumption within the company, AI estimates next 7-day usage and suggests reorder point.
  - **Inter-branch Transfer Suggestion:** If one branch has excess stock (above a high-water mark) and another is below a low-water mark for the same item within the same company, AI suggests an RF.
  - **Cost Discrepancy Alert:** When GR arrives and actual unit price differs by more than 10% from average cost, AI flags the purchase for review within the company context.
- **FR-32:** AI suggestions appear in a dedicated dashboard: users can review, modify, and approve or reject (company-specific suggestions only).
- **FR-33:** AI logs its recommendations and user actions in a simple audit table for feedback loops (company-isolated data).

## 7. User Stories

### Company Registration and Setup

**As a Manufacturing Company Owner,** I want to register my company with basic information so that I can start using the supply chain management system.

**As a newly registered Company Owner,** I want to automatically become a Super Admin with full access so that I can set up my company's operations immediately.

**As a Super Admin,** I want an HQ branch to be automatically created during registration so that I have a starting point for my company's operations.

### User and Role Management

**As a Super Admin,** I want to create custom roles with specific permissions so that I can control what my employees can access and do in the system.

**As a Super Admin,** I want to create new roles on-the-fly during user creation so that I don't have to pre-define every possible role combination.

**As a Super Admin,** I want to assign users to multiple branches with consistent role permissions so that employees can work across different locations with the same access rights.

**As a Super Admin,** I want to create users by providing their personal information, role, and branch assignments so that I can efficiently onboard new employees.

### Branch Management

**As a Super Admin,** I want to create additional branches beyond the HQ so that I can expand my company's operations to multiple locations.

**As a Super Admin,** I want to assign managers to specific branches so that there's clear ownership and responsibility for each location.

### PR Creation

**As a user with PR permissions,** I want to use a template to quickly generate a purchase request for common raw materials so that I spend less time typing item details.

### PO Approval

**As a user with PO permissions,** I want to convert an approved PR into a PO with a single click, selecting from available suppliers so that I can speed up order placement.

### RF and MR Flow

**As a user with RF permissions,** I want to move surplus inventory from Branch A to Branch B by creating an RF. Then I want a user with MR permissions at Branch A to generate an MR and ship the items.

### GR and Cost Update

**As a user with GR permissions,** I want to receive goods against a PO, enter actual quantities and prices, and automatically update the moving average cost so that stock valuation stays accurate.

### Formula-Based Production

**As a user with formula permissions,** I want to define a formula for Product X using raw materials. Then I want to create a manufacturing list to produce 100 units of Product X and see raw materials get deducted.

### AI-Based Alerts

**As a user with AI suggestion permissions,** I want the system to notify me when my stock of Item Y will run out in the next three days based on recent usage so I can place a PR ahead of time.

### AI Transfer Suggestion

**As a user with AI suggestion permissions,** I want the system to suggest transferring excess stock from Branch C to my branch if I am running low on that item so I can avoid emergency purchases.

### Data Isolation

**As a Company Owner,** I want to ensure that my company's data is completely isolated from other companies using the same system so that my business information remains confidential and secure.

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

#### Companies (Multi-tenant)

- `company_id` (PK)
- `company_name`
- `tax_id`
- `business_address`
- `primary_contact_number`
- `primary_email`
- `is_active`
- `subscription_status`
- `created_at`, `updated_at`

#### Users (Enhanced)

- `user_id` (PK)
- `company_id` (FK)
- `email` (unique)
- `username`
- `first_name`
- `last_name`
- `contact_number`
- `government_id_number`
- `password_hash`
- `is_super_admin`
- `is_active`
- `created_at`, `updated_at`, `last_login`

#### Roles (Custom Role System)

- `role_id` (PK)
- `company_id` (FK)
- `role_name`
- `role_description`
- `is_active`
- `created_by` (user_id)
- `created_at`, `updated_at`

#### Permissions (Module-level)

- `permission_id` (PK)
- `module_name` (e.g., "purchase_requests", "inventory")
- `action_name` (e.g., "create", "view", "edit", "approve")
- `permission_description`

#### RolePermissions (Many-to-many)

- `role_permission_id` (PK)
- `role_id` (FK)
- `permission_id` (FK)
- `granted` (boolean)

#### UserRoles (User-Role Assignment)

- `user_role_id` (PK)
- `user_id` (FK)
- `role_id` (FK)
- `assigned_by` (user_id)
- `assigned_at`

#### UserBranches (Branch Assignment)

- `user_branch_id` (PK)
- `user_id` (FK)
- `branch_id` (FK)
- `assigned_by` (user_id)
- `assigned_at`

#### Branches (Enhanced)

- `branch_id` (PK)
- `company_id` (FK)
- `branch_name`
- `branch_code`
- `location`
- `contact_info`
- `is_hq` (boolean, for HQ identification)
- `is_active`
- `created_at`, `updated_at`

#### Items (Company-scoped)

- `item_id` (PK)
- `company_id` (FK)
- `name`
- `sku`
- `main_unit`
- `conversion_buying` (float)
- `conversion_transferring` (float)
- `conversion_using` (float)
- `current_avg_cost` (decimal)

#### Suppliers (Company-scoped)

- `supplier_id` (PK)
- `company_id` (FK)
- `name`
- `contact_info`
- `lead_time_days`

#### PurchaseRequests (PRs) (Enhanced)

- `pr_id` (PK)
- `company_id` (FK)
- `branch_id` (FK)
- `created_by` (user_id)
- `status` (enum: Draft, Submitted, Approved, Converted)
- `created_at`, `updated_at`

#### PurchaseRequestItems (Enhanced)

- `pr_item_id` (PK)
- `pr_id` (FK)
- `item_id` (FK)
- `unit` (varchar)
- `quantity` (decimal)

#### PurchaseOrders (POs) (Enhanced)

- `po_id` (PK)
- `company_id` (FK)
- `pr_id` (FK)
- `supplier_id` (FK)
- `status` (enum: Draft, Sent, Confirmed, Closed)
- `expected_delivery_date` (date)
- `created_by`, `created_at`, `updated_at`

#### PurchaseOrderItems (Enhanced)

- `po_item_id` (PK)
- `po_id` (FK)
- `item_id` (FK)
- `unit_price` (decimal)
- `quantity` (decimal)

#### RequestForms (RFs) (Enhanced)

- `rf_id` (PK)
- `company_id` (FK)
- `from_branch_id` (FK)
- `to_branch_id` (FK)
- `status` (enum: Draft, Submitted, Approved, Ready)
- `created_by`, `created_at`, `updated_at`

#### RequestFormItems (Enhanced)

- `rf_item_id` (PK)
- `rf_id` (FK)
- `item_id` (FK)
- `unit` (varchar)
- `quantity` (decimal)

#### MaterialRequisitions (MRs) (Enhanced)

- `mr_id` (PK)
- `company_id` (FK)
- `rf_id` (FK)
- `type` (enum: Transfer, TrimWaste)
- `status` (enum: Draft, Submitted, Completed)
- `created_by`, `created_at`, `completed_at`

#### MaterialRequisitionItems (Enhanced)

- `mr_item_id` (PK)
- `mr_id` (FK)
- `item_id` (FK)
- `quantity` (decimal)

#### GoodsReceived (GRs) (Enhanced)

- `gr_id` (PK)
- `company_id` (FK)
- `source_type` (enum: PO, MR)
- `source_id` (FK)
- `received_by` (user_id)
- `created_at`

#### GoodsReceivedItems (Enhanced)

- `grid` (PK)
- `gr_id` (FK)
- `item_id` (FK)
- `quantity` (decimal)
- `unit_price` (decimal, only for PO receipts)

#### Formulas (Enhanced)

- `formula_id` (PK)
- `company_id` (FK)
- `name`
- `description`
- `version` (int)
- `created_by`, `created_at`

#### FormulaItems (Enhanced)

- `formula_item_id` (PK)
- `formula_id` (FK)
- `item_id` (FK)
- `quantity_per_unit` (decimal)

#### Manufacturing Lists (MLs) (Enhanced)

- `ml_id` (PK)
- `company_id` (FK)
- `created_by` (user_id)
- `status` (enum: InProgress, Complete)
- `created_at`, `completed_at`

#### ManufacturingListItems (Enhanced)

- `mli_id` (PK)
- `ml_id` (FK)
- `formula_id` (FK)
- `quantity_output` (decimal)

#### AISuggestions (Enhanced)

- `suggestion_id` (PK)
- `company_id` (FK)
- `branch_id` (FK)
- `item_id` (FK)
- `suggestion_type` (enum: PR, RF, CostAlert)
- `quantity` (decimal)
- `reason` (varchar)
- `status` (enum: Pending, Accepted, Rejected)
- `created_at`, `updated_at`

### 11.2. MCP Endpoints (Enhanced for Multi-tenant)

#### Company Management Endpoints

##### POST /mcp/register-company

Payload: `{ company_name, tax_id, business_address, primary_contact_number, primary_email, admin_password }`
Creates new company tenant, super admin user, and HQ branch. Returns company_id and admin_user_id.

##### GET /mcp/company-info?company_id={company_id}

Returns basic company information and statistics.

#### User and Role Management Endpoints

##### POST /mcp/create-role

Payload: `{ company_id, role_name, role_description, permissions: [{ module, action, granted }] }`
Creates new role with specified permissions.

##### POST /mcp/create-user

Payload: `{ company_id, user_info: { first_name, last_name, email, phone, gov_id }, role_id, branch_ids: [], created_by }`
Creates new user with role and branch assignments.

##### GET /mcp/company-users?company_id={company_id}

Returns all users within the company with their roles and branch assignments.

##### GET /mcp/company-roles?company_id={company_id}

Returns all custom roles defined within the company.

#### Stock and Inventory Endpoints (Company-filtered)

##### GET /mcp/stock-levels?company_id={company_id}&branch_id={branch_id}

Returns JSON of all items and current stock in main units for a given branch within the specified company.

##### POST /mcp/create-pr

Payload: `{ company_id, branch_id, item_list: [{ item_id, quantity }], created_by }`
Creates a draft PR and returns pr_id (company-scoped).

##### GET /mcp/consumption-history?company_id={company_id}&branch_id={branch_id}&days=30

Returns JSON of historical usage per item over past 30 days for the specified company and branch.

##### POST /mcp/create-rf

Payload: `{ company_id, from_branch_id, to_branch_id, item_list }`
Creates a draft RF within the same company.

##### POST /mcp/log-suggestion

Payload: `{ company_id, branch_id, item_id, suggestion_type, quantity, reason }`
Saves AI suggestion (company-isolated).

##### GET /mcp/po-status?company_id={company_id}&po_id={po_id}

Returns current status and expected delivery date for company-specific PO.

#### Permission Verification Endpoints

##### GET /mcp/verify-permissions?user_id={user_id}&module={module}&action={action}

Returns boolean indicating if user has permission for specific module action.

##### GET /mcp/user-branches?user_id={user_id}

Returns list of branches the user is assigned to.

#### AI Agent Endpoints (Company-isolated)

##### GET /mcp/company-ai-config?company_id={company_id}

Returns company-specific AI configuration and thresholds.

##### POST /mcp/ai-suggestions

Payload: `{ company_id, suggestions: [{ branch_id, item_id, type, quantity, reasoning }] }`
Bulk creation of AI suggestions for a specific company.

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

- **AC-0:** A company can register successfully and automatically receive a Super Admin account with an HQ branch.
- **AC-0.1:** Super Admin can create custom roles with module-level permissions and assign users to those roles.
- **AC-0.2:** Super Admin can create users with personal information, role assignment, and branch assignments.
- **AC-0.3:** Users can only access data within their company (complete data isolation).
- **AC-0.4:** Users can only perform actions allowed by their assigned role permissions.
- **AC-0.5:** Users can work across multiple assigned branches with consistent role permissions.
- **AC-1:** A user can create, submit, and approve a PR, then convert it to a PO and mark it as confirmed (within their company and assigned branches).
- **AC-2:** A user with GR permissions can receive goods via GR, and stock levels are updated correctly with moving average cost recalculated (company-specific).
- **AC-3:** A user with RF permissions can request items from another branch using RF; a user with MR permissions can transfer items via MR and stock is deducted/added appropriately (within same company only).
- **AC-4:** A user with formula and ML permissions can define a formula and then create an ML for a product; raw material stock is deducted and finished product stock is added when ML is completed (company-specific).
- **AC-5:** AI Agent runs at least once a day and logs company-specific suggestions in AISuggestions; suggestions appear on the dashboard for review (company-isolated).
- **AC-6:** MCP endpoints return correct company-filtered stock and consumption data and allow creation of PR or RF drafts when called by AI (with proper company isolation).
- **AC-7:** Users see clear error messages if they attempt to create MR or ML with insufficient stock (company-specific validation).
- **AC-8:** Super Admin can create new roles on-the-fly during user creation process.
- **AC-9:** All database operations maintain proper company-level data isolation without cross-company data leakage.

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

### Week 1–2: Multi-Tenant Foundation and Core Data Models

- Design and implement multi-tenant database architecture with company isolation
- Build company registration system and automatic tenant setup
- Create enhanced user, role, and permission management system
- Implement core data models for companies, branches, users, roles, permissions
- Set up basic CRUD APIs with company-level data filtering

### Week 3: Advanced User and Role Management

- Build Super Admin dashboard for company management
- Implement role creation and permission assignment interface
- Create user management interface with branch assignments
- Develop dynamic role creation during user assignment
- Build permission verification system

### Week 4: Core Business Module APIs

- Implement business logic APIs for PR, PO, RF, MR, GR, formulas, ML with company isolation
- Add company-level data filtering to all business operations
- Implement unit conversion and cost calculation logic
- Create template management with company scoping

### Week 5: Frontend Multi-Tenant Interface

- Build company registration and onboarding flow
- Create Super Admin dashboard and management interfaces
- Develop role and permission management UI
- Build user management interface with branch assignments
- Implement company-aware navigation and data display

### Week 6: AI Agent and MCP Servers (Multi-tenant)

- Set up company-isolated MCP microservices
- Develop AI agent with company-level data filtering
- Implement company-specific AI suggestions and monitoring
- Create permission-aware MCP endpoints
- Build AI dashboard with company isolation

### Week 7: Security and Data Isolation Testing

- Perform thorough multi-tenant security testing
- Validate complete data isolation between companies
- Test role and permission enforcement
- Verify company-specific AI functionality
- Conduct penetration testing for tenant isolation

### Week 8: End-to-End Multi-Company Testing

- Test complete workflows across multiple test companies
- Validate Super Admin functionality across scenarios
- Test user creation and role assignment workflows
- Verify AI suggestions work correctly per company
- Test branch management and user assignments

### Week 9: Pilot Deployment with Multiple Companies

- Deploy MVP to multiple pilot companies
- Provide training materials for Super Admins
- Set up monitoring for multi-tenant performance
- Collect feedback on user management and role systems
- Monitor data isolation and security

### Week 10–11: Iterate Based on Multi-tenant Feedback

- Refine role and permission management based on feedback
- Improve Super Admin user experience
- Address any multi-tenant performance issues
- Enhance AI logic with company-specific tuning
- Fix any data isolation or security issues that emerge

## 16. Risks and Mitigations

### Risk: Data leakage between companies in multi-tenant environment.

**Mitigation:** Implement strict company-level data filtering at the database query level. Add automated tests to verify data isolation. Use row-level security features in PostgreSQL. Conduct regular security audits and penetration testing.

### Risk: Complex role and permission system becomes confusing for Super Admins.

**Mitigation:** Provide intuitive UI with clear permission descriptions. Include role templates for common scenarios. Add permission preview functionality. Provide comprehensive documentation and training materials.

### Risk: Performance degradation with multiple companies and complex permission checking.

**Mitigation:** Implement efficient indexing strategies on company_id and user permissions. Use caching for frequently accessed permission data. Optimize queries with proper company-level filtering. Monitor performance metrics continuously.

### Risk: Inaccurate unit conversions lead to stock discrepancies.

**Mitigation:** Write thorough unit tests for conversion logic and show conversion result to user before finalizing PR, MR, and ML forms. Implement company-specific unit validation.

### Risk: AI suggestions are irrelevant or too often false positives across different companies.

**Mitigation:** Start with simple threshold-based logic and allow Super Admins to adjust safety stock levels per item per company. Log user actions to refine rules quickly. Implement company-specific AI tuning.

### Risk: MCP integration adds latency to AI queries in multi-tenant environment.

**Mitigation:** Cache recent stock data in AI agent for short periods (e.g., 1 hour) per company. Only call MCP for items near thresholds. Implement efficient company-based data partitioning.

### Risk: Users find UI confusing for multi-unit items and role management.

**Mitigation:** In the first iteration, show all quantity fields in main units only, with an info icon explaining how conversion works. Provide clear role and permission indicators in UI. Add contextual help for complex features.

### Risk: Company registration fraud or abuse.

**Mitigation:** Implement email verification for company registration. Add CAPTCHA and rate limiting. Monitor registration patterns for suspicious activity. Require business documentation for verification (future enhancement).

## 17. Glossary

- **Main Unit:** The base unit in which stock is stored (e.g. kilograms for flour).
- **Buying Unit:** The smallest increment in which an item is purchased (e.g. grams).
- **Transferring Unit:** The unit used when moving items between branches (e.g. half-kilograms).
- **Using Unit:** The unit used when consuming items in formulas (e.g. grams or ounces).
- **Moving Average Cost:** A method of recalculating the average cost of stock on hand after each receipt of goods.
- **MCP (Model Context Protocol):** A standard layer that lets AI agents access and update data in other systems without custom integration code.

---

This PRD provides a detailed blueprint for the development of your MVP. It specifies the core features, user roles, workflows, AI integration, technical architecture, timelines, and success metrics. Sharing this with your team will align everyone on scope and priorities, allowing a focused effort on building a working prototype that demonstrates AI-driven supply chain automation for manufacturing industries.
