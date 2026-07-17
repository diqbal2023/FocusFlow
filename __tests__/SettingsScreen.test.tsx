import React from 'react';
import {fireEvent, render, screen, waitFor} from '@testing-library/react-native';
import {GoalManager} from '../src/managers/GoalManager';
import {SettingsManager} from '../src/managers/SettingsManager';
import {SessionManager} from '../src/managers/SessionManager';
import {DEFAULT_APP_SETTINGS, cloneSettings, type AppSettings} from '../src/models/AppSettings';
import type {ISettingsRepository} from '../src/repositories/SettingsRepository';
import {SettingsScreen} from '../src/screens/SettingsScreen';
import {TimerService} from '../src/services/TimerService';

class UiRepository implements ISettingsRepository {
  value = cloneSettings(DEFAULT_APP_SETTINGS);
  save = jest.fn(async (settings: AppSettings) => {
    this.value = cloneSettings(settings);
  });
  load = jest.fn(async () => cloneSettings(this.value));
  reset = jest.fn(async () => {
    this.value = cloneSettings(DEFAULT_APP_SETTINGS);
  });
}

function setup() {
  const repository = new UiRepository();
  const manager = new SettingsManager(
    repository,
    new SessionManager(new TimerService()),
    new GoalManager(),
  );
  render(<SettingsScreen manager={manager} />);
  return {repository, manager};
}

describe('SettingsScreen', () => {
  test('TC_SETTINGS_UI_01 invalid input shows useful field error and does not save', async () => {
    const {repository} = setup();
    fireEvent.changeText(screen.getByTestId('settings-work-minutes'), '0');
    fireEvent.press(screen.getByTestId('settings-save'));
    expect(await screen.findByText('Work minutes must be between 1 and 180.')).toBeTruthy();
    expect(repository.save).not.toHaveBeenCalled();
  });

  test('TC_SETTINGS_UI_02 valid form saves only on explicit action', async () => {
    const {repository, manager} = setup();
    fireEvent.changeText(screen.getByTestId('settings-work-minutes'), '45');
    fireEvent.press(screen.getByTestId('settings-theme-dark'));
    expect(repository.save).not.toHaveBeenCalled();
    fireEvent.press(screen.getByTestId('settings-save'));
    await waitFor(() => expect(repository.save).toHaveBeenCalledTimes(1));
    expect(manager.getCurrent().timer.workMinutes).toBe(45);
    expect(manager.getCurrent().appearance.theme).toBe('dark');
    expect(screen.getByText('Settings saved.')).toBeTruthy();
  });

  test('TC_SETTINGS_UI_03 exposes accessible controls for all sections', () => {
    setup();
    expect(screen.getByText('Timer')).toBeTruthy();
    expect(screen.getByText('Goals')).toBeTruthy();
    expect(screen.getByText('Appearance')).toBeTruthy();
    expect(screen.getByText('General')).toBeTruthy();
    expect(screen.getByTestId('settings-notifications').props.accessibilityLabel).toContain(
      'notifications',
    );
  });
});
