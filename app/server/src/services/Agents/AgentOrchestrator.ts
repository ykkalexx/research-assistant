import { Agent, AgentResponse } from '../../types/types';
import { SummaryAgent } from './SummaryAgent';
import { QAAgent } from './QAAgent';

export class AgentOrchestrator {
  private agents: Agent[];

  constructor() {
    this.agents = [new SummaryAgent(), new QAAgent()];
  }

  async processRequest(task: string, context: string): Promise<AgentResponse> {
    const eligibleAgents = this.agents.filter(agent => agent.canHandle(task));

    if (eligibleAgents.length === 0) {
      throw new Error('No agent available to handle this task');
    }

    try {
      const results = await Promise.all(
        eligibleAgents.map(agent => agent.process(task, context))
      );

      // Select the response with highest confidence
      return results.reduce((best, current) =>
        current.confidence > best.confidence ? current : best
      );
    } catch (error) {
      throw new Error(`Agent processing failed: ${error}`);
    }
  }
}
