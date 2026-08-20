import { describe, it, expect } from 'vitest';
import { evaluateCandidate } from '../src/evaluation/evaluator.js';
import { consolidateEvaluations } from '../src/evaluation/consolidation.js';
import { createMockProvider } from './mocks/llmProvider.js';
import type { CandidateEvaluation } from '../src/schemas/candidate.js';
import type { ConsolidatedReport } from '../src/schemas/report.js';
import type { ExtractionResult } from '../src/shared/types.js';

const candidateA: CandidateEvaluation = {
  candidateName: 'Alice',
  overallScore: 88,
  recommendation: 'Strong Match',
  requiredQualifications: [{ qualification: 'BSc', status: 'demonstrated', evidence: 'BSc CS' }],
  preferredQualifications: [{ qualification: 'MSc', status: 'not-demonstrated', evidence: 'Not demonstrated in resume.' }],
  technicalSkills: [{ skill: 'React', proficiency: 'expert', evidence: '5 years' }],
  relevantExperience: 'Senior engineer at TechCorp',
  certifications: ['AWS'],
  strengths: ['React expert'],
  gaps: ['No Python'],
  interviewQuestions: ['Why React?'],
  candidateSummary: 'Strong front-end engineer.',
  evidence: ['5 years React'],
};

const candidateB: CandidateEvaluation = {
  candidateName: 'Bob',
  overallScore: 72,
  recommendation: 'Good Match',
  requiredQualifications: [{ qualification: 'BSc', status: 'demonstrated', evidence: 'BSc CS' }],
  preferredQualifications: [{ qualification: 'MSc', status: 'not-demonstrated', evidence: 'Not demonstrated in resume.' }],
  technicalSkills: [{ skill: 'Vue', proficiency: 'proficient', evidence: '3 years' }],
  relevantExperience: 'Mid-level engineer',
  certifications: [],
  strengths: ['Vue proficient'],
  gaps: ['No cloud experience'],
  interviewQuestions: ['Why Vue?'],
  candidateSummary: 'Good mid-level candidate.',
  evidence: ['3 years Vue'],
};

const report: ConsolidatedReport = {
  jobTitle: 'Senior Engineer',
  date: new Date().toISOString(),
  numberOfCandidates: 2,
  executiveSummary: 'Alice leads, Bob follows.',
  candidateRanking: [
    { rank: 1, candidateName: 'Alice', overallScore: 88, recommendation: 'Strong Match' },
    { rank: 2, candidateName: 'Bob', overallScore: 72, recommendation: 'Good Match' },
  ],
  qualificationComparison: [],
  scoringBreakdown: [],
  individualEvaluations: [],
  strongestCandidates: ['Alice'],
  candidatesRequiringAdditionalReview: ['Bob'],
  commonSkillGaps: [],
  interviewFocusAreas: [],
  recommendedInterviewOrder: ['Alice', 'Bob'],
  finalHiringManagerSummary: 'Talk to Alice first.',
};

describe('Candidate Evaluation', () => {
  it('evaluates a candidate with mocked provider', async () => {
    const provider = createMockProvider([candidateA], report);
    const extraction: ExtractionResult = {
      file: { originalName: 'alice.pdf', sanitizedName: 'alice.pdf', mimeType: 'application/pdf', size: 0, path: '/tmp/alice.pdf' },
      text: 'Alice has 5 years React experience.',
      success: true,
    };

    const result = await evaluateCandidate({
      jobDescription: 'Need senior React engineer.',
      resume: extraction,
      prompt: 'Evaluate candidate.',
      provider,
      temperature: 0.2,
      maxTokens: 1000,
      maxRetries: 0,
    });

    expect(result.candidateName).toBe('Alice');
    expect(result.overallScore).toBe(88);
  });

  it('handles extraction failure gracefully', async () => {
    const provider = createMockProvider([], report);
    const extraction: ExtractionResult = {
      file: { originalName: 'bad.pdf', sanitizedName: 'bad.pdf', mimeType: 'application/pdf', size: 0, path: '/tmp/bad.pdf' },
      text: '',
      success: false,
      error: 'PDF corrupted',
    };

    const result = await evaluateCandidate({
      jobDescription: 'Need senior React engineer.',
      resume: extraction,
      prompt: 'Evaluate candidate.',
      provider,
      temperature: 0.2,
      maxTokens: 1000,
      maxRetries: 0,
    });

    expect(result.error).toBe('PDF corrupted');
    expect(result.overallScore).toBe(0);
    expect(result.overallScore).toBe(0);
  });
});

describe('Consolidation', () => {
  it('produces a consolidated report', async () => {
    const provider = createMockProvider([], report);
    const result = await consolidateEvaluations({
      jobDescription: 'Need senior React engineer.',
      candidateEvaluations: [candidateA, candidateB],
      prompt: 'Consolidate.',
      provider,
      temperature: 0.2,
      maxTokens: 2000,
      maxRetries: 0,
      jobTitle: 'Senior Engineer',
    });

    expect(result.candidateRanking[0].candidateName).toBe('Alice');
    expect(result.candidateRanking[1].candidateName).toBe('Bob');
  });
});
