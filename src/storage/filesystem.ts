import fs from 'node:fs/promises';
import path from 'node:path';
import type { Storage } from './interface.js';
import type { EvaluationRun } from '../shared/types.js';

export class FilesystemStorage implements Storage {
  private directory: string;

  constructor(directory: string) {
    this.directory = directory;
  }

  private getFilePath(id: string): string {
    return path.join(this.directory, `${id}.json`);
  }

  async ensureDirectory(): Promise<void> {
    await fs.mkdir(this.directory, { recursive: true });
  }

  async create(run: EvaluationRun): Promise<void> {
    await this.ensureDirectory();
    await fs.writeFile(this.getFilePath(run.id), JSON.stringify(run, null, 2), 'utf-8');
  }

  async get(id: string): Promise<EvaluationRun | undefined> {
    try {
      const raw = await fs.readFile(this.getFilePath(id), 'utf-8');
      return JSON.parse(raw) as EvaluationRun;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') return undefined;
      throw error;
    }
  }

  async update(run: EvaluationRun): Promise<void> {
    await this.ensureDirectory();
    await fs.writeFile(this.getFilePath(run.id), JSON.stringify(run, null, 2), 'utf-8');
  }

  async list(): Promise<EvaluationRun[]> {
    await this.ensureDirectory();
    const entries = await fs.readdir(this.directory, { withFileTypes: true });
    const runs: EvaluationRun[] = [];
    for (const entry of entries) {
      if (entry.isFile() && entry.name.endsWith('.json')) {
        const id = entry.name.replace(/\.json$/, '');
        const run = await this.get(id);
        if (run) runs.push(run);
      }
    }
    return runs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async delete(id: string): Promise<void> {
    try {
      await fs.unlink(this.getFilePath(id));
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
    }
  }
}
