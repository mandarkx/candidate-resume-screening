import { describe, it, expect } from 'vitest';
import { CandidateEvaluationSchema } from '../src/schemas/candidate.js';
import { ConsolidatedReportSchema } from '../src/schemas/report.js';

describe('Candidate Evaluation Schema', () => {
  it('validates a complete evaluation', () => {
    const data = {
      candidateName: 'Jane Smith',
      overallScore: 85,
      recommendation: 'Strong Match',
      requiredQualifications: [{ qualification: 'BSc', status: 'demonstrated', evidence: 'BSc CS' }],
      preferredQualifications: [{ qualification: 'MSc', status: 'not-demonstrated', evidence: 'Not demonstrated in resume.' }],
      technicalSkills: [{ skill: 'React', proficiency: 'proficient', evidence: 'Used at Acme' }],
      relevantExperience: '5 years building web apps',
      certifications: ['AWS Certified'],
      strengths: ['Strong communication'],
      gaps: ['No leadership experience'],
      interviewQuestions: ['Tell me about a hard bug.'],
      candidateSummary: 'Strong candidate',
      evidence: ['Resume states 5 years React.'],
    };

    const result = CandidateEvaluationSchema.safeParse(data);
    expect(result.success).toBe(true);
  });

  it('rejects an out-of-range score', () => {
    const data = {
      candidateName: 'Jane Smith',
      overallScore: 150,
      recommendation: 'Strong Match',
    };
    const result = CandidateEvaluationSchema.safeParse(data);
    expect(result.success).toBe(false);
  });

  it('rejects an invalid recommendation', () => {
    const data = {
      candidateName: 'Jane Smith',
      overallScore: 85,
      recommendation: 'Great Match',
    };
    const result = CandidateEvaluationSchema.safeParse(data);
    expect(result.success).toBe(false);
  });
});

describe('Consolidated Report Schema', () => {
  it('validates a complete consolidated report', () => {
    const data = {
      jobTitle: 'Senior Engineer',
      date: new Date().toISOString(),
      numberOfCandidates: 1,
      executiveSummary: 'Summary',
      candidateRanking: [{ rank: 1, candidateName: 'Jane Smith', overallScore: 85, recommendation: 'Strong Match' }],
      qualificationComparison: [{ candidateName: 'Jane Smith', requiredMet: 1, requiredTotal: 1, preferredMet: 0, preferredTotal: 1, topSkills: ['React'] }],
      scoringBreakdown: [{ candidateName: 'Jane Smith', overallScore: 85, recommendation: 'Strong Match' }],
      individualEvaluations: [{
        candidateName: 'Jane Smith',
        overallScore: 85,
        recommendation: 'Strong Match',
        requiredQualifications: [],
        preferredQualifications: [],
        technicalSkills: [],
        relevantExperience: '',
        certifications: [],
        strengths: [],
        gaps: [],
        interviewQuestions: [],
        candidateSummary: '',
        evidence: [],
      }],
      strongestCandidates: ['Jane Smith'],
      candidatesRequiringAdditionalReview: [],
      commonSkillGaps: [],
      interviewFocusAreas: [],
      recommendedInterviewOrder: ['Jane Smith'],
      finalHiringManagerSummary: 'Hire Jane.',
    };

    const result = ConsolidatedReportSchema.safeParse(data);
    expect(result.success).toBe(true);
  });
});
