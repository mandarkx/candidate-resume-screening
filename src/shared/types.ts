/**
 * Shared types used across the application.
 */

export interface UploadedFile {
  originalName: string;
  sanitizedName: string;
  mimeType: string;
  size: number;
  path: string;
  destination?: 'jd' | 'resume';
}

export interface ExtractionResult {
  file: UploadedFile;
  text: string;
  success: boolean;
  error?: string;
}

export interface PromptTemplate {
  id: string;
  name: string;
  description: string;
  filePath: string;
}

export type EvaluationStatus =
  | 'pending'
  | 'extracting'
  | 'evaluating'
  | 'consolidating'
  | 'completed'
  | 'failed'
  | 'partial';

export interface EvaluationRun {
  id: string;
  status: EvaluationStatus;
  createdAt: string;
  updatedAt: string;
  templateId: string;
  currentCandidate?: string;
  jobDescription?: ExtractionResult;
  resumes: ExtractionResult[];
  candidateEvaluations: CandidateEvaluation[];
  report?: ConsolidatedReport;
  errors: string[];
  warnings: string[];
}

export interface QualificationItem {
  qualification: string;
  status: 'demonstrated' | 'not-demonstrated' | 'partial' | 'unknown';
  evidence: string;
}

export interface CandidateEvaluation {
  candidateName: string;
  overallScore: number;
  recommendation:
    | 'Exceptional Match'
    | 'Strong Match'
    | 'Good Match'
    | 'Potential Match'
    | 'Weak Match';
  requiredQualifications: QualificationItem[];
  preferredQualifications: QualificationItem[];
  technicalSkills: {
    skill: string;
    proficiency: 'expert' | 'proficient' | 'familiar' | 'not-demonstrated' | 'unknown';
    evidence: string;
  }[];
  relevantExperience: string;
  certifications: string[];
  strengths: string[];
  gaps: string[];
  interviewQuestions: string[];
  candidateSummary: string;
  evidence: string[];
  error?: string;
}

export interface CandidateRankingEntry {
  rank: number;
  candidateName: string;
  overallScore: number;
  recommendation: string;
}

export interface ConsolidatedReport {
  jobTitle: string;
  date: string;
  numberOfCandidates: number;
  executiveSummary: string;
  candidateRanking: CandidateRankingEntry[];
  qualificationComparison: {
    candidateName: string;
    requiredMet: number;
    requiredTotal: number;
    preferredMet: number;
    preferredTotal: number;
    topSkills: string[];
  }[];
  scoringBreakdown: {
    candidateName: string;
    overallScore: number;
    recommendation: string;
  }[];
  individualEvaluations: CandidateEvaluation[];
  strongestCandidates: string[];
  candidatesRequiringAdditionalReview: string[];
  commonSkillGaps: string[];
  interviewFocusAreas: string[];
  recommendedInterviewOrder: string[];
  finalHiringManagerSummary: string;
}
