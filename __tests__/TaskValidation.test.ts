/**
 * @format
 */

import {
  sanitizeLabels,
  validateTaskInput,
} from '../src/utils/taskValidation';

describe('Task validation', () => {
  it('TC_TASK_VAL_01 rejects an empty or whitespace-only task title', () => {
    const emptyResult = validateTaskInput({
      title: '',
      priority: 'Medium',
    });
    expect(emptyResult.isValid).toBe(false);
    expect(emptyResult.errors.title).toBeTruthy();

    const whitespaceResult = validateTaskInput({
      title: '   ',
      priority: 'High',
    });
    expect(whitespaceResult.isValid).toBe(false);
    expect(whitespaceResult.errors.title).toBeTruthy();
  });

  it('TC_TASK_VAL_02 accepts a valid task', () => {
    const result = validateTaskInput({
      title: 'Finish notes',
      description: 'Review chapter 3',
      priority: 'High',
      estimatedDuration: '45',
      labels: 'school, homework',
      dueDate: '2026-07-20',
    });

    expect(result.isValid).toBe(true);
    expect(result.errors).toEqual({});
    expect(result.sanitizedData.title).toBe('Finish notes');
    expect(result.sanitizedData.priority).toBe('High');
    expect(result.sanitizedData.estimatedDuration).toBe('45');
    expect(result.sanitizedData.labels).toEqual(['school', 'homework']);
  });

  it('TC_TASK_VAL_03 trims task titles, descriptions, and labels', () => {
    const result = validateTaskInput({
      title: '  Trimmed Title  ',
      description: '  Trimmed description  ',
      priority: 'Low',
      labels: [' School ', ' homework '],
    });

    expect(result.isValid).toBe(true);
    expect(result.sanitizedData.title).toBe('Trimmed Title');
    expect(result.sanitizedData.description).toBe('Trimmed description');
    expect(result.sanitizedData.labels).toEqual(['School', 'homework']);
  });

  it('TC_TASK_VAL_04 rejects a title longer than 100 characters or a description longer than 500 characters', () => {
    const longTitle = 'T'.repeat(101);
    const titleResult = validateTaskInput({
      title: longTitle,
      priority: 'Medium',
    });
    expect(titleResult.isValid).toBe(false);
    expect(titleResult.errors.title).toBeTruthy();

    const longDescription = 'D'.repeat(501);
    const descriptionResult = validateTaskInput({
      title: 'Valid title',
      description: longDescription,
      priority: 'Medium',
    });
    expect(descriptionResult.isValid).toBe(false);
    expect(descriptionResult.errors.description).toBeTruthy();
  });

  it('TC_TASK_VAL_05 rejects a priority outside Low, Medium, High, or Critical', () => {
    const result = validateTaskInput({
      title: 'Valid title',
      priority: 'Urgent',
    });

    expect(result.isValid).toBe(false);
    expect(result.errors.priority).toBeTruthy();
  });

  it('TC_TASK_VAL_06 rejects estimated duration when it is non-numeric, zero or less, or greater than 1440 minutes', () => {
    const nonNumeric = validateTaskInput({
      title: 'Valid title',
      priority: 'Medium',
      estimatedDuration: 'abc',
    });
    expect(nonNumeric.isValid).toBe(false);
    expect(nonNumeric.errors.estimatedDuration).toBeTruthy();

    const zero = validateTaskInput({
      title: 'Valid title',
      priority: 'Medium',
      estimatedDuration: '0',
    });
    expect(zero.isValid).toBe(false);
    expect(zero.errors.estimatedDuration).toBeTruthy();

    const tooLarge = validateTaskInput({
      title: 'Valid title',
      priority: 'Medium',
      estimatedDuration: '1441',
    });
    expect(tooLarge.isValid).toBe(false);
    expect(tooLarge.errors.estimatedDuration).toBeTruthy();
  });

  it('TC_TASK_VAL_07 rejects more than 10 labels after sanitization', () => {
    const labels = Array.from({length: 11}, (_, index) => `Label${index + 1}`);
    const result = validateTaskInput({
      title: 'Valid title',
      priority: 'Medium',
      labels,
    });

    expect(result.isValid).toBe(false);
    expect(result.errors.labels).toBeTruthy();
    expect(result.sanitizedData.labels).toHaveLength(11);
  });

  it('TC_TASK_VAL_08 removes blank labels and case-insensitive duplicate labels', () => {
    const sanitized = sanitizeLabels(['School', ' school ', '', 'Homework']);
    expect(sanitized).toEqual(['School', 'Homework']);

    const result = validateTaskInput({
      title: 'Valid title',
      priority: 'Medium',
      labels: ['School', ' school ', '', 'Homework'],
    });

    expect(result.isValid).toBe(true);
    expect(result.sanitizedData.labels).toEqual(['School', 'Homework']);
  });
});
