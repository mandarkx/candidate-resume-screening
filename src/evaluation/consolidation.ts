import type { LLMProvider } from '../llm/provider.js';
import type { CandidateEvaluation } from '../schemas/candidate.js';
import type { ConsolidatedReport } from '../schemas/report.js';
import { ConsolidatedReportSchema } from '../schemas/report.js';
import { toErrorMessage } from '../utils/text.js';

export interface ConsolidateOptions {
  jobDescription: string;
  candidateEvaluations: CandidateEvaluation[];
  prompt: string;
  provider: LLMProvider;
  temperature: number;
  maxTokens: number;
  maxRetries: number;
  jobTitle: string;
}

export async function consolidateEvaluations(options: ConsolidateOptions): Promise<ConsolidatedReport> {
  const { jobDescription, candidateEvaluations, prompt, provider, temperature, maxTokens, maxRetries, jobTitle } = options;

  let lastError: Error | undefined;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const result = await provider.consolidate({
        jobDescription,
        prompt,
        candidateEvaluations,
        temperature,
        maxTokens,
      });

      const parsed = ConsolidatedReportSchema.safeParse(result);
      if (!parsed.success) {
        throw new Error(`Consolidated report schema validation failed: ${parsed.error.message}`);
      }

      const data = parsed.data;

      // Ensure the report contains all candidates, even if the LLM omitted some.
      const reportNames = new Set(data.individualEvaluations.map((e) => e.candidateName));
      const missingEvaluations = candidateEvaluations.filter((e) => !reportNames.has(e.candidateName));
      if (missingEvaluations.length > 0) {
        data.individualEvaluations = [...data.individualEvaluations, ...missingEvaluations];
      }

      // Recompute ranking to ensure consistency if needed.
      const sorted = [...data.individualEvaluations].sort((a, b) => b.overallScore - a.overallScore);
      data.candidateRanking = sorted.map((e, i) => ({
        rank: i + 1,
        candidateName: e.candidateName,
        overallScore: e.overallScore,
        recommendation: e.recommendation,
      }));

      data.qualificationComparison = sorted.map((e) => ({
        candidateName: e.candidateName,
        requiredMet: e.requiredQualifications.filter((q) => q.status === 'demonstrated' || q.status === 'partial').length,
        requiredTotal: Math.max(e.requiredQualifications.length, 1),
        preferredMet: e.preferredQualifications.filter((q) => q.status === 'demonstrated' || q.status === 'partial').length,
        preferredTotal: Math.max(e.preferredQualifications.length, 1),
        topSkills: e.technicalSkills.filter((s) => s.proficiency !== 'not-demonstrated' && s.proficiency !== 'unknown').map((s) => s.skill).slice(0, 5),
      }));

      data.scoringBreakdown = sorted.map((e) => ({
        candidateName: e.candidateName,
        overallScore: e.overallScore,
        recommendation: e.recommendation,
      }));

      data.recommendedInterviewOrder = sorted.map((e) => e.candidateName);
      data.strongestCandidates = sorted.filter((e) => e.overallScore >= 80).map((e) => e.candidateName);
      data.candidatesRequiringAdditionalReview = sorted
        .filter((e) => e.overallScore >= 60 && e.overallScore < 80)
        .map((e) => e.candidateName);

      data.numberOfCandidates = candidateEvaluations.length;
      data.date = data.date || new Date().toISOString();
      data.jobTitle = jobTitle;

      return data;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(toErrorMessage(error));
      if (attempt < maxRetries) {
        await delay(500 * (attempt + 1));
      }
    }
  }

  return buildFallbackConsolidatedReport(jobTitle, candidateEvaluations, lastError?.message);
}

function buildFallbackConsolidatedReport(
  jobTitle: string,
  evaluations: CandidateEvaluation[],
  errorMessage?: string
): ConsolidatedReport {
  const sorted = [...evaluations].sort((a, b) => b.overallScore - a.overallScore);
  const ranking = sorted.map((e, i) => ({
    rank: i + 1,
    candidateName: e.candidateName,
    overallScore: e.overallScore,
    recommendation: e.recommendation,
  }));

  return {
    jobTitle,
    date: new Date().toISOString(),
    numberOfCandidates: evaluations.length,
    executiveSummary: `Consolidated report generated from ${evaluations.length} candidate evaluations. ${errorMessage ? `Consolidation step encountered an error: ${errorMessage}` : ''}`.trim(),
    candidateRanking: ranking,
    qualificationComparison: sorted.map((e) => ({
      candidateName: e.candidateName,
      requiredMet: e.requiredQualifications.filter((q) => q.status === 'demonstrated' || q.status === 'partial').length,
      requiredTotal: Math.max(e.requiredQualifications.length, 1),
      preferredMet: e.preferredQualifications.filter((q) => q.status === 'demonstrated' || q.status === 'partial').length,
      preferredTotal: Math.max(e.preferredQualifications.length, 1),
      topSkills: e.technicalSkills.filter((s) => s.proficiency !== 'not-demonstrated' && s.proficiency !== 'unknown').map((s) => s.skill).slice(0, 5),
    })),
    scoringBreakdown: sorted.map((e) => ({
      candidateName: e.candidateName,
      overallScore: e.overallScore,
      recommendation: e.recommendation,
    })),
    individualEvaluations: sorted,
    strongestCandidates: sorted.filter((e) => e.overallScore >= 80).map((e) => e.candidateName),
    candidatesRequiringAdditionalReview: sorted.filter((e) => e.overallScore >= 60 && e.overallScore < 80).map((e) => e.candidateName),
    commonSkillGaps: extractCommonSkillGaps(sorted),
    interviewFocusAreas: extractInterviewFocusAreas(sorted),
    recommendedInterviewOrder: sorted.map((e) => e.candidateName),
    finalHiringManagerSummary: `Review the ranked candidates. The strongest matches are: ${sorted
      .slice(0, 3)
      .map((e) => `${e.candidateName} (${e.overallScore})`)
      .join(', ') || 'none identified'}. Final hiring decisions require human review.`,
  };
}

function extractCommonSkillGaps(evaluations: CandidateEvaluation[]): string[] {
  const gapCounts: Record<string, number> = {};
  for (const e of evaluations) {
    for (const gap of e.gaps) {
      const key = gap.toLowerCase();
      gapCounts[key] = (gapCounts[key] || 0) + 1;
    }
  }
  return Object.entries(gapCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([gap, count]) => `${gap} (${count} candidate${count > 1 ? 's' : ''})`);
}

function extractInterviewFocusAreas(evaluations: CandidateEvaluation[]): string[] {
  const focus = new Set<string>();
  for (const e of evaluations) {
    for (const q of e.interviewQuestions) {
      focus.add(q);
    }
  }
  return Array.from(focus).slice(0, 8);
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
