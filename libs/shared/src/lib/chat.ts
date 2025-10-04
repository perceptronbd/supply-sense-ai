export interface IChatFormattedResult {
  /**
   * The type of visualization to render
   * @enum {string} 'table' | 'bar' | 'line' | 'area' | 'radar' | 'text'
   */
  visualizationType: 'table' | 'bar' | 'line' | 'area' | 'radar' | 'text';

  /**
   * The formatted data ready for visualization
   * - For charts: Array of objects with 'name' and 'value' properties
   * - For tables: Array of objects with any structure
   * - For text: null
   */
  formattedData: Array<{ [key: string]: unknown }> | null;

  /**
   * Human-readable explanation of the data and visualization choice
   * Should be 3-5 sentences providing context and insights
   */
  response: string;
}
