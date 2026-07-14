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

  it('TC_TASK_UI_02 selecting Complete changes a task to Completed', () => {
    render(<TasksScreen />);

    expect(screen.getByTestId('task-status-sample-1')).toHaveTextContent(
      'Status: Pending',
    );

    fireEvent.press(screen.getByTestId('task-complete-sample-1'));

    expect(screen.getByTestId('task-status-sample-1')).toHaveTextContent(
      'Status: Completed',
    );
  });

  it('TC_TASK_UI_03 selecting Delete removes a task', () => {
    render(<TasksScreen />);

    expect(screen.getByText('Clean Room')).toBeTruthy();

    fireEvent.press(screen.getByTestId('task-delete-sample-2'));

    expect(screen.queryByText('Clean Room')).toBeNull();
    expect(screen.queryByTestId('task-card-sample-2')).toBeNull();
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
  });

  it('TC_TASK_FORM_01 saving invalid input displays a validation error and does not add the task to the displayed list', () => {
    render(<TasksScreen />);

    fireEvent.changeText(screen.getByTestId('task-title-input'), '   ');
    fireEvent.changeText(
      screen.getByTestId('task-description-input'),
      'Should not be saved',
    );
    fireEvent.press(screen.getByTestId('save-task-button'));

    expect(screen.getByText('Title is required.')).toBeTruthy();
    expect(screen.queryByText('Should not be saved')).toBeNull();
    expect(screen.getByTestId('task-title-input').props.value).toBe('   ');
  });
});
