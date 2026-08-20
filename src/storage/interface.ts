import type { EvaluationRun } from '../shared/types.js';

export interface Storage {
  create(run: EvaluationRun): Promise<void>;
  get(id: string): Promise<EvaluationRun | undefined>;
  update(run: EvaluationRun): Promise<void>;
  list(): Promise<EvaluationRun[]>;
  delete(id: string): Promise<void>;
}
