import { z } from 'zod';

export const QualificationItemSchema = z.object({
  qualification: z.string().min(1),
  status: z.enum(['demonstrated', 'not-demonstrated', 'partial', 'unknown']),
  evidence: z.string(),
});

export const TechnicalSkillSchema = z.object({
  skill: z.string().min(1),
  proficiency: z.enum(['expert', 'proficient', 'familiar', 'not-demonstrated', 'unknown']),
  evidence: z.string(),
});

export const CandidateEvaluationSchema = z.object({
  candidateName: z.string().min(1).max(200),
  overallScore: z.number().int().min(0).max(100),
  recommendation: z.enum([
    'Exceptional Match',
    'Strong Match',
    'Good Match',
    'Potential Match',
    'Weak Match',
  ]),
  requiredQualifications: z.array(QualificationItemSchema).default([]),
  preferredQualifications: z.array(QualificationItemSchema).default([]),
  technicalSkills: z.array(TechnicalSkillSchema).default([]),
  relevantExperience: z.string().default(''),
  certifications: z.array(z.string()).default([]),
  strengths: z.array(z.string()).default([]),
  gaps: z.array(z.string()).default([]),
  interviewQuestions: z.array(z.string()).default([]),
  candidateSummary: z.string().default(''),
  evidence: z.array(z.string()).default([]),
  error: z.string().optional(),
});

export type CandidateEvaluation = z.infer<typeof CandidateEvaluationSchema>;
export type QualificationItem = z.infer<typeof QualificationItemSchema>;
export type TechnicalSkill = z.infer<typeof TechnicalSkillSchema>;
