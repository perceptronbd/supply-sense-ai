---
description:
globs:
alwaysApply: false
---
# PRD Requirements Tracking

## Document Reference
Main PRD document: [PRD.md](mdc:PRD.md)

## Multi-Tenant SaaS Architecture Requirements

### Company Management (FR-0.x)
- **FR-0.1** ✅ Company Registration: Self-service company registration
- **FR-0.2** ✅ Automatic Tenant Setup: Isolated company tenant creation
- **FR-0.3** ✅ Data Isolation: Complete data isolation between companies

### Role and Permission Management (FR-0.4-0.10)
- **FR-0.4** ✅ Role Creation: Discord-like custom role system
- **FR-0.5** ✅ Dynamic Role Assignment: On-the-fly role creation
- **FR-0.6** ✅ Module-Level Permissions: Granular permission system
- **FR-0.7** ✅ Branch Assignment: Multi-branch user assignments

## Item and Inventory Management

### Item Definition (FR-1-3) ✅ COMPLETE
- **FR-1**: Item definition with name, SKU, main unit
- **FR-2**: Unit conversion rates (buying, transfer, using units)
- **FR-3**: Stock storage in main units with real-time conversions
- **Implementation**: [backend/src/modules/item/](mdc:backend/src/modules/item/)

### Branch and Supplier Management (FR-4-5)
- **FR-4**: Branch management with unique identifiers
- **FR-5**: Supplier management with basic info
- **Implementation**: [backend/src/modules/branch/](mdc:backend/src/modules/branch/) and [backend/src/modules/supplier/](mdc:backend/src/modules/supplier/)

## Purchase Workflow

### Purchase Request (FR-6-9)
- **FR-6**: PR creation with item selection and quantities
- **FR-7**: PR templates for common raw materials
- **FR-8**: PR status workflow: Draft → Submitted → Approved → Converted to PO
- **FR-9** ✅: AI Agent stock monitoring and alerts

### Purchase Order (FR-10-12)
- **FR-10**: PO creation from approved PR
- **FR-11**: PO status workflow
- **FR-12**: AI Agent delivery tracking

## Inter-Branch Operations

### Request Form (FR-13-15)
- **FR-13**: RF creation for inter-branch item requests
- **FR-14**: RF templates for common shared items
- **FR-15**: RF status workflow

### Material Requisition (FR-16-19)
- **FR-16**: MR conversion from approved RF
- **FR-17**: MR capture of transfer details
- **FR-18**: Trim and waste mode support
- **FR-19**: Stock deduction on MR approval

## Goods Receipt and Production

### Goods Received (FR-20-22)
- **FR-20**: GR from PO or MR
- **FR-21**: GR entry with actual quantities
- **FR-22**: Moving average cost calculation

### Formula Management (FR-23-24)
- **FR-23**: Formula definition with raw materials
- **FR-24**: Formula versioning

### Manufacturing List (FR-25-28)
- **FR-25**: ML creation with formula selection
- **FR-26**: Stock deduction on ML start
- **FR-27**: Finished product addition on completion
- **FR-28**: Stock availability validation

## AI Integration

### MCP Integration (FR-29-33) 🔄 IN PROGRESS
- **FR-29**: AI Agent database connection via MCP
- **FR-30**: Company-filtered MCP endpoints
- **FR-31** ✅: AI stock monitoring and alerts (Item module implemented)
- **FR-32**: AI suggestions dashboard
- **FR-33**: AI recommendation logging

## Implementation Status Legend
- ✅ **Complete**: Fully implemented and tested
- 🔄 **In Progress**: Partially implemented
- ⏳ **Planned**: Not yet started
- ❌ **Blocked**: Requires dependencies

## Key Implementation Notes
1. All modules must implement company-level data isolation
2. Use consistent role-based access control patterns
3. AI monitoring endpoints should be optimized for MCP consumption
4. Unit conversions must always store in main units (FR-3)
5. Stock-level filtering requires post-processing due to Prisma limitations
