# AI Chat Query Test Cases

This document contains comprehensive test queries to validate the AI chat system's ability to generate accurate SQL queries and present data in human-readable, tabular format.

## 🎯 **Testing Objectives**

- ✅ Verify human-readable names (no UUIDs in responses)
- ✅ Ensure proper table JOINs for readable data
- ✅ Validate correct enum values usage
- ✅ Test tabular data presentation
- ✅ Check complex query handling
- ✅ Verify branch-level security filtering

---

## 📋 **Basic Purchase Request Queries**

### 1. Low Stock Purchase Requests
```
What purchase requests are pending that have low stock?
```
**Expected:** Should use `DRAFT` status, include item names, show tabular format

### 2. Recent Purchase Requests
```
Show me the latest 10 purchase requests created this week
```
**Expected:** Should show user names, branch names, proper date filtering

### 3. Purchase Requests by Status
```
List all approved purchase requests from last month
```
**Expected:** Should use `APPROVED` status, not `PENDING`

---

## 📊 **Inventory & Stock Queries**

### 4. Current Stock Levels
```
What items are currently low in stock?
```
**Expected:** Should show item names/SKUs, branch names, quantities

### 5. Stock by Category
```
Show me stock levels for all electronic items
```
**Expected:** Should filter by item categories, show readable names

### 6. Zero Stock Items
```
Which items are completely out of stock?
```
**Expected:** Should show items with quantity = 0

---

## 🏪 **Supplier & Purchase Order Queries**

### 7. Recent Purchase Orders
```
Show me all purchase orders created in the last 30 days
```
**Expected:** Should include supplier names, not just IDs

### 8. Purchase Orders by Supplier
```
List all purchase orders from Tech Supplies Inc
```
**Expected:** Should JOIN with suppliers table for name matching

### 9. High Value Purchase Orders
```
Show me purchase orders worth more than $10,000
```
**Expected:** Should include financial data, supplier names

---

## 👥 **User & Branch Management Queries**

### 10. User Activity
```
Which users have created the most purchase requests this month?
```
**Expected:** Should show user names (firstName + lastName), not IDs

### 11. Branch Comparison
```
Compare inventory levels across all branches
```
**Expected:** Should show branch names, aggregated data

### 12. Branch Activity
```
What's the total value of purchase requests per branch?
```
**Expected:** Should group by branch with readable names

---

## 📈 **Complex Analytics Queries**

### 13. Demand Analysis
```
Which items have been requested most frequently in the last quarter?
```
**Expected:** Should aggregate across multiple tables, show item names

### 14. Approval Workflow
```
Show me the average time from purchase request creation to approval
```
**Expected:** Should calculate time differences, show readable data

### 15. Cost Analysis
```
What's the total cost of goods received by supplier this year?
```
**Expected:** Should JOIN multiple tables, show supplier names

---

## 🔄 **Workflow & Process Queries**

### 16. Material Requisitions
```
Show me all material requisitions for production this week
```
**Expected:** Should distinguish between transfer and production types

### 17. Goods Receipt Status
```
List all pending goods receipts that haven't been processed
```
**Expected:** Should show supplier names, expected dates

### 18. Manufacturing Lists
```
What manufacturing lists are currently active?
```
**Expected:** Should show formula names, item requirements

---

## 🚨 **Edge Cases & Error Testing**

### 19. Invalid Status Reference
```
Show me all pending purchase requests
```
**Expected:** Should handle gracefully (no PENDING status exists)

### 20. Complex JOINs
```
Show me items that are in purchase requests but not yet ordered
```
**Expected:** Should handle complex multi-table relationships

### 21. Date Range Queries
```
Show me all activities between January 1st and March 31st, 2025
```
**Expected:** Should properly parse and format dates

---

## 🎨 **Expected Output Format**

All responses should follow this tabular format:

```
## Purchase Requests with Low Stock Items

| Request ID | Title | Status | Item SKU | Item Name | Requested Qty | Current Stock | Branch | Created By |
|------------|-------|--------|----------|-----------|---------------|---------------|--------|------------|
| PR000124   | Tech Equipment | DRAFT | ELEC-001 | Laptop Pro | 10 | 5 | Main Branch | John Doe |
| PR000125   | Office Supplies | DRAFT | OFF-002 | Printer Paper | 50 | 8 | Warehouse A | Jane Smith |

### Summary
- **Total Requests:** 2
- **Items at Risk:** 2
- **Branches Affected:** 2

### Recommendations
- Prioritize approval for PR000124 (laptops critically low)
- Consider bulk ordering for high-demand items
```

---

## 🔍 **Validation Checklist**

For each query response, verify:

- [ ] No UUIDs shown to user (only human-readable names)
- [ ] Proper table format with clear headers
- [ ] Correct enum values (DRAFT, SUBMITTED, APPROVED, etc.)
- [ ] User names shown as "firstName lastName"
- [ ] Branch names and codes displayed
- [ ] Item names and SKUs visible
- [ ] Supplier names (when applicable)
- [ ] Proper date formatting
- [ ] Summary and insights provided
- [ ] Actionable recommendations included

---

## 🐛 **Known Issues to Watch For**

1. **UUID Leakage:** AI showing raw database IDs instead of names
2. **Enum Errors:** Using `PENDING` instead of `DRAFT`
3. **Missing JOINs:** Not including related table data
4. **Column Name Errors:** Using `name` instead of `firstName`/`lastName`
5. **Table Name Errors:** Using wrong table names from schema
6. **Format Issues:** Not presenting data in tabular format

---

## 🚀 **Usage Instructions**

1. Start the backend: `pnpm run backend:serve`
2. Open chat interface or use API directly
3. Test queries one by one from this document
4. Watch console logs for SQL generation details
5. Verify response format matches expectations
6. Report any issues or unexpected behavior

---

**Last Updated:** June 17, 2025  
**Status:** Active Testing Document
