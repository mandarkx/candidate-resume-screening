import fs from 'node:fs/promises';
import path from 'node:path';

// Set mock LLM environment for end-to-end validation.
process.env.LLM_PROVIDER = 'mock';
process.env.LLM_API_KEY = 'mock-key';
process.env.LLM_MODEL = 'mock';
process.env.OUTPUT_DIR = './output';
process.env.UPLOAD_DIR = './uploads';

const { startPipeline } = await import('../src/evaluation/pipeline.js');

const sampleDir = path.resolve(process.cwd(), 'sample-docs');

async function fileToUploaded(filePath: string, destination: 'jd' | 'resume') {
  const stats = await fs.stat(filePath);
  const mime = filePath.endsWith('.pdf') ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
  return {
    originalName: path.basename(filePath),
    sanitizedName: path.basename(filePath),
    mimeType: mime,
    size: stats.size,
    path: filePath,
    destination,
  };
}

async function main() {
  const jdFile = path.join(sampleDir, 'sample-jd.docx');
  const resumeA = path.join(sampleDir, 'sample-resume-a.pdf');
  const resumeB = path.join(sampleDir, 'sample-resume-b.pdf');

  const run = await startPipeline({
    jobDescriptionFile: await fileToUploaded(jdFile, 'jd'),
    resumeFiles: [
      await fileToUploaded(resumeA, 'resume'),
      await fileToUploaded(resumeB, 'resume'),
    ],
    templateId: 'candidate-evaluation',
    jobTitle: 'Senior Software Engineer',
  });

  console.log(`Started evaluation run: ${run.id}`);

  const { getRun } = await import('../src/evaluation/pipeline.js');
  for (let i = 0; i < 30; i++) {
    await new Promise((resolve) => setTimeout(resolve, 500));
    const updated = await getRun(run.id);
    if (!updated) continue;
    console.log(`Status: ${updated.status}, candidates: ${updated.candidateEvaluations.length}`);
    if (updated.status === 'completed' || updated.status === 'partial' || updated.status === 'failed') {
      console.log('\n=== CANDIDATE RANKING ===');
      console.log(updated.report?.candidateRanking);
      console.log('\n=== FINAL SUMMARY ===');
      console.log(updated.report?.finalHiringManagerSummary);

      const reportMd = path.join(process.env.OUTPUT_DIR!, 'reports', `report-${run.id}.md`);
      const reportPdf = path.join(process.env.OUTPUT_DIR!, 'reports', `report-${run.id}.pdf`);
      const md = await fs.readFile(reportMd, 'utf-8');
      console.log('\n=== MARKDOWN REPORT PREVIEW ===');
      console.log(md.slice(0, 1500));
      console.log(`\nReport files: ${reportMd}, ${reportPdf}`);
      return;
    }
  }

  console.error('E2E test timed out.');
  process.exit(1);
}

main().catch((e) => { console.error(e); process.exit(1); });
