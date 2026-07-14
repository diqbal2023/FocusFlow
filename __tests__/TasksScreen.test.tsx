/**
 * @format
 */

import React from 'react';
import {fireEvent, render, screen} from '@testing-library/react-native';
import {TasksScreen} from '../src/screens/TasksScreen';

describe('Tasks screen temporary UI state', () => {
  it('TC_TASK_UI_01 the screen renders the sample tasks', () => {
    render(<TasksScreen />);

    expect(screen.getByText('Math Homework')).toBeTruthy();
    expect(screen.getByText('Clean Room')).toBeTruthy();
    expect(screen.getByText('Study React Native')).toBeTruthy();
    expect(screen.getByText('Priority: High')).toBeTruthy();
    expect(screen.getByText('Status: Pending')).toBeTruthy();
    expect(screen.getByText('Status: In Progress')).toBeTruthy();
    expect(screen.getByText('Status: Completed')).toBeTruthy();
  });

  it('TC_TASK_UI_02 selecting Complete advances status Pending to In Progress to Completed', () => {
    render(<TasksScreen />);

    expect(screen.getByTestId('task-status-sample-1')).toHaveTextContent(
      'Status: Pending',
    );

    fireEvent.press(screen.getByTestId('task-complete-sample-1'));
    expect(screen.getByTestId('task-status-sample-1')).toHaveTextContent(
      'Status: In Progress',
    );

    fireEvent.press(screen.getByTestId('task-complete-sample-1'));
    expect(screen.getByTestId('task-status-sample-1')).toHaveTextContent(
      'Status: Completed',
    );
  });

  it('TC_TASK_UI_03 selecting Delete moves a task to Recently Deleted', () => {
    render(<TasksScreen />);

    expect(screen.getByText('Clean Room')).toBeTruthy();

    fireEvent.press(screen.getByTestId('task-delete-sample-2'));

    expect(screen.queryByTestId('task-card-sample-2')).toBeNull();

    fireEvent.press(screen.getByTestId('recently-deleted-button'));

    expect(screen.getByTestId('deleted-task-card-sample-2')).toBeTruthy();
    expect(screen.getByText('Clean Room')).toBeTruthy();
    expect(screen.getByTestId('deleted-task-days-sample-2')).toHaveTextContent(
      '30 days left to restore',
    );
  });

  it('TC_TASK_UI_06 restoring from Recently Deleted returns the task to the list', () => {
    render(<TasksScreen />);

    fireEvent.press(screen.getByTestId('task-delete-sample-2'));
    fireEvent.press(screen.getByTestId('recently-deleted-button'));
    fireEvent.press(screen.getByTestId('task-restore-sample-2'));

    expect(screen.queryByTestId('deleted-task-card-sample-2')).toBeNull();
    expect(screen.getByText('No recently deleted tasks.')).toBeTruthy();

    fireEvent.press(screen.getByTestId('close-recently-deleted-button'));

    expect(screen.getByTestId('task-card-sample-2')).toBeTruthy();
    expect(screen.getByText('Clean Room')).toBeTruthy();
  });

  it('TC_TASK_UI_07 permanently deleting from Recently Deleted removes the task', () => {
    render(<TasksScreen />);

    fireEvent.press(screen.getByTestId('task-delete-sample-2'));
    fireEvent.press(screen.getByTestId('recently-deleted-button'));
    fireEvent.press(screen.getByTestId('task-permanent-delete-sample-2'));

    expect(screen.queryByTestId('deleted-task-card-sample-2')).toBeNull();
    expect(screen.getByText('No recently deleted tasks.')).toBeTruthy();

    fireEvent.press(screen.getByTestId('close-recently-deleted-button'));

    expect(screen.queryByTestId('task-card-sample-2')).toBeNull();
    expect(screen.queryByText('Clean Room')).toBeNull();
  });

  it('TC_TASK_UI_04 selecting Edit loads the task into the form', () => {
    render(<TasksScreen />);

    fireEvent.press(screen.getByTestId('task-edit-sample-1'));

    expect(screen.getByTestId('task-title-input').props.value).toBe(
      'Math Homework',
    );
    expect(screen.getByTestId('task-description-input').props.value).toBe(
      'Finish algebra worksheet problems 1 through 20.',
    );
    expect(screen.getByText('Edit Task')).toBeTruthy();
  });

  it('TC_TASK_UI_05 saving a new task adds it to the displayed list', () => {
    render(<TasksScreen />);

    fireEvent.press(screen.getByTestId('add-task-button'));
    fireEvent.changeText(
      screen.getByTestId('task-title-input'),
      'Write Unit Tests',
    );
    fireEvent.changeText(
      screen.getByTestId('task-description-input'),
      'Cover task list interactions.',
    );
    fireEvent.press(screen.getByTestId('save-task-button'));

    expect(screen.getByText('Write Unit Tests')).toBeTruthy();
    expect(screen.getByText('Cover task list interactions.')).toBeTruthy();
    expect(screen.queryByTestId('task-form-card')).toBeNull();
  });

  it('TC_TASK_FORM_01 saving invalid input displays a validation error and does not add the task to the displayed list', () => {
    render(<TasksScreen />);

    fireEvent.press(screen.getByTestId('add-task-button'));
    fireEvent.changeText(screen.getByTestId('task-title-input'), '   ');
    fireEvent.changeText(
      screen.getByTestId('task-description-input'),
      'Should not be saved',
    );
    fireEvent.press(screen.getByTestId('save-task-button'));

    expect(screen.getByText('Title is required.')).toBeTruthy();
    expect(screen.queryByText('Should not be saved')).toBeNull();
    expect(screen.getByTestId('task-title-input').props.value).toBe('   ');
    expect(screen.getByTestId('task-form-card')).toBeTruthy();
  });
});
