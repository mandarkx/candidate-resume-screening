import fs from 'node:fs';
import path from 'node:path';

const API = 'http://localhost:3000/api';
const sampleDir = path.resolve(process.cwd(), 'sample-docs');

function fileToBlob(filePath: string, mime: string) {
  return new Blob([fs.readFileSync(filePath)], { type: mime });
}

async function main() {
  // Health
  const health = await fetch(`${API}/health`);
  console.log('Health:', await health.json());

  // Templates
  const templates = await fetch(`${API}/templates`);
  console.log('Templates:', await templates.json());

  // Submit evaluation
  const form = new FormData();
  form.append('jobDescription', fileToBlob(path.join(sampleDir, 'sample-jd.docx'), 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'), 'sample-jd.docx');
  form.append('resumes', fileToBlob(path.join(sampleDir, 'sample-resume-a.pdf'), 'application/pdf'), 'sample-resume-a.pdf');
  form.append('resumes', fileToBlob(path.join(sampleDir, 'sample-resume-b.pdf'), 'application/pdf'), 'sample-resume-b.pdf');
  form.append('templateId', 'candidate-evaluation');
  form.append('jobTitle', 'Senior Software Engineer');

  const res = await fetch(`${API}/evaluations`, { method: 'POST', body: form as any });
  console.log('Submit status:', res.status);
  const resBody = await res.json() as any;
  console.log('Submit body:', resBody);
  const id = resBody.id;
  const status = resBody.status;

  for (let i = 0; i < 60; i++) {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    const runRes = await fetch(`${API}/evaluations/${id}`);
    const run = await runRes.json() as any;
    console.log(`Poll ${i + 1}: ${run.status}, candidates: ${run.candidateEvaluations?.length || 0}`);
    if (run.status === 'completed' || run.status === 'partial' || run.status === 'failed') {
      console.log('Final ranking:', run.report?.candidateRanking);
      console.log('Report markdown length:', run.report ? JSON.stringify(run.report).length : 0);

      const md = await fetch(`${API}/evaluations/${id}/report?format=markdown`);
      if (md.ok) {
        const text = await md.text();
        console.log('Markdown report preview:', text.slice(0, 500));
      } else {
        console.error('Failed to download report:', await md.text());
      }
      return;
    }
  }

  console.error('API e2e timed out');
  process.exit(1);
}

main().catch((e) => { console.error(e); process.exit(1); });
