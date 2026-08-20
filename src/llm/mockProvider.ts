import type { LLMProvider, EvaluationInput, ConsolidationInput } from './provider.js';
import type { CandidateEvaluation } from '../schemas/candidate.js';
import type { ConsolidatedReport } from '../schemas/report.js';

const SKILL_KEYWORDS = [
  'typescript', 'javascript', 'react', 'node', 'nodejs', 'python', 'java', 'go', 'rust',
  'aws', 'azure', 'gcp', 'docker', 'kubernetes', 'terraform', 'sql', 'postgresql', 'mongodb',
  'ci/cd', 'devops', 'machine learning', 'ai', 'cloud', 'linux', 'agile', 'scrum',
];

export class MockProvider implements LLMProvider {
  async evaluateCandidate(input: EvaluationInput): Promise<CandidateEvaluation> {
    const lines = input.resumeText.split('\n').map((l) => l.trim()).filter(Boolean);
    const candidateName = lines[0] || 'Unknown Candidate';

    const foundSkills = SKILL_KEYWORDS
      .filter((keyword) => input.resumeText.toLowerCase().includes(keyword))
      .map((keyword) => keyword.charAt(0).toUpperCase() + keyword.slice(1));

    const technicalSkills = foundSkills.slice(0, 6).map((skill) => ({
      skill,
      proficiency: 'proficient' as const,
      evidence: `Mentioned in resume.`,
    }));

    const score = Math.min(95, 50 + foundSkills.length * 8);
    let recommendation: CandidateEvaluation['recommendation'] = 'Potential Match';
    if (score >= 90) recommendation = 'Exceptional Match';
    else if (score >= 80) recommendation = 'Strong Match';
    else if (score >= 70) recommendation = 'Good Match';
    else if (score >= 60) recommendation = 'Potential Match';
    else recommendation = 'Weak Match';

    const requiredQualifications = this.extractQualifications(input.jobDescription, input.resumeText, 'required');
    const preferredQualifications = this.extractQualifications(input.jobDescription, input.resumeText, 'preferred');

    return {
      candidateName,
      overallScore: score,
      recommendation,
      requiredQualifications,
      preferredQualifications,
      technicalSkills,
      relevantExperience: `${candidateName} has experience relevant to the role based on the resume text.`,
      certifications: [],
      strengths: foundSkills.length > 0 ? [`Proficiency in ${foundSkills[0]}`] : ['Relevant background'],
      gaps: foundSkills.length === 0 ? ['No clearly stated technical skills'] : [],
      interviewQuestions: [
        `Can you describe a project where you used ${foundSkills[0] || 'your primary skill'}?`,
        'What motivated you to apply for this role?',
      ],
      candidateSummary: `Mock evaluation: ${candidateName} scored ${score}/100 with skills ${foundSkills.join(', ') || 'none detected'}.`,
      evidence: lines.slice(0, 3),
    };
  }

  async consolidate(input: ConsolidationInput): Promise<ConsolidatedReport> {
    const sorted = [...input.candidateEvaluations].sort((a, b) => b.overallScore - a.overallScore);
    const now = new Date().toISOString();

    return {
      jobTitle: 'Mock Job Title',
      date: now,
      numberOfCandidates: sorted.length,
      executiveSummary: `Mock consolidated report for ${sorted.length} candidates.`,
      candidateRanking: sorted.map((e, i) => ({
        rank: i + 1,
        candidateName: e.candidateName,
        overallScore: e.overallScore,
        recommendation: e.recommendation,
      })),
      qualificationComparison: sorted.map((e) => ({
        candidateName: e.candidateName,
        requiredMet: e.requiredQualifications.filter((q) => q.status === 'demonstrated' || q.status === 'partial').length,
        requiredTotal: Math.max(e.requiredQualifications.length, 1),
        preferredMet: e.preferredQualifications.filter((q) => q.status === 'demonstrated' || q.status === 'partial').length,
        preferredTotal: Math.max(e.preferredQualifications.length, 1),
        topSkills: e.technicalSkills.map((s) => s.skill).slice(0, 5),
      })),
      scoringBreakdown: sorted.map((e) => ({
        candidateName: e.candidateName,
        overallScore: e.overallScore,
        recommendation: e.recommendation,
      })),
      individualEvaluations: sorted,
      strongestCandidates: sorted.filter((e) => e.overallScore >= 80).map((e) => e.candidateName),
      candidatesRequiringAdditionalReview: sorted.filter((e) => e.overallScore >= 60 && e.overallScore < 80).map((e) => e.candidateName),
      commonSkillGaps: [],
      interviewFocusAreas: ['Verify technical depth in interviews.'],
      recommendedInterviewOrder: sorted.map((e) => e.candidateName),
      finalHiringManagerSummary: `Top candidates: ${sorted.slice(0, 3).map((e) => `${e.candidateName} (${e.overallScore})`).join(', ')}. Final hiring decisions require human review.`,
    };
  }

  private extractQualifications(jd: string, resume: string, _type: 'required' | 'preferred'): CandidateEvaluation['requiredQualifications'] {
    const keywords = this.extractKeywordPhrases(jd);
    return keywords.slice(0, 5).map((qualification) => {
      const demonstrated = resume.toLowerCase().includes(qualification.toLowerCase());
      return {
        qualification,
        status: demonstrated ? ('demonstrated' as const) : ('not-demonstrated' as const),
        evidence: demonstrated ? 'Mentioned in resume.' : 'Not demonstrated in resume.',
      };
    });
  }

  private extractKeywordPhrases(text: string): string[] {
    const sentences = text.split(/[.\n]/).map((s) => s.trim()).filter((s) => s.length > 3);
    const phrases: string[] = [];
    for (const sentence of sentences) {
      const lower = sentence.toLowerCase();
      if (lower.includes('experience') || lower.includes('skill') || lower.includes('familiar') || lower.includes('proficiency')) {
        const cleaned = sentence.replace(/^[\s*-]+/, '').replace(/\s+/g, ' ');
        if (cleaned.length > 5) phrases.push(cleaned);
      }
    }
    return phrases.length > 0 ? phrases : ['Relevant background'];
  }
}
