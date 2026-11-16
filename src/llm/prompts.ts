import type { EvaluationInput, ConsolidationInput } from './provider.js';

export function buildCandidatePrompt(input: EvaluationInput): string {
  return [
    '# EVALUATION PROMPT',
    input.prompt,
    '',
    '---',
    '# JOB DESCRIPTION',
    input.jobDescription,
    '',
    '---',
    '# CANDIDATE RESUME',
    input.resumeText,
    '',
    '---',
    '# REQUIRED OUTPUT SCHEMA',
    JSON.stringify(getCandidateSchemaDescription(), null, 2),
    '',
    'Return only a valid JSON object matching the schema.',
  ].join('\n');
}

export function buildConsolidationPrompt(input: ConsolidationInput): string {
  return [
    '# EVALUATION PROMPT',
    input.prompt,
    '',
    '---',
    '# JOB DESCRIPTION',
    input.jobDescription,
    '',
    '---',
    '# CANDIDATE EVALUATIONS',
    JSON.stringify(input.candidateEvaluations, null, 2),
    '',
    '---',
    '# REQUIRED OUTPUT SCHEMA',
    JSON.stringify(getReportSchemaDescription(), null, 2),
    '',
    'Return only a valid JSON object matching the schema.',
  ].join('\n');
}

function getCandidateSchemaDescription(): Record<string, unknown> {
  return {
    candidateName: 'string',
    overallScore: 'number 0-100',
    recommendation: 'one of: Exceptional Match, Strong Match, Good Match, Potential Match, Weak Match',
    requiredQualifications: [{ qualification: 'string', status: 'demonstrated | not-demonstrated | partial | unknown', evidence: 'string' }],
    preferredQualifications: [{ qualification: 'string', status: 'demonstrated | not-demonstrated | partial | unknown', evidence: 'string' }],
    technicalSkills: [{ skill: 'string', proficiency: 'expert | proficient | familiar | not-demonstrated | unknown', evidence: 'string' }],
    relevantExperience: 'string',
    certifications: ['string'],
    strengths: ['string'],
    gaps: ['string'],
    interviewQuestions: ['string'],
    candidateSummary: 'string',
    evidence: ['string'],
  };
}

function getReportSchemaDescription(): Record<string, unknown> {
  return {
    jobTitle: 'string',
    date: 'string',
    numberOfCandidates: 'number',
    executiveSummary: 'string',
    candidateRanking: [{ rank: 'number', candidateName: 'string', overallScore: 'number 0-100', recommendation: 'string' }],
    qualificationComparison: [{ candidateName: 'string', requiredMet: 'number', requiredTotal: 'number', preferredMet: 'number', preferredTotal: 'number', topSkills: ['string'] }],
    scoringBreakdown: [{ candidateName: 'string', overallScore: 'number', recommendation: 'string' }],
    individualEvaluations: ['CandidateEvaluation objects'],
    strongestCandidates: ['string'],
    candidatesRequiringAdditionalReview: ['string'],
    commonSkillGaps: ['string'],
    interviewFocusAreas: ['string'],
    recommendedInterviewOrder: ['string'],
    finalHiringManagerSummary: 'string',
  };
}
