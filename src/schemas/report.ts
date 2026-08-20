import { z } from 'zod';
import { CandidateEvaluationSchema } from './candidate.js';

export const CandidateRankingEntrySchema = z.object({
  rank: z.number().int().min(1),
  candidateName: z.string().min(1),
  overallScore: z.number().int().min(0).max(100),
  recommendation: z.string().min(1),
});

export const QualificationComparisonSchema = z.object({
  candidateName: z.string().min(1),
  requiredMet: z.number().int().min(0),
  requiredTotal: z.number().int().min(0),
  preferredMet: z.number().int().min(0),
  preferredTotal: z.number().int().min(0),
  topSkills: z.array(z.string()).default([]),
});

export const ScoringBreakdownSchema = z.object({
  candidateName: z.string().min(1),
  overallScore: z.number().int().min(0).max(100),
  recommendation: z.string().min(1),
});

export const ConsolidatedReportSchema = z.object({
  jobTitle: z.string().min(1),
  date: z.string().min(1),
  numberOfCandidates: z.number().int().min(0),
  executiveSummary: z.string().min(1),
  candidateRanking: z.array(CandidateRankingEntrySchema),
  qualificationComparison: z.array(QualificationComparisonSchema),
  scoringBreakdown: z.array(ScoringBreakdownSchema),
  individualEvaluations: z.array(CandidateEvaluationSchema),
  strongestCandidates: z.array(z.string()).default([]),
  candidatesRequiringAdditionalReview: z.array(z.string()).default([]),
  commonSkillGaps: z.array(z.string()).default([]),
  interviewFocusAreas: z.array(z.string()).default([]),
  recommendedInterviewOrder: z.array(z.string()).default([]),
  finalHiringManagerSummary: z.string().min(1),
});

export type ConsolidatedReport = z.infer<typeof ConsolidatedReportSchema>;
export type CandidateRankingEntry = z.infer<typeof CandidateRankingEntrySchema>;
export type QualificationComparison = z.infer<typeof QualificationComparisonSchema>;
export type ScoringBreakdown = z.infer<typeof ScoringBreakdownSchema>;
