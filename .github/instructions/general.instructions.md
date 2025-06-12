---
applyTo: "**"
---

# General Development Guidelines

## Code Quality and Best Practices

- Follow TypeScript strict mode and resolve all compilation errors
- Use proper type annotations instead of `any` types
- Follow conventional commit message format for clear commit history
- Maintain code readability and follow single responsibility principle
- Use proper error handling and validation patterns

## File Editing Guidelines

- When using `insert_edit_into_file`, avoid repeating existing code
- Use line comments with `...existing code...` to represent unchanged regions
- When using `replace_string_in_file`, include 3-5 lines of context before and after
- Always check current file contents before making edits
- Ensure edits result in valid, idiomatic code

## React and Frontend Best Practices

- **Always refer to `frontend/SEMANTIC_HTML_GUIDELINES.md` for semantic HTML and component usage guidelines**
- **YOU MUST ALWAYS ADHERE TO HEROUI DESIGN SYSTEM - Use HeroUI components, semantic tokens, and design patterns exclusively**
- **Use HeroUI semantic color tokens (e.g., `text-foreground`, `bg-content1`, `border-divider`) instead of custom Tailwind colors**
- **Apply HeroUI layout tokens for consistent spacing, sizing, and typography (e.g., `text-small`, `rounded-medium`, `p-4`)**
- **Leverage HeroUI component variants and props for theming instead of custom CSS classes**
- **Ensure all custom components follow HeroUI's design principles and integrate seamlessly with the theme system**
- Use semantic HTML elements (`<main>`, `<header>`, `<nav>`, `<section>`, `<aside>`, `<form>`, etc.) instead of generic `<div>` containers
- Always use Text component instead of h1-h6 and p tags with proper variant and as props
- Keep interactive components (Button, Input, etc.) as-is without wrapping in Text components
- **Convert all inline SVGs to reusable React components stored in `components/icons/` directory**
- Create SVG components with proper TypeScript interfaces including size, color, and className props
- Use semantic naming for SVG components (e.g., `ChevronDownIcon`, `UserIcon`, `SearchIcon`)
- Extract complex logic into custom hooks for better reusability
- Create reusable components following component composition patterns
- Use proper prop interfaces with TypeScript
- Follow React performance best practices (useMemo, useCallback when needed)
- Maintain consistent import organization and path structures

## Code Organization

- Group related functionality into logical modules
- Extract reusable utilities into separate files
- Follow consistent naming conventions across the codebase
- Maintain clear separation between business logic and UI components

## Script and Command Execution

- Always check package.json scripts before running commands to ensure proper execution
- Use the defined npm/pnpm scripts rather than direct tool commands when available
- Verify script configurations match the project's setup and requirements
- Review script dependencies and ensure all required packages are installed

## Testing and Validation

- Write meaningful tests for critical business logic
- Validate changes with compilation checks and linting
- Ensure backward compatibility when refactoring
- Test edge cases and error scenarios

## Documentation

- Write clear, descriptive commit messages
- Document complex logic with inline comments
- Keep README files and documentation up to date
- Use meaningful variable and function names that self-document
