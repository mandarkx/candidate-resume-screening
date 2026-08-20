import type { LLMProvider, EvaluationInput, ConsolidationInput } from '../../src/llm/provider.js';
import type { CandidateEvaluation } from '../../src/schemas/candidate.js';
import type { ConsolidatedReport } from '../../src/schemas/report.js';

export function createMockProvider(evaluations: CandidateEvaluation[], report: ConsolidatedReport): LLMProvider {
  return {
    async evaluateCandidate(_input: EvaluationInput): Promise<CandidateEvaluation> {
      return evaluations.shift() || createDefaultEvaluation();
    },
    async consolidate(_input: ConsolidationInput): Promise<ConsolidatedReport> {
      return report;
    },
  };
}

function createDefaultEvaluation(): CandidateEvaluation {
  return {
    candidateName: 'Unknown',
    overallScore: 0,
    recommendation: 'Weak Match',
    requiredQualifications: [],
    preferredQualifications: [],
    technicalSkills: [],
    relevantExperience: 'Not demonstrated in resume.',
    certifications: [],
    strengths: [],
    gaps: [],
    interviewQuestions: [],
    candidateSummary: 'No data available.',
    evidence: [],
  };
}
