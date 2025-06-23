import type { CodeToHtmlOptions } from '@llm-ui/code';
import { loadHighlighter, useCodeBlockToHtml } from '@llm-ui/code';
import { type LLMOutputComponent } from '@llm-ui/react';
import parseHtml from 'html-react-parser';
import { createHighlighter } from 'shiki';

// Load the highlighter with basic setup
const highlighter = loadHighlighter(
  createHighlighter({
    langs: ['typescript', 'javascript', 'python', 'sql', 'json', 'bash'],
    themes: ['github-dark', 'github-light'],
  })
);

const codeToHtmlOptions: CodeToHtmlOptions = {
  theme: 'github-dark',
};

/**
 * Enhanced Code Block component for LLM output with syntax highlighting
 * Uses Shiki for high-quality code highlighting
 */
const LLMCodeBlockComponent: LLMOutputComponent = ({ blockMatch }) => {
  const { html, code } = useCodeBlockToHtml({
    markdownCodeBlock: blockMatch.output,
    highlighter,
    codeToHtmlOptions,
  });

  if (!html) {
    // Fallback to basic <pre> if Shiki is not loaded yet
    return (
      <div className="relative my-4">
        <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
          <code className="text-sm font-mono">{code}</code>
        </pre>
      </div>
    );
  }

  return (
    <div className="relative my-4">
      <div className="bg-gray-900 rounded-lg overflow-hidden">
        {' '}
        <div className="flex items-center justify-between px-4 py-2 bg-gray-800 border-b border-gray-700">
          <span className="text-sm text-gray-400 font-medium">Code</span>
          <button
            type="button"
            onClick={() => navigator.clipboard.writeText(code)}
            className="text-xs text-gray-400 hover:text-gray-200 transition-colors"
            title="Copy code"
          >
            Copy
          </button>
        </div>
        <div className="overflow-x-auto">{parseHtml(html)}</div>
      </div>
    </div>
  );
};

export default LLMCodeBlockComponent;
