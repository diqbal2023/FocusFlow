/**
 * @format
 */

import React from 'react';
import {fireEvent, render, screen} from '@testing-library/react-native';
import {AppButton} from '../src/components/AppButton';
import {AppInput} from '../src/components/AppInput';
import {PageHeader} from '../src/components/PageHeader';

describe('FocusFlow shared UI components', () => {
  it('TC_UI_01 AppButton calls onPress when selected', () => {
    const onPress = jest.fn();

    render(
      <AppButton
        title="Save"
        onPress={onPress}
        testID="save-button"
      />,
    );

    fireEvent.press(screen.getByTestId('save-button'));

    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('TC_UI_02 disabled AppButton does not call onPress', () => {
    const onPress = jest.fn();

    render(
      <AppButton
        title="Save"
        onPress={onPress}
        disabled
        testID="save-button"
      />,
    );

    fireEvent.press(screen.getByTestId('save-button'));

    expect(onPress).not.toHaveBeenCalled();
  });

  it('TC_UI_03 AppInput displays its label', () => {
    render(
      <AppInput
        label="Task name"
        value=""
        onChangeText={() => {}}
        testID="task-name-input"
      />,
    );

    expect(screen.getByText('Task name')).toBeTruthy();
  });

  it('TC_UI_04 AppInput displays an error message when provided', () => {
    render(
      <AppInput
        label="Task name"
        value=""
        onChangeText={() => {}}
        error="Task name is required."
        testID="task-name-input"
      />,
    );

    expect(screen.getByText('Task name is required.')).toBeTruthy();
  });

  it('TC_UI_05 PageHeader displays its title and subtitle', () => {
    render(
      <PageHeader
        title="Tasks"
        subtitle="Organize and track your work."
      />,
    );

    expect(screen.getByText('Tasks')).toBeTruthy();
    expect(screen.getByText('Organize and track your work.')).toBeTruthy();
  });
});
