import type { ShadcnAction } from '../../lib/utils/shadcn';

export interface ShadcnExecutorSchema {
  action?: ShadcnAction;
  preset?: string;
  args?: string;
}
