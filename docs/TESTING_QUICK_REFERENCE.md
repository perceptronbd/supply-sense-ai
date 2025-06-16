# AI Chat Testing Quick Reference

## 🚀 Quick Start

1. **Start Backend:**
   ```bash
   pnpm run backend:serve
   ```

2. **Test Queries:**
   See comprehensive test cases in [`docs/AI_CHAT_TEST_QUERIES.md`](docs/AI_CHAT_TEST_QUERIES.md)

3. **Watch Console Logs:**
   The backend provides detailed logging for AI SQL generation process

## 🎯 Quick Test Queries

### Basic Test
```
What purchase requests are pending that have low stock?
```

### Complex Test  
```
Show me all items that need reordering based on current stock levels
```

### Analytics Test
```
Which suppliers have the fastest delivery times this month?
```

## 📊 Expected Output Format

All responses should be in **tabular format** with:
- Human-readable names (no UUIDs)
- Proper table headers
- Summary and insights
- Actionable recommendations

## 🔍 Key Validation Points

- ✅ No database IDs visible to users
- ✅ Proper enum values (DRAFT, not PENDING)  
- ✅ User names as "firstName lastName"
- ✅ Item names and SKUs displayed
- ✅ Branch names shown
- ✅ Tabular data presentation

## 📚 Full Documentation

For complete test cases and detailed validation criteria, see:
**[`docs/AI_CHAT_TEST_QUERIES.md`](docs/AI_CHAT_TEST_QUERIES.md)**
