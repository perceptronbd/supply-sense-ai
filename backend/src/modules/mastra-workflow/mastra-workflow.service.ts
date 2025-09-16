import { Mastra } from '@mastra/core';
import { Injectable, Logger } from '@nestjs/common';
import { CHART_WORKFLOW_NAME, chatWorkflow } from '@supplysense/mastra';

@Injectable()
export class WorkflowService {
  private mastra: Mastra;
  private readonly logger = new Logger(WorkflowService.name);
  constructor() {
    this.mastra = new Mastra({
      workflows: {
        [CHART_WORKFLOW_NAME]: chatWorkflow,
      },
    });
  }

  async executeChatWorkflow(dbConnectionId: string, userQuery: string) {
    const workflow = this.mastra.getWorkflow(CHART_WORKFLOW_NAME);
    const run = workflow.createRun();

    const result = await run.start({
      inputData: {
        dbConnectionId,
        userQuery,
      },
    });

    this.logger.debug('Workflow execution result', result);

    if (result.status === 'success') {
      return result.result;
    }
    throw new Error(`Workflow execution failed: ${(result as unknown as { error: string }).error}`);
  }
}
