import type { EvaluationRun } from '../../shared/types';

interface StatusBarProps {
  run: EvaluationRun | null;
}

export default function StatusBar({ run }: StatusBarProps) {
  if (!run) return <div className="status-bar">Starting evaluation...</div>;

  const total = run.resumes.length || 1;
  const processed = run.candidateEvaluations.length;
  const progress = Math.round((processed / total) * 100);

  return (
    <div className="status-bar">
      <p>Status: <strong>{run.status}</strong></p>
      <p>Processing: {run.currentCandidate || '...'}</p>
      <div className="progress-track">
        <div className="progress-fill" style={{ width: `${progress}%` }} />
      </div>
      <p>{processed} of {total} candidates evaluated</p>
      {run.warnings.length > 0 && (
        <ul className="warnings">
          {run.warnings.map((w, i) => <li key={i}>{w}</li>)}
        </ul>
      )}
    </div>
  );
}
