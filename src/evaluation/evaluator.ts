import type { LLMProvider } from '../llm/provider.js';
import type { CandidateEvaluation } from '../schemas/candidate.js';
import type { ExtractionResult } from '../shared/types.js';
import { CandidateEvaluationSchema } from '../schemas/candidate.js';
import { toErrorMessage } from '../utils/text.js';

export interface EvaluateCandidateOptions {
  jobDescription: string;
  resume: ExtractionResult;
  prompt: string;
  provider: LLMProvider;
  temperature: number;
  maxTokens: number;
  maxRetries: number;
}

export async function evaluateCandidate(options: EvaluateCandidateOptions): Promise<CandidateEvaluation> {
  const { jobDescription, resume, prompt, provider, temperature, maxTokens, maxRetries } = options;

  if (!resume.success || !resume.text) {
    return createFailedEvaluation(resume.file.originalName, resume.error || 'Extraction failed');
  }

  let lastError: Error | undefined;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const result = await provider.evaluateCandidate({
        jobDescription,
        resumeText: resume.text,
        prompt,
        temperature,
        maxTokens,
      });

      // Redundant safety validation; OpenAIProvider already validates.
      const parsed = CandidateEvaluationSchema.safeParse(result);
      if (!parsed.success) {
        throw new Error(`Schema validation failed: ${parsed.error.message}`);
      }

      // Ensure name is not empty.
      if (!parsed.data.candidateName || parsed.data.candidateName.trim().length === 0) {
        parsed.data.candidateName = resume.file.originalName;
      }

      return parsed.data;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(toErrorMessage(error));
      if (attempt < maxRetries) {
        await delay(500 * (attempt + 1));
      }
    }
  }

  return createFailedEvaluation(
    resume.file.originalName,
    lastError ? lastError.message : 'Evaluation failed after all retries.'
  );
}

function createFailedEvaluation(candidateName: string, error: string): CandidateEvaluation {
  return {
    candidateName,
    overallScore: 0,
    recommendation: 'Weak Match',
    requiredQualifications: [],
    preferredQualifications: [],
    technicalSkills: [],
    relevantExperience: 'Not demonstrated in resume.',
    certifications: [],
    strengths: [],
    gaps: [error],
    interviewQuestions: [],
    candidateSummary: `Evaluation could not be completed: ${error}`,
    evidence: [],
    error,
  };
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
