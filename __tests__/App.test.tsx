/**
 * @format
 */

import React from 'react';
import {fireEvent, render, screen} from '@testing-library/react-native';
import App from '../App';

function expectNavSelected(testID: string, selected: boolean) {
  expect(screen.getByTestId(testID).props.accessibilityState).toEqual({
    selected,
  });
}

async function renderAppOnTasks() {
  render(<App />);
  await screen.findByText('Organize and track your work.');
}

describe('FocusFlow navigation shell', () => {
  it('TC_NAV_01 displays the Tasks screen by default', async () => {
    await renderAppOnTasks();

    expect(screen.getByText('Organize and track your work.')).toBeTruthy();
    expectNavSelected('nav-tasks', true);
  });

  it('TC_NAV_02 selecting Focus Session displays the Focus Session screen', async () => {
    await renderAppOnTasks();

    fireEvent.press(screen.getByTestId('nav-focus'));

    expect(
      screen.getByText('Stay focused with timed work sessions.'),
    ).toBeTruthy();
    expect(screen.queryByText('Organize and track your work.')).toBeNull();
  });

  it('TC_NAV_03 selecting Statistics displays the Statistics screen', async () => {
    await renderAppOnTasks();

    fireEvent.press(screen.getByTestId('nav-statistics'));

    expect(
      screen.getByText('Review your productivity patterns.'),
    ).toBeTruthy();
    expect(screen.queryByText('Organize and track your work.')).toBeNull();
  });

  it('TC_NAV_04 selecting Goals displays the Goals screen', async () => {
    await renderAppOnTasks();

    fireEvent.press(screen.getByTestId('nav-goals'));

    expect(
      screen.getByText('Set and monitor productivity goals.'),
    ).toBeTruthy();
    expect(screen.queryByText('Organize and track your work.')).toBeNull();
  });

  it('TC_NAV_05 selecting Settings displays the Settings screen', async () => {
    await renderAppOnTasks();

    fireEvent.press(screen.getByTestId('nav-settings'));

    expect(
      screen.getByText('Customize your FocusFlow experience.'),
    ).toBeTruthy();
    expect(screen.queryByText('Organize and track your work.')).toBeNull();
  });

  it('TC_NAV_06 marks the selected sidebar item as active', async () => {
    await renderAppOnTasks();

    expectNavSelected('nav-tasks', true);
    expectNavSelected('nav-focus', false);

    fireEvent.press(screen.getByTestId('nav-focus'));

    expectNavSelected('nav-focus', true);
    expectNavSelected('nav-tasks', false);

    fireEvent.press(screen.getByTestId('nav-settings'));

    expectNavSelected('nav-settings', true);
    expectNavSelected('nav-focus', false);
  });
});
