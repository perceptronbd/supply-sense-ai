import type { GenerateDescriptionInput } from '@/modules/mcp-client/services/table-description-agent.service';

export const buildTableDescriptionPrompt = (inputs: GenerateDescriptionInput[]) => {
  // Build a comprehensive prompt for all relationships
  const relationshipsData = inputs
    .map((input, index) => {
      const businessContextPart = input.businessContext
        ? `\n   Business Context: ${input.businessContext}`
        : '';
      return `${index + 1}. Table: ${input.tableName}
   Field: ${input.columnName}
   Connected to: ${input.refTable}.${input.refColumn}${businessContextPart}`;
    })
    .join('\n\n');

  const systemPrompt = `Database Relationship Analysis for Multiple Relationships:

${relationshipsData}

Please generate user-friendly descriptions for each relationship above. Return your response as a JSON array where each element corresponds to the relationship in the same order. Each description should explain what the relationship means for business users and how it helps with data analysis.

Format your response as:
["Description for relationship 1", "Description for relationship 2", ...]

Guidelines for each description:
- Use simple, everyday business language
- Start with "This means..." or "This shows..."
- Explain the business relationship and its practical value
- Keep under 200 characters
- Focus on how it helps with analysis or insights

Note important: Only return the JSON array
`;

  return { systemPrompt };
};
