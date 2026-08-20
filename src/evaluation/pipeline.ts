import path from 'node:path';
import { v4 as uuidv4 } from 'uuid';
import { extractText } from '../extraction/extractor.js';
import { loadPromptByTemplateId } from '../prompts/loader.js';
import { createLLMProvider } from '../llm/factory.js';
import { evaluateCandidate } from './evaluator.js';
import { consolidateEvaluations } from './consolidation.js';
import { buildReports } from '../reports/builder.js';
import { FilesystemStorage } from '../storage/filesystem.js';
import { config } from '../server/config.js';
import { estimateTokenCount } from '../utils/sanitize.js';
import { toErrorMessage } from '../utils/text.js';
import type { UploadedFile, EvaluationRun, ExtractionResult, CandidateEvaluation } from '../shared/types.js';
import type { ConsolidatedReport } from '../schemas/report.js';

export interface StartPipelineOptions {
  jobDescriptionFile: UploadedFile;
  resumeFiles: UploadedFile[];
  templateId: string;
  jobTitle?: string;
}

export async function startPipeline(options: StartPipelineOptions): Promise<EvaluationRun> {
  const run = await createRun(options);
  // Launch the evaluation pipeline in the background so the API can return immediately.
  processPipeline(run.id, options).catch((error) => {
    console.error(`Pipeline ${run.id} failed:`, toErrorMessage(error));
  });
  return run;
}

export async function createRun(options: StartPipelineOptions): Promise<EvaluationRun> {
  const storage = new FilesystemStorage(path.join(config.uploads.outputDir, 'runs'));

  const run: EvaluationRun = {
    id: uuidv4(),
    status: 'pending',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    templateId: options.templateId,
    resumes: [],
    candidateEvaluations: [],
    errors: [],
    warnings: [],
  };

  await storage.create(run);
  return run;
}

export async function processPipeline(runId: string, options: StartPipelineOptions): Promise<EvaluationRun> {
  const storage = new FilesystemStorage(path.join(config.uploads.outputDir, 'runs'));
  const provider = createLLMProvider(config.llm.provider, config.llm.apiKey, config.llm.model, config.llm.baseURL);

  const run = await storage.get(runId);
  if (!run) {
    throw new Error(`Run ${runId} not found`);
  }

  try {
    run.status = 'extracting';
    run.updatedAt = new Date().toISOString();
    await storage.update(run);

    const jdExtraction = await extractText(options.jobDescriptionFile);
    run.jobDescription = jdExtraction;
    if (!jdExtraction.success) {
      throw new Error(`Job Description extraction failed: ${jdExtraction.error}`);
    }

    const estimatedTokens = estimateTokenCount(jdExtraction.text);
    if (estimatedTokens > 8000) {
      run.warnings.push(`Job Description is very long (~${estimatedTokens} tokens). Evaluation quality may degrade.`);
    }

    const resumeExtractions: ExtractionResult[] = [];
    for (const resume of options.resumeFiles) {
      const extraction = await extractText(resume);
      resumeExtractions.push(extraction);
      if (!extraction.success) {
        run.warnings.push(`Extraction failed for ${extraction.file.originalName}: ${extraction.error}`);
      }
    }
    run.resumes = resumeExtractions;
    await storage.update(run);

    const prompt = await loadPromptByTemplateId(options.templateId);

    run.status = 'evaluating';
    run.updatedAt = new Date().toISOString();
    await storage.update(run);

    const candidateEvaluations: CandidateEvaluation[] = [];
    for (let i = 0; i < resumeExtractions.length; i++) {
      const resume = resumeExtractions[i];
      run.currentCandidate = resume.file.originalName;
      await storage.update(run);

      const evaluation = await evaluateCandidate({
        jobDescription: jdExtraction.text,
        resume,
        prompt,
        provider,
        temperature: config.llm.temperature,
        maxTokens: config.llm.maxTokens,
        maxRetries: config.llm.maxRetries,
      });

      candidateEvaluations.push(evaluation);
      run.candidateEvaluations = candidateEvaluations;
      run.updatedAt = new Date().toISOString();
      await storage.update(run);
    }

    run.status = 'consolidating';
    run.updatedAt = new Date().toISOString();
    await storage.update(run);

    const report = await consolidateEvaluations({
      jobDescription: jdExtraction.text,
      candidateEvaluations,
      prompt,
      provider,
      temperature: config.llm.temperature,
      maxTokens: config.llm.maxTokens,
      maxRetries: config.llm.maxRetries,
      jobTitle: options.jobTitle || 'Untitled Position',
    });

    await buildReports(report, path.join(config.uploads.outputDir, 'reports'), run.id);

    run.report = report as ConsolidatedReport; // Already validated
    run.status = candidateEvaluations.some((e) => e.error) ? 'partial' : 'completed';
    run.updatedAt = new Date().toISOString();
    delete (run as { currentCandidate?: string }).currentCandidate;
    await storage.update(run);

    return run;
  } catch (error) {
    run.status = 'failed';
    run.errors.push(toErrorMessage(error));
    run.updatedAt = new Date().toISOString();
    await storage.update(run);
    throw error;
  }
}

export async function getRun(id: string): Promise<EvaluationRun | undefined> {
  const storage = new FilesystemStorage(path.join(config.uploads.outputDir, 'runs'));
  return await storage.get(id);
}
