# Color Theme Integration Guide

Your custom color palette has been successfully integrated into both light and dark themes of your application. Here's how to use the new colors:

## Color Palettes

### Big Stone (Blue-Grey)
- **Usage**: Primary colors, neutral elements, navigation, headers
- **Light theme**: Used for primary colors and text
- **Dark theme**: Used for backgrounds and primary elements
- **CSS Classes**: `bg-bigStone-500`, `text-bigStone-300`, etc.

### Pomegranate (Red)
- **Usage**: Secondary elements, call-to-action buttons, accent colors
- **Light & Dark themes**: Used for secondary colors
- **CSS Classes**: `bg-pomegranate-500`, `text-pomegranate-400`, etc.

### Pavlova (Cream/Beige)
- **Usage**: Warnings, backgrounds, subtle accents
- **Light theme**: Used for background and warning colors
- **Dark theme**: Used for warning elements
- **CSS Classes**: `bg-pavlova-500`, `text-pavlova-600`, etc.

## Theme Integration

### Light Theme
- **Background**: Pavlova 50 (`#FCFAF5`) - Warm, clean background
- **Foreground**: Big Stone 500 (`#0A2538`) - Dark, readable text
- **Primary**: Big Stone palette - Deep blue-grey for primary actions
- **Secondary**: Pomegranate palette - Vibrant red for secondary elements
- **Danger**: Pomegranate palette - Vibrant red for errors/alerts
- **Warning**: Pavlova palette - Warm tones for warnings

### Dark Theme
- **Background**: Big Stone 900 (`#02070B`) - Very dark blue-grey
- **Foreground**: Pavlova 100 (`#F9F5EB`) - Light cream for readability
- **Primary**: Big Stone palette (lighter shades) - Blue-grey for primary actions
- **Secondary**: Pomegranate palette (darker shades) - Red tones for secondary elements
- **Danger**: Pomegranate palette - Red tones for errors
- **Warning**: Pavlova palette - Warm tones for warnings

## Usage Examples

### Using Theme Colors (HeroUI Components)
```tsx
// Primary button
<Button color="primary">Save Changes</Button>

// Secondary button (now pomegranate red)
<Button color="secondary">Call to Action</Button>

// Danger button (still pomegranate red)
<Button color="danger">Delete Item</Button>

// Warning alert (pavlova cream)
<Alert color="warning">Please review the data</Alert>
```

### Using Custom Palette Classes
```tsx
// Big Stone colors
<div className="bg-bigStone-500 text-bigStone-50">
  Navigation Header
</div>

// Pomegranate colors
<div className="bg-pomegranate-100 text-pomegranate-800">
  Error Message
</div>

// Pavlova colors
<div className="bg-pavlova-200 text-pavlova-900">
  Secondary Content
</div>
```

### Responsive and State-Based Colors
```tsx
// Hover effects
<button className="bg-bigStone-500 hover:bg-bigStone-600 text-pavlova-50">
  Hover me
</button>

// Dark mode variants
<div className="bg-pavlova-100 dark:bg-bigStone-800 text-bigStone-800 dark:text-pavlova-100">
  Auto-switching theme content
</div>
```

## Color Accessibility

The color combinations have been chosen for good contrast ratios:

- **Light theme**: Dark blue-grey text on cream backgrounds
- **Dark theme**: Light cream text on dark blue-grey backgrounds
- **Danger states**: Red colors with appropriate contrast
- **Interactive elements**: Clear color differentiation

## Available Color Shades

Each palette includes shades from 50 (lightest) to 950 (darkest):
- `bigStone-{50,100,200,300,400,500,600,700,800,900,950}`
- `pomegranate-{50,100,200,300,400,500,600,700,800,900,950}`
- `pavlova-{50,100,200,300,400,500,600,700,800,900,950}`

## Theme Switching

Your application uses `darkMode: "class"`, so theme switching is controlled by adding/removing the `dark` class to the root element. The HeroUI components will automatically adapt to use the appropriate theme colors.
