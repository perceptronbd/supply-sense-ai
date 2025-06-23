# SupplySense Mastra MCP Server

A Model Context Protocol (MCP) server built with Mastra for supply chain management operations.

## Overview

This MCP server provides AI-powered supply chain management capabilities through the Mastra framework. It follows the official Mastra project structure and conventions.

### Features

- **Supply Chain Agent**: An intelligent assistant for monitoring and managing supply chain operations
- **Supply Chain Tool**: Tools for checking stock levels, supplier performance, and operational status  
- **Supply Chain Workflow**: Automated workflow for inventory monitoring and reorder alerts
- **MCP Integration**: Ready to integrate with VS Code or other MCP-compatible clients

### Architecture

The project follows the recommended Mastra structure:
```
src/
  mastra/
    agents/           # AI agents for supply chain management
    tools/            # Tools for supply chain operations
    workflows/        # Automated supply chain workflows
    index.ts          # Main Mastra configuration
  main.ts             # Server entry point
```

## Current Status ✅

- ✅ **Project Structure**: Follows official Mastra conventions
- ✅ **Agent Implementation**: Supply Chain Agent with Gemini integration
- ✅ **Tool Integration**: Supply chain status tool 
- ✅ **Workflow System**: Inventory monitoring workflow with proper steps
- ✅ **Build System**: Compiles successfully with TypeScript
- ✅ **Nx Integration**: Properly integrated into the monorepo

## Quick Start

### Prerequisites
- Node.js v20.0 or higher
- Gemini API key (or other supported LLM provider)

### Setup

1. **Install dependencies** (from the workspace root):
   ```bash
   pnpm install
   ```

2. **Configure environment**:
   ```bash
   cp mastra-mcp-server/.env.example mastra-mcp-server/.env
   ```
   
   Then edit `.env` and add your API keys:
   ```env
   GOOGLE_GENERATIVE_AI_API_KEY=your-gemini-api-key-here
   ```

3. **Build the project**:
   ```bash
   pnpm nx build mastra-mcp-server
   ```

4. **Run the server**:
   ```bash
   pnpm nx serve mastra-mcp-server
   ```

## Features in Detail

### Supply Chain Agent
- Natural language querying of supply chain data
- Intelligent recommendations and insights
- Real-time status monitoring
- Data-driven decision support

### Supply Chain Tool
- Stock level monitoring
- Supplier performance tracking
- Lead time analysis
- Operational status reporting

### Supply Chain Workflow
- **Step 1**: Check inventory levels for items
- **Step 2**: Create reorder alerts when stock is below threshold
- **Features**: Proper Mastra workflow structure with typed inputs/outputs
- **Integration**: Uses `createWorkflow` and `createStep` from Mastra

## Development

### Available Commands

- `pnpm nx build mastra-mcp-server` - Build the application
- `pnpm nx serve mastra-mcp-server` - Run in development mode
- `pnpm nx test mastra-mcp-server` - Run tests
- `pnpm nx lint mastra-mcp-server` - Run linting (via Biome)

### Project Structure Details

```
mastra-mcp-server/
├── src/
│   ├── mastra/
│   │   ├── agents/
│   │   │   └── supply-chain-agent.ts    # Main supply chain AI agent
│   │   ├── tools/
│   │   │   └── supply-chain-tool.ts     # Supply chain status tool
│   │   ├── workflows/
│   │   │   └── supply-chain-workflow.ts # Inventory monitoring workflow
│   │   └── index.ts                     # Mastra configuration
│   └── main.ts                          # Server entry point
├── .env.example                         # Environment template
├── README.md                           # This file
└── project.json                        # Nx project configuration
```

### Adding New Components

#### Adding a New Tool
```typescript
// src/mastra/tools/my-tool.ts
import { createTool } from '@mastra/core/tools';
import { z } from 'zod';

export const myTool = createTool({
  id: 'my-tool',
  description: 'Description of what the tool does',
  inputSchema: z.object({
    // Define input parameters
  }),
  outputSchema: z.object({
    // Define output structure
  }),
  execute: async () => {
    // Tool implementation
  },
});
```

#### Adding a New Workflow
```typescript
// src/mastra/workflows/my-workflow.ts
import { createWorkflow, createStep } from '@mastra/core/workflows';
import { z } from 'zod';

const myStep = createStep({
  id: 'my-step',
  description: 'Step description',
  inputSchema: z.object({...}),
  outputSchema: z.object({...}),
  execute: async (context) => {
    // Step implementation
    return { /* step output */ };
  },
});

export const myWorkflow = createWorkflow({
  id: 'my-workflow',
  description: 'Workflow description',
  inputSchema: z.object({...}),
  outputSchema: z.object({...}),
})
  .then(myStep)
  .commit();
```

## Integration Examples

### Running a Workflow Programmatically
```typescript
import { mastra } from './mastra';

// Get workflow and create run
const workflow = mastra.getWorkflow('supplyChainWorkflow');
const run = workflow.createRun();

// Execute workflow
const result = await run.start({
  inputData: {
    itemSku: 'ITEM-001',
    threshold: 20
  }
});

console.log('Workflow Result:', result);
```

### Using the Agent
```typescript
import { mastra } from './mastra';

// Get agent
const agent = mastra.getAgent('supplyChainAgent');

// Generate response
const response = await agent.generate('What is the current inventory status?');
console.log(response.text);
```

## Next Steps

### Phase 1 (Current) ✅
- [x] Basic Mastra MCP server setup
- [x] Supply chain monitoring tool
- [x] AI agent integration
- [x] Workflow implementation
- [x] Proper Mastra structure

### Phase 2 (Next)
- [ ] Environment variable configuration
- [ ] Integration with actual supply chain data sources
- [ ] Enhanced tool capabilities with real data
- [ ] Real-time data streaming
- [ ] Advanced analytics

### Phase 3 (Future)
- [ ] Multi-agent workflows
- [ ] Custom integrations with existing systems
- [ ] Advanced AI capabilities
- [ ] Production deployment
- [ ] VS Code MCP extension

## Contributing

This project follows agile methodology with incremental improvements. Each iteration focuses on adding value while maintaining code quality and following Mastra best practices.

## License

Part of the SupplySense AI monorepo.
