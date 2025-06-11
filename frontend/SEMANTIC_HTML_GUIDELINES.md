# Frontend Semantic HTML/JSX Guidelines

## Overview
This document outlines the guidelines for using semantic HTML/JSX tags and the Text component in our frontend codebase.

## Rules

### 1. Always Use Semantic HTML/JSX Tags
Use semantic HTML elements to provide meaning and structure to content:

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

### 2. Text Component Usage
**ALWAYS use the Text component instead of h1-h6 and p tags.**

**DO NOT wrap Button components, input elements, or other interactive components in Text components.**

#### Text Component Variants
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
<Text variant="body2XSmall">...</Text>    // 2x small body text
<Text variant="body3XSmall">...</Text>    // 3x small body text
```

#### Text Component Props
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

#### Semantic HTML with Text Component
```tsx
// CORRECT: Semantic structure with Text component
<header>
  <Text variant="headerLarge" as="h1">Page Title</Text>
  <Text variant="bodyBase" as="p">Page description</Text>
</header>

<main>
  <section>
    <Text variant="headerMedium" as="h2">Section Title</Text>
    <Text variant="bodyBase" as="p">Section content</Text>
  </section>
</main>

// INCORRECT: Non-semantic or direct h/p tags
<div>
  <h1>Page Title</h1>
  <p>Page description</p>
</div>
```

### 3. Common Patterns

#### Page Structure
```tsx
<main>
  <header>
    <Text variant="headerLarge" as="h1">Page Title</Text>
    <Text variant="bodyBase" as="p">Page description</Text>
  </header>
  
  <section>
    <Text variant="headerMedium" as="h2">Section Title</Text>
    <div className="content">
      <Text variant="bodyBase" as="p">Content</Text>
    </div>
  </section>
</main>
```

#### Navigation
```tsx
<nav>
  <ul>
    <li><a href="/">Home</a></li>
    <li><a href="/about">About</a></li>
  </ul>
</nav>
```

#### Forms
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

#### Interactive Elements
```tsx
// CORRECT: Keep interactive components as-is
<Button color="primary">Action Button</Button>
<Input label="Field Name" />
<Select label="Choose Option">...</Select>

// INCORRECT: Don't wrap interactive components
<Text as="div">
  <Button>Action Button</Button>
</Text>
```

### 4. Migration Rules

#### Replace Direct HTML Tags
```tsx
// BEFORE
<h1>Title</h1>
<h2>Subtitle</h2>
<p>Content</p>

// AFTER
<Text variant="headerLarge" as="h1">Title</Text>
<Text variant="headerMedium" as="h2">Subtitle</Text>
<Text variant="bodyBase" as="p">Content</Text>
```

#### Add Semantic Structure
```tsx
// BEFORE
<div className="page">
  <div className="header">
    <Text variant="headerLarge">Title</Text>
  </div>
  <div className="content">
    <Text variant="bodyBase">Content</Text>
  </div>
</div>

// AFTER
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
1. **High Priority**: Page layouts, main navigation, form structures
2. **Medium Priority**: Component layouts, content sections
3. **Low Priority**: Minor text elements, utility components

## Tools and Validation
- Use ESLint rules to enforce semantic HTML usage
- Use accessibility testing tools to validate semantic structure
- Regular code reviews focusing on semantic HTML compliance
