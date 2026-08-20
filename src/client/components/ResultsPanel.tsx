import type { EvaluationRun } from '../../shared/types';

interface ResultsPanelProps {
  run: EvaluationRun;
  onDownload: (format: 'markdown' | 'pdf') => void;
}

export default function ResultsPanel({ run, onDownload }: ResultsPanelProps) {
  if (!run.report) {
    return (
      <div className="results-panel">
        <h2>Processing...</h2>
        <p>Individual candidates: {run.candidateEvaluations.length}</p>
        {run.errors.map((e, i) => (
          <div key={i} className="error-box">{e}</div>
        ))}
      </div>
    );
  }

  const { report } = run;

  return (
    <div className="results-panel">
      <h2>Results</h2>

      <h3>Candidate Ranking</h3>
      <table className="ranking-table">
        <thead>
          <tr>
            <th>Rank</th>
            <th>Candidate</th>
            <th>Score</th>
            <th>Recommendation</th>
          </tr>
        </thead>
        <tbody>
          {report.candidateRanking.map((row) => (
            <tr key={row.rank}>
              <td>{row.rank}</td>
              <td>{row.candidateName}</td>
              <td>{row.overallScore}</td>
              <td>{row.recommendation}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h3>Strongest Candidates</h3>
      <ul>
        {report.strongestCandidates.length > 0 ? report.strongestCandidates.map((c) => <li key={c}>{c}</li>) : <li>None identified</li>}
      </ul>

      <h3>Recommended Interview Order</h3>
      <ol>
        {report.recommendedInterviewOrder.map((c, i) => <li key={i}>{c}</li>)}
      </ol>

      <h3>Common Skill Gaps</h3>
      <ul>
        {report.commonSkillGaps.length > 0 ? report.commonSkillGaps.map((g, i) => <li key={i}>{g}</li>) : <li>None identified</li>}
      </ul>

      <h3>Individual Evaluations</h3>
      {report.individualEvaluations.map((ev) => (
        <div key={ev.candidateName} className="candidate-card">
          <h4>{ev.candidateName} — {ev.overallScore} — {ev.recommendation}</h4>
          <p>{ev.candidateSummary}</p>
          <p><strong>Strengths:</strong> {ev.strengths.join(', ') || 'None listed'}</p>
          <p><strong>Gaps:</strong> {ev.gaps.join(', ') || 'None identified'}</p>
        </div>
      ))}

      <div className="download-bar">
        <button onClick={() => onDownload('markdown')}>Download Markdown</button>
        <button onClick={() => onDownload('pdf')}>Download PDF</button>
      </div>

      <div className="disclaimer">
        <strong>Disclaimer:</strong> This report is decision-support only. Final hiring decisions require human review.
      </div>
    </div>
  );
}
