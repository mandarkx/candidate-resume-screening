import { describe, it, expect } from 'vitest';
import { generateMarkdown } from '../src/reports/markdown.js';
import { generatePdfBuffer } from '../src/reports/pdf.js';
import type { ConsolidatedReport } from '../src/shared/types.js';

const sampleReport: ConsolidatedReport = {
  jobTitle: 'Senior Engineer',
  date: new Date().toISOString(),
  numberOfCandidates: 2,
  executiveSummary: 'Two candidates evaluated.',
  candidateRanking: [
    { rank: 1, candidateName: 'Alice', overallScore: 88, recommendation: 'Strong Match' },
    { rank: 2, candidateName: 'Bob', overallScore: 72, recommendation: 'Good Match' },
  ],
  qualificationComparison: [
    { candidateName: 'Alice', requiredMet: 2, requiredTotal: 2, preferredMet: 0, preferredTotal: 1, topSkills: ['React'] },
    { candidateName: 'Bob', requiredMet: 2, requiredTotal: 2, preferredMet: 0, preferredTotal: 1, topSkills: ['Vue'] },
  ],
  scoringBreakdown: [
    { candidateName: 'Alice', overallScore: 88, recommendation: 'Strong Match' },
    { candidateName: 'Bob', overallScore: 72, recommendation: 'Good Match' },
  ],
  individualEvaluations: [
    {
      candidateName: 'Alice',
      overallScore: 88,
      recommendation: 'Strong Match',
      requiredQualifications: [{ qualification: 'BSc', status: 'demonstrated', evidence: 'BSc CS' }],
      preferredQualifications: [],
      technicalSkills: [{ skill: 'React', proficiency: 'expert', evidence: '5 years' }],
      relevantExperience: 'Senior engineer',
      certifications: ['AWS'],
      strengths: ['React expert'],
      gaps: ['No Python'],
      interviewQuestions: ['Why React?'],
      candidateSummary: 'Strong front-end engineer.',
      evidence: ['5 years React'],
    },
    {
      candidateName: 'Bob',
      overallScore: 72,
      recommendation: 'Good Match',
      requiredQualifications: [{ qualification: 'BSc', status: 'demonstrated', evidence: 'BSc CS' }],
      preferredQualifications: [],
      technicalSkills: [{ skill: 'Vue', proficiency: 'proficient', evidence: '3 years' }],
      relevantExperience: 'Mid-level engineer',
      certifications: [],
      strengths: ['Vue proficient'],
      gaps: ['No cloud experience'],
      interviewQuestions: ['Why Vue?'],
      candidateSummary: 'Good mid-level candidate.',
      evidence: ['3 years Vue'],
    },
  ],
  strongestCandidates: ['Alice'],
  candidatesRequiringAdditionalReview: ['Bob'],
  commonSkillGaps: ['No Python'],
  interviewFocusAreas: ['React depth'],
  recommendedInterviewOrder: ['Alice', 'Bob'],
  finalHiringManagerSummary: 'Talk to Alice first.',
};

describe('Report Generation', () => {
  it('generates a Markdown report', () => {
    const markdown = generateMarkdown(sampleReport);
    expect(markdown).toContain('# Candidate Screening Report');
    expect(markdown).toContain('Alice');
    expect(markdown).toContain('Bob');
    expect(markdown.toLowerCase()).toContain('disclaimer');
  });

  it('generates a PDF buffer', async () => {
    const pdf = await generatePdfBuffer(sampleReport);
    expect(pdf).toBeInstanceOf(Buffer);
    expect(pdf.length).toBeGreaterThan(100);
    expect(pdf.toString('binary').slice(0, 8)).toContain('%PDF');
  });
});
