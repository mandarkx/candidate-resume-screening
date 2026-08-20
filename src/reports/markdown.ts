import type { ConsolidatedReport, CandidateEvaluation } from '../shared/types.js';

export function generateMarkdown(report: ConsolidatedReport): string {
  const lines: string[] = [];

  lines.push(`# Candidate Screening Report`);
  lines.push(`**Job Title:** ${report.jobTitle}`);
  lines.push(`**Date:** ${report.date}`);
  lines.push(`**Candidates Evaluated:** ${report.numberOfCandidates}`);
  lines.push(` `);

  lines.push(`> **Disclaimer:** This report is a decision-support tool. Final hiring decisions require human review and should not be based solely on automated scores.`);
  lines.push(` `);

  lines.push(`## Executive Summary`);
  lines.push(report.executiveSummary);
  lines.push(` `);

  lines.push(`## Candidate Ranking`);
  lines.push(`| Rank | Candidate | Score | Recommendation |`);
  lines.push(`|------|-----------|-------|----------------|`);
  for (const row of report.candidateRanking) {
    lines.push(`| ${row.rank} | ${escapeMd(row.candidateName)} | ${row.overallScore} | ${row.recommendation} |`);
  }
  lines.push(` `);

  lines.push(`## Qualification Comparison`);
  lines.push(`| Candidate | Required Met | Preferred Met | Top Skills |`);
  lines.push(`|-----------|--------------|---------------|------------|`);
  for (const row of report.qualificationComparison) {
    lines.push(`| ${escapeMd(row.candidateName)} | ${row.requiredMet}/${row.requiredTotal} | ${row.preferredMet}/${row.preferredTotal} | ${row.topSkills.join(', ')} |`);
  }
  lines.push(` `);

  lines.push(`## Scoring Breakdown`);
  lines.push(`| Candidate | Score | Recommendation |`);
  lines.push(`|-----------|-------|----------------|`);
  for (const row of report.scoringBreakdown) {
    lines.push(`| ${escapeMd(row.candidateName)} | ${row.overallScore} | ${row.recommendation} |`);
  }
  lines.push(` `);

  lines.push(`## Strongest Candidates`);
  lines.push(report.strongestCandidates.length > 0 ? report.strongestCandidates.map((c) => `- ${c}`).join('\n') : 'None identified.');
  lines.push(` `);

  lines.push(`## Candidates Requiring Additional Review`);
  lines.push(report.candidatesRequiringAdditionalReview.length > 0 ? report.candidatesRequiringAdditionalReview.map((c) => `- ${c}`).join('\n') : 'None identified.');
  lines.push(` `);

  lines.push(`## Common Skill Gaps`);
  lines.push(report.commonSkillGaps.length > 0 ? report.commonSkillGaps.map((g) => `- ${g}`).join('\n') : 'None identified.');
  lines.push(` `);

  lines.push(`## Interview Focus Areas`);
  lines.push(report.interviewFocusAreas.length > 0 ? report.interviewFocusAreas.map((a) => `- ${a}`).join('\n') : 'None identified.');
  lines.push(` `);

  lines.push(`## Recommended Interview Order`);
  lines.push(report.recommendedInterviewOrder.length > 0 ? report.recommendedInterviewOrder.map((c, i) => `${i + 1}. ${c}`).join('\n') : 'No recommendations.');
  lines.push(` `);

  lines.push(`## Individual Candidate Evaluations`);
  for (const evalItem of report.individualEvaluations) {
    lines.push(`### ${escapeMd(evalItem.candidateName)} — ${evalItem.overallScore} — ${evalItem.recommendation}`);
    lines.push(`**Summary:** ${evalItem.candidateSummary || 'No summary provided.'}`);
    lines.push(` `);

    lines.push(`#### Required Qualifications`);
    lines.push(formatQualifications(evalItem.requiredQualifications));
    lines.push(` `);

    lines.push(`#### Preferred Qualifications`);
    lines.push(formatQualifications(evalItem.preferredQualifications));
    lines.push(` `);

    lines.push(`#### Technical Skills`);
    lines.push(formatTechnicalSkills(evalItem.technicalSkills));
    lines.push(` `);

    lines.push(`#### Relevant Experience`);
    lines.push(evalItem.relevantExperience || 'Not demonstrated in resume.');
    lines.push(` `);

    lines.push(`#### Certifications`);
    lines.push(evalItem.certifications.length > 0 ? evalItem.certifications.map((c) => `- ${c}`).join('\n') : 'None listed.');
    lines.push(` `);

    lines.push(`#### Strengths`);
    lines.push(evalItem.strengths.length > 0 ? evalItem.strengths.map((s) => `- ${s}`).join('\n') : 'None listed.');
    lines.push(` `);

    lines.push(`#### Gaps / Concerns`);
    lines.push(evalItem.gaps.length > 0 ? evalItem.gaps.map((g) => `- ${g}`).join('\n') : 'None identified.');
    lines.push(` `);

    lines.push(`#### Interview Questions`);
    lines.push(evalItem.interviewQuestions.length > 0 ? evalItem.interviewQuestions.map((q, i) => `${i + 1}. ${q}`).join('\n') : 'None generated.');
    lines.push(` `);

    lines.push(`#### Supporting Evidence`);
    lines.push(evalItem.evidence.length > 0 ? evalItem.evidence.map((e) => `- ${e}`).join('\n') : 'No explicit evidence extracted.');
    lines.push(` `);

    if (evalItem.error) {
      lines.push(`> **Processing Note:** ${evalItem.error}`);
      lines.push(` `);
    }
  }

  lines.push(`## Final Hiring Manager Summary`);
  lines.push(report.finalHiringManagerSummary);
  lines.push(` `);

  return lines.join('\n');
}

function escapeMd(text: string): string {
  return text.replace(/\|/g, '\\|');
}

function formatQualifications(items: CandidateEvaluation['requiredQualifications']): string {
  if (items.length === 0) return 'Not demonstrated in resume.';
  return items.map((item) => `- **${item.qualification}** — ${item.status} — ${item.evidence || 'No evidence provided.'}`).join('\n');
}

function formatTechnicalSkills(skills: CandidateEvaluation['technicalSkills']): string {
  if (skills.length === 0) return 'Not demonstrated in resume.';
  return skills.map((skill) => `- **${skill.skill}** — ${skill.proficiency} — ${skill.evidence || 'No evidence provided.'}`).join('\n');
}
