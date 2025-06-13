# Instruction Files Structure

This document explains the reorganized instruction files and their specific purposes.

## File Structure

```
.github/instructions/
├── general.instructions.md      # General development practices
├── frontend.instructions.md     # Frontend and React specific guidelines
├── typescript.instructions.md   # TypeScript and code quality guidelines
├── testing.instructions.md      # Testing and validation guidelines
└── README.md                   # This documentation
```

## File Purposes and Scope

### `general.instructions.md`
**Applies to:** All files (`**`)

**Contains:**
- Code quality and best practices
- File editing guidelines
- Code organization principles
- Script and command execution
- Git and version control standards
- Error handling and validation patterns
- Performance guidelines
- Security guidelines
- Documentation standards
- Debugging guidelines

**Use when:** Working on any file in the project, setting up development workflow, or establishing general coding standards.

### `frontend.instructions.md`
**Applies to:** Frontend files (`frontend/**`)

**Contains:**
- **CRITICAL: Semantic HTML Requirements** (formerly in SEMANTIC_HTML_GUIDELINES.md)
- Text component usage rules
- HeroUI design system compliance
- Component development standards
- Conditional rendering guidelines
- Component extraction guidelines
- Complete semantic HTML examples
- Migration rules for legacy code

**Use when:** Writing React components, JSX, frontend layouts, or any frontend-specific code.

### `typescript.instructions.md`
**Applies to:** TypeScript files (`**/*.ts,**/*.tsx,**/*.js,**/*.jsx`)

**Contains:**
- TypeScript best practices and type safety
- Interface and type definitions
- Component type integration with HeroUI
- API response types
- Form data types
- Custom hooks guidelines
- Validation and schema patterns
- Testing type definitions
- Import/export patterns

**Use when:** Writing TypeScript code, defining types/interfaces, or integrating with HeroUI components.

### `testing.instructions.md`
**Applies to:** Test files (`**/*.test.ts,**/*.test.tsx,**/*.spec.ts,**/*.spec.tsx,**/e2e/**,**/tests/**`)

**Contains:**
- Testing philosophy and priorities
- Unit testing standards
- Component testing examples
- Hook testing patterns
- Integration testing with MSW
- E2E testing with Playwright
- Performance testing
- Test data management
- Test environment setup

**Use when:** Writing tests, setting up test infrastructure, or establishing testing standards.

## Key Changes Made

### 1. Semantic HTML Integration
- **MOVED** all content from `frontend/SEMANTIC_HTML_GUIDELINES.md` into `frontend.instructions.md`
- **DELETED** the original `frontend/SEMANTIC_HTML_GUIDELINES.md` file
- **ENHANCED** semantic HTML guidelines with more examples and stricter requirements

### 2. Context-Based Organization
- **SEPARATED** concerns into specific domains (frontend, typescript, testing, general)
- **APPLIED** specific file patterns using `applyTo` directives
- **ELIMINATED** redundancy between instruction files

### 3. Enhanced Content
- **ADDED** comprehensive TypeScript guidelines with HeroUI integration examples
- **EXPANDED** testing guidelines with real-world patterns
- **IMPROVED** general development practices with security and performance guidance
- **INCLUDED** practical code examples for all major patterns

## Benefits of This Structure

### 1. **Context-Aware Guidelines**
- Developers see only relevant instructions for the files they're working on
- No need to search through unrelated guidelines

### 2. **Comprehensive Coverage**
- Frontend developers get complete semantic HTML, React, and HeroUI guidance
- TypeScript developers get type safety and integration patterns
- Testing specialists get comprehensive testing strategies
- All developers get general best practices

### 3. **Maintainability**
- Easy to update specific domain guidelines without affecting others
- Clear separation of concerns
- Reduced duplication and conflicts

### 4. **Developer Experience**
- Faster onboarding with focused, relevant guidelines
- Better IntelliSense and tooling support with proper TypeScript patterns
- Consistent code quality across all domains

## Usage Examples

### Working on a React Component
**Files involved:** `frontend/src/components/ui/ItemCard.tsx`
**Instructions applied:** `frontend.instructions.md` + `typescript.instructions.md` + `general.instructions.md`

### Writing Unit Tests
**Files involved:** `frontend/src/components/ui/ItemCard.test.tsx`
**Instructions applied:** `testing.instructions.md` + `typescript.instructions.md` + `general.instructions.md`

### Setting up CI/CD
**Files involved:** `.github/workflows/ci.yml`
**Instructions applied:** `general.instructions.md` only

### Backend API Development
**Files involved:** `backend/src/modules/item/item.service.ts`
**Instructions applied:** `typescript.instructions.md` + `general.instructions.md`

This structure ensures that developers always have access to the most relevant and comprehensive guidelines for their current context while maintaining consistency across the entire codebase.
