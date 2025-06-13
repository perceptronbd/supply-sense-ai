---
applyTo: "frontend/**"
---

# Frontend Development Guidelines

## CRITICAL: Semantic HTML Requirements (MANDATORY)

### Overview
Use semantic HTML elements to provide meaning and structure to content. This improves accessibility, SEO, and code maintainability.

### Mandatory Semantic HTML Rules
- **MANDATORY: Use semantic HTML elements - Never use generic `<div>` or `<span>` when semantic alternatives exist**
- **REQUIRED: Use `<article>` for standalone content pieces (cards, items, posts)**
- **REQUIRED: Use `<section>` for distinct content sections with clear purpose**
- **REQUIRED: Use `<header>`, `<main>`, `<nav>`, `<aside>`, `<footer>` for page structure**
- **REQUIRED: Use `<form>` for ALL form containers, never generic divs**
- **REQUIRED: Use `<dl>`, `<dt>`, `<dd>` for key-value pairs and data descriptions**
- **REQUIRED: Use `<ul>`, `<ol>`, `<li>` for lists, even if styled as cards or grids**
- **FORBIDDEN: Raw HTML text elements (`<h1>`, `<h2>`, `<p>`, `<span>`) - Use Text component ONLY**

### Semantic HTML Element Usage

#### Navigation
- Use `<nav>` for navigation sections
- Use `<ul>` and `<li>` for navigation lists

#### Content Structure
- Use `<main>` for the main content area
- Use `<header>` for page/section headers
- Use `<footer>` for page/section footers
- Use `<section>` for distinct sections of content
- Use `<article>` for standalone content pieces
- Use `<aside>` for sidebar content

#### Forms
- Use `<form>` for all form containers
- Use proper form elements: `<input>`, `<textarea>`, `<select>`, `<button>`
- Use `<fieldset>` and `<legend>` for grouping related form controls
- Use `<label>` for form labels (properly associated with controls)

#### Data Display
- Use `<table>`, `<thead>`, `<tbody>`, `<tr>`, `<th>`, `<td>` for tabular data
- Use `<dl>`, `<dt>`, `<dd>` for description lists

#### Generic Containers
- Use `<div>` only when no semantic element is appropriate
- Use `<span>` for inline styling when no semantic element fits

## Text Component Usage (MANDATORY)

### Text Component Rules
- **MANDATORY: Always use Text component instead of ANY h1-h6, p, or span tags**
- **MANDATORY: Keep interactive components (Button, Input, Select, etc.) unwrapped - do NOT put them inside Text components**

### Text Component Variants
```tsx
// Headers
<Text variant="display">...</Text>        // Largest heading
<Text variant="headerLarge">...</Text>    // h1 equivalent  
<Text variant="headerMedium">...</Text>   // h2 equivalent
<Text variant="headerSmall">...</Text>    // h3 equivalent

// Titles
<Text variant="titleLarge">...</Text>     // h4 equivalent
<Text variant="titleMedium">...</Text>    // h5 equivalent
<Text variant="titleSmall">...</Text>     // h6 equivalent

// Body text
<Text variant="bodyLarge">...</Text>      // Large body text
<Text variant="bodyMedium">...</Text>     // Medium body text (default)
<Text variant="bodyBase">...</Text>       // Base body text
<Text variant="bodySmall">...</Text>      // Small body text
<Text variant="bodyXSmall">...</Text>     // Extra small body text
```

### Text Component Props
```tsx
<Text 
  variant="headerLarge"    // Size/style variant
  weight="bold"            // Font weight: bold, semiBold, medium, normal, thin
  as="h1"                  // Semantic HTML element to render
  className="..."          // Additional CSS classes
  style={{...}}            // Inline styles
>
  Content
</Text>
```

## HeroUI Design System Compliance (MANDATORY)

- **YOU MUST ALWAYS ADHERE TO HEROUI DESIGN SYSTEM - Use HeroUI components, semantic tokens, and design patterns exclusively**
- **Always use the correct HeroUI type for each component to ensure proper typing and IntelliSense support**
- **Use HeroUI semantic color tokens (e.g., `text-foreground`, `bg-content1`, `border-divider`) instead of custom Tailwind colors**
- **Apply HeroUI layout tokens for consistent spacing, sizing, and typography (e.g., `text-small`, `rounded-medium`, `p-4`)**
- **Leverage HeroUI component variants and props for theming instead of custom CSS classes**
- **Ensure all custom components follow HeroUI's design principles and integrate seamlessly with the theme system**

## Component Development Standards

- **If a JSX block can be turned into a component for reusability in the future, then it should be extracted and converted into a component**
- **For simple conditions with short return elements, prefer a ternary expression. But if conditions or returned JSX are complex, use if statements or switch for clarity**
- **Convert all inline SVGs to reusable React components stored in `components/icons/` directory**
- Create SVG components with proper TypeScript interfaces including size, color, and className props
- Use semantic naming for SVG components (e.g., `ChevronDownIcon`, `UserIcon`, `SearchIcon`)
- Extract complex logic into custom hooks for better reusability
- Create reusable components following component composition patterns
- Follow React performance best practices (useMemo, useCallback when needed)
- Maintain consistent import organization and path structures

## Conditional Rendering Guidelines

```tsx
// ✅ GOOD: Simple, readable ternary for short conditions
return condition1
  ? <Element1 />
  : condition2
    ? <Element2 />
    : <Element3 />;

// ✅ GOOD: If statements for complex logic or JSX
if (condition1) {
  return (
    <ComplexElement>
      <MultipleChildren />
      <WithManyProps prop1="value" prop2="value" />
    </ComplexElement>
  );
}
if (condition2) {
  return <AnotherComplexElement />;
}
return <DefaultElement />;

// ❌ AVOID: Complex ternary with long JSX
return condition1 ? (
  <ComplexElement>
    <MultipleChildren />
    <WithManyProps prop1="value" prop2="value" />
  </ComplexElement>
) : condition2 ? (
  <AnotherComplexElement />
) : (
  <DefaultElement />
);
```

## Component Extraction Guidelines

```tsx
// ❌ AVOID: Inline JSX that could be reused elsewhere
function MainComponent() {
  return (
    <section>
      <header>
        <h1>Product Title</h1>
        <p>Product description</p>
        <div className="price">$99.99</div>
      </header>
      <div className="actions">
        <button>Add to Cart</button>
        <button>Save for Later</button>
      </div>
    </section>
  );
}

// ✅ GOOD: Extract reusable components
function MainComponent() {
  return (
    <section>
      <ProductHeader title="Product Title" description="Product description" price="$99.99" />
      <ProductActions onAddToCart={handleAddToCart} onSaveForLater={handleSaveForLater} />
    </section>
  );
}

// These components can now be reused across different product displays
function ProductHeader({ title, description, price }) {
  return (
    <header>
      <Text variant="titleLarge" as="h1">{title}</Text>
      <Text variant="bodyBase" as="p">{description}</Text>
      <Text variant="titleMedium" className="price" as="div">{price}</Text>
    </header>
  );
}

function ProductActions({ onAddToCart, onSaveForLater }) {
  return (
    <section className="actions">
      <Button onPress={onAddToCart}>Add to Cart</Button>
      <Button variant="flat" onPress={onSaveForLater}>Save for Later</Button>
    </section>
  );
}
```

## Semantic HTML Examples (Follow These Patterns)

### Complete Page Structure
```tsx
<main>
  <header>
    <Text variant="headerLarge" as="h1">Page Title</Text>
    <Text variant="bodyBase" as="p">Page description</Text>
  </header>
  
  <section>
    <Text variant="headerMedium" as="h2">Section Title</Text>
    <article className="border border-divider rounded-lg p-4">
      <header>
        <Text variant="titleMedium" as="h3">Card Title</Text>
      </header>
      <dl className="grid grid-cols-2 gap-4">
        <dt><Text variant="bodySmall" color="muted">Label</Text></dt>
        <dd><Text variant="bodyMedium">Value</Text></dd>
      </dl>
      <section className="flex gap-2 mt-4">
        <Button variant="primary">Action</Button>
      </section>
    </article>
  </section>
</main>
```

### Navigation
```tsx
<nav>
  <ul>
    <li><a href="/">Home</a></li>
    <li><a href="/about">About</a></li>
  </ul>
</nav>
```

### Forms
```tsx
<form>
  <fieldset>
    <legend>
      <Text variant="titleMedium" as="span">Form Section</Text>
    </legend>
    
    <label htmlFor="name">
      <Text variant="bodyBase" as="span">Name</Text>
    </label>
    <input id="name" type="text" />
    
    <Button type="submit">Submit</Button>
  </fieldset>
</form>
```

### Interactive Elements
```tsx
// ✅ CORRECT: Keep interactive components as-is
<Button color="primary">Action Button</Button>
<Input label="Field Name" />
<Select label="Choose Option">...</Select>

// ❌ INCORRECT: Don't wrap interactive components
<Text as="div">
  <Button>Action Button</Button>
</Text>
```

## Migration Rules

### Replace Direct HTML Tags
```tsx
// ❌ BEFORE
<h1>Title</h1>
<h2>Subtitle</h2>
<p>Content</p>

// ✅ AFTER
<Text variant="headerLarge" as="h1">Title</Text>
<Text variant="headerMedium" as="h2">Subtitle</Text>
<Text variant="bodyBase" as="p">Content</Text>
```

### Add Semantic Structure
```tsx
// ❌ BEFORE
<div className="page">
  <div className="header">
    <Text variant="headerLarge">Title</Text>
  </div>
  <div className="content">
    <Text variant="bodyBase">Content</Text>
  </div>
</div>

// ✅ AFTER
<main className="page">
  <header className="header">
    <Text variant="headerLarge" as="h1">Title</Text>
  </header>
  <section className="content">
    <Text variant="bodyBase" as="p">Content</Text>
  </section>
</main>
```

## Implementation Priority
1. **High Priority**: Everything is high priority