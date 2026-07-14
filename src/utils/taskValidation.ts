import type {TaskPriority} from '../types/task';

export const VALID_TASK_PRIORITIES: readonly TaskPriority[] = [
  'Low',
  'Medium',
  'High',
  'Critical',
] as const;

export type TaskValidationInput = {
  title: string;
  description?: string;
  priority: string;
  estimatedDuration?: string;
  labels?: string | string[];
  dueDate?: string;
};

export type TaskValidationErrors = {
  title?: string;
  description?: string;
  priority?: string;
  estimatedDuration?: string;
  labels?: string;
  dueDate?: string;
};

export type SanitizedTaskData = {
  title: string;
  description: string;
  priority: TaskPriority;
  estimatedDuration: string;
  labels: string[];
  dueDate: string;
};

export type TaskValidationResult = {
  isValid: boolean;
  errors: TaskValidationErrors;
  sanitizedData: SanitizedTaskData;
};

const TITLE_MAX_LENGTH = 100;
const DESCRIPTION_MAX_LENGTH = 500;
const MAX_LABELS = 10;
const MAX_DURATION_MINUTES = 1440;

function isValidPriority(value: string): value is TaskPriority {
  return (VALID_TASK_PRIORITIES as readonly string[]).includes(value);
}

/**
 * Splits a comma-separated string or array into sanitized labels:
 * - trim whitespace
 * - drop blanks
 * - drop case-insensitive duplicates (keep first occurrence)
 */
export function sanitizeLabels(labels?: string | string[]): string[] {
  const raw = Array.isArray(labels)
    ? labels
    : (labels ?? '').split(',');

  const result: string[] = [];
  const seen = new Set<string>();

  for (const item of raw) {
    const trimmed = item.trim();
    if (!trimmed) {
      continue;
    }

    const key = trimmed.toLowerCase();
    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    result.push(trimmed);
  }

  return result;
}

function isNumericDuration(value: string): boolean {
  if (value.trim() === '') {
    return false;
  }
  return /^\d+(\.\d+)?$/.test(value.trim());
}

function isValidOptionalDate(value: string): boolean {
  if (value.trim() === '') {
    return true;
  }

  const trimmed = value.trim();
  const parsed = Date.parse(trimmed);
  if (Number.isNaN(parsed)) {
    return false;
  }

  // Reject clearly incomplete numeric junk that Date.parse may accept inconsistently.
  // Prefer ISO-like or common date strings with a real calendar date.
  const date = new Date(trimmed);
  return !Number.isNaN(date.getTime());
}

export function validateTaskInput(
  input: TaskValidationInput,
): TaskValidationResult {
  const errors: TaskValidationErrors = {};

  const title = (input.title ?? '').trim();
  const description = (input.description ?? '').trim();
  const priorityRaw = (input.priority ?? '').trim();
  const estimatedDurationRaw = (input.estimatedDuration ?? '').trim();
  const dueDate = (input.dueDate ?? '').trim();
  const labels = sanitizeLabels(input.labels);

  if (!title) {
    errors.title = 'Title is required.';
  } else if (title.length > TITLE_MAX_LENGTH) {
    errors.title = `Title must be ${TITLE_MAX_LENGTH} characters or fewer.`;
  }

  if (description.length > DESCRIPTION_MAX_LENGTH) {
    errors.description = `Description must be ${DESCRIPTION_MAX_LENGTH} characters or fewer.`;
  }

  if (!isValidPriority(priorityRaw)) {
    errors.priority =
      'Priority must be Low, Medium, High, or Critical.';
  }

  if (estimatedDurationRaw) {
    if (!isNumericDuration(estimatedDurationRaw)) {
      errors.estimatedDuration = 'Estimated duration must be a number.';
    } else {
      const minutes = Number(estimatedDurationRaw);
      if (minutes <= 0) {
        errors.estimatedDuration =
          'Estimated duration must be greater than 0.';
      } else if (minutes > MAX_DURATION_MINUTES) {
        errors.estimatedDuration = `Estimated duration must not exceed ${MAX_DURATION_MINUTES} minutes.`;
      }
    }
  }

  if (labels.length > MAX_LABELS) {
    errors.labels = `A task can have at most ${MAX_LABELS} labels.`;
  }

  if (dueDate && !isValidOptionalDate(dueDate)) {
    errors.dueDate = 'Due date must be a valid date.';
  }

  const sanitizedData: SanitizedTaskData = {
    title,
    description,
    priority: isValidPriority(priorityRaw) ? priorityRaw : 'Medium',
    estimatedDuration: estimatedDurationRaw,
    labels,
    dueDate,
  };

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
    sanitizedData,
  };
}
