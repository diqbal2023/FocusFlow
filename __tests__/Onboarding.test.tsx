/**
 * @format
 */

import React from 'react';
import {act, fireEvent, render, screen, waitFor} from '@testing-library/react-native';
import App from '../App';
import {GoalManager} from '../src/managers/GoalManager';
import {SettingsManager} from '../src/managers/SettingsManager';
import {SessionManager} from '../src/managers/SessionManager';
import {
  DEFAULT_APP_SETTINGS,
  cloneSettings,
  type AppSettings,
} from '../src/models/AppSettings';
import type {ISettingsRepository} from '../src/repositories/SettingsRepository';
import {TimerService} from '../src/services/TimerService';

class MemorySettingsRepository implements ISettingsRepository {
  value: AppSettings;
  saves = 0;

  constructor(initial: AppSettings = cloneSettings(DEFAULT_APP_SETTINGS)) {
    this.value = cloneSettings(initial);
  }

  async load() {
    return cloneSettings(this.value);
  }

  async save(settings: AppSettings) {
    this.saves += 1;
    this.value = cloneSettings(settings);
  }

  async reset() {
    this.value = cloneSettings(DEFAULT_APP_SETTINGS);
  }
}

function createManager(initial?: AppSettings) {
  const repository = new MemorySettingsRepository(initial);
  const sessions = new SessionManager(new TimerService());
  const goals = new GoalManager(new Date('2026-07-18T12:00:00'));
  const manager = new SettingsManager(repository, sessions, goals);
  return {repository, sessions, goals, manager};
}

describe('First-launch onboarding (Stage 21)', () => {
  it('TC_ONBOARD_01 shows the setup wizard on first launch', async () => {
    const {manager} = createManager({
      ...cloneSettings(DEFAULT_APP_SETTINGS),
      onboardingCompleted: false,
    });

    render(<App manager={manager} />);

    expect(await screen.findByTestId('onboarding-screen')).toBeTruthy();
    expect(screen.getByText('Welcome to FocusFlow')).toBeTruthy();
    expect(screen.queryByText('Organize and track your work.')).toBeNull();
  });

  it('TC_ONBOARD_02 skips the wizard when onboarding is already completed', async () => {
    const {manager} = createManager({
      ...cloneSettings(DEFAULT_APP_SETTINGS),
      onboardingCompleted: true,
    });

    render(<App manager={manager} />);

    expect(
      await screen.findByText('Organize and track your work.'),
    ).toBeTruthy();
    expect(screen.queryByTestId('onboarding-screen')).toBeNull();
  });

  it('TC_ONBOARD_03 saves preferences and marks onboarding complete', async () => {
    const {manager, repository, sessions, goals} = createManager({
      ...cloneSettings(DEFAULT_APP_SETTINGS),
      onboardingCompleted: false,
    });

    render(<App manager={manager} />);
    await screen.findByTestId('onboarding-screen');

    fireEvent.changeText(screen.getByTestId('onboarding-work-minutes'), '30');
    fireEvent.changeText(screen.getByTestId('onboarding-daily-tasks'), '8');
    fireEvent.press(screen.getByTestId('onboarding-theme-dark'));
    fireEvent(screen.getByTestId('onboarding-notifications'), 'valueChange', false);

    await act(async () => {
      fireEvent.press(screen.getByTestId('onboarding-finish'));
    });

    await waitFor(() => {
      expect(screen.queryByTestId('onboarding-screen')).toBeNull();
    });
    expect(await screen.findByText('Organize and track your work.')).toBeTruthy();

    expect(repository.saves).toBe(1);
    expect(repository.value.onboardingCompleted).toBe(true);
    expect(repository.value.timer.workMinutes).toBe(30);
    expect(repository.value.goals.daily.tasks).toBe(8);
    expect(repository.value.appearance.theme).toBe('dark');
    expect(repository.value.general.notificationsEnabled).toBe(false);
    expect(sessions.getConfiguration().workMinutes).toBe(30);
    expect(goals.getTargets('daily').tasks).toBe(8);
    expect(manager.getCurrent().onboardingCompleted).toBe(true);
  });
});
