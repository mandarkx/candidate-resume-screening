import { useCallback, useEffect, useState } from 'react';
import UploadSection from './components/UploadSection';
import ResultsPanel from './components/ResultsPanel';
import StatusBar from './components/StatusBar';
import type { EvaluationRun, PromptTemplate } from '../shared/types';

const API_BASE = '/api';

export default function App() {
  const [templates, setTemplates] = useState<PromptTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [jdFile, setJdFile] = useState<File | null>(null);
  const [resumes, setResumes] = useState<File[]>([]);
  const [jobTitle, setJobTitle] = useState('');
  const [runId, setRunId] = useState<string | null>(null);
  const [run, setRun] = useState<EvaluationRun | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`${API_BASE}/templates`)
      .then((res) => res.json())
      .then((data) => {
        setTemplates(data.templates || []);
        if (data.templates?.length > 0) {
          setSelectedTemplate(data.templates[0].id);
        }
      })
      .catch((err) => setError(`Failed to load templates: ${err.message}`));
  }, []);

  useEffect(() => {
    if (!runId) return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`${API_BASE}/evaluations/${runId}`);
        const data = await res.json();
        setRun(data);
        if (data.status === 'completed' || data.status === 'failed' || data.status === 'partial') {
          clearInterval(interval);
          setLoading(false);
        }
      } catch (err) {
        setError(`Polling failed: ${(err as Error).message}`);
        clearInterval(interval);
        setLoading(false);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [runId]);

  const handleAnalyze = useCallback(async () => {
    if (!jdFile || resumes.length === 0 || !selectedTemplate) {
      setError('Please upload a Job Description, at least one resume, and select a template.');
      return;
    }

    setLoading(true);
    setError(null);
    setRun(null);

    const formData = new FormData();
    formData.append('jobDescription', jdFile);
    resumes.forEach((r) => formData.append('resumes', r));
    formData.append('templateId', selectedTemplate);
    if (jobTitle) formData.append('jobTitle', jobTitle);

    try {
      const res = await fetch(`${API_BASE}/evaluations`, {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to start evaluation');
      }
      setRunId(data.id);
    } catch (err) {
      setError((err as Error).message);
      setLoading(false);
    }
  }, [jdFile, resumes, selectedTemplate, jobTitle]);

  const downloadReport = (format: 'markdown' | 'pdf') => {
    if (!runId) return;
    const url = `${API_BASE}/evaluations/${runId}/report?format=${format}`;
    window.open(url, '_blank');
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>Resume Screener</h1>
        <p>AI-powered candidate screening. Final hiring decisions require human review.</p>
      </header>

      <main className="app-main">
        <div className="panel">
          <h2>1. Job Description</h2>
          <UploadSection
            accept=".pdf,.docx"
            multiple={false}
            onFiles={(files) => setJdFile(files[0] || null)}
          />
          {jdFile && <p className="file-label">Selected: {jdFile.name}</p>}

          <h2>2. Candidate Resumes</h2>
          <UploadSection
            accept=".pdf,.docx"
            multiple
            onFiles={setResumes}
          />
          {resumes.length > 0 && (
            <ul className="file-list">
              {resumes.map((r) => (
                <li key={r.name}>{r.name}</li>
              ))}
            </ul>
          )}

          <h2>3. Evaluation Template</h2>
          <label className="field-label">
            Template
            <select
              value={selectedTemplate}
              onChange={(e) => setSelectedTemplate(e.target.value)}
              disabled={templates.length === 0}
            >
              {templates.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </label>

          <h2>4. Job Title (optional)</h2>
          <label className="field-label">
            Job Title
            <input
              type="text"
              value={jobTitle}
              onChange={(e) => setJobTitle(e.target.value)}
              placeholder="e.g. Senior Software Engineer"
            />
          </label>

          <button
            className="primary-button"
            onClick={handleAnalyze}
            disabled={loading || !jdFile || resumes.length === 0 || !selectedTemplate}
          >
            {loading ? 'Analyzing...' : 'Analyze Candidates'}
          </button>

          {error && <div className="error-box">{error}</div>}
        </div>

        {loading && <StatusBar run={run} />}
        {run && <ResultsPanel run={run} onDownload={downloadReport} />}
      </main>
    </div>
  );
}
