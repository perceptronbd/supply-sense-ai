export function generateFriendlyLabel(tableName: string): string {
  return (
    tableName
      // Replace underscores and hyphens with spaces
      .replace(/[_-]/g, ' ')
      // Split camelCase words
      .replace(/([a-z])([A-Z])/g, '$1 $2')
      // Split consecutive capitals (like "XMLHttpRequest" -> "XML Http Request")
      .replace(/([A-Z])([A-Z][a-z])/g, '$1 $2')
      // Capitalize first letter of each word
      .replace(/\b\w/g, (char) => char.toUpperCase())
      // Clean up extra spaces
      .replace(/\s+/g, ' ')
      .trim()
  );
}
