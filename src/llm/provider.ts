import type { CandidateEvaluation } from '../schemas/candidate.js';
import type { ConsolidatedReport } from '../schemas/report.js';

export interface EvaluationInput {
  jobDescription: string;
  resumeText: string;
  prompt: string;
  temperature: number;
  maxTokens: number;
}

export interface ConsolidationInput {
  jobDescription: string;
  prompt: string;
  candidateEvaluations: CandidateEvaluation[];
  temperature: number;
  maxTokens: number;
}

export interface LLMProvider {
  evaluateCandidate(input: EvaluationInput): Promise<CandidateEvaluation>;
  consolidate(input: ConsolidationInput): Promise<ConsolidatedReport>;
}
