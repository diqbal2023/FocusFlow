/**
 * FocusFlow color tokens.
 * Structured so a dark theme can be added later without rewriting components.
 */

export const lightColors = {
  background: '#F3F4F6',
  surface: '#FFFFFF',
  surfaceMuted: '#F9FAFB',
  border: '#E5E7EB',
  borderStrong: '#D1D5DB',

  textPrimary: '#111827',
  textSecondary: '#6B7280',
  textMuted: '#9CA3AF',
  textOnPrimary: '#FFFFFF',
  textOnDanger: '#FFFFFF',

  primary: '#2563EB',
  primaryPressed: '#1D4ED8',
  primaryMuted: '#DBEAFE',

  secondary: '#FFFFFF',
  secondaryPressed: '#F3F4F6',
  secondaryBorder: '#D1D5DB',

  danger: '#DC2626',
  dangerPressed: '#B91C1C',
  dangerMuted: '#FEE2E2',

  disabledBackground: '#E5E7EB',
  disabledText: '#9CA3AF',

  error: '#B91C1C',
  focusRing: '#93C5FD',

  sidebarBackground: '#1F2937',
  sidebarBorder: '#374151',
  sidebarText: '#D1D5DB',
  sidebarTextMuted: '#9CA3AF',
  sidebarTextActive: '#FFFFFF',
  sidebarItemActive: '#2563EB',
  sidebarItemPressed: '#374151',
} as const;

/** Active theme colors (light for now). */
export const colors = lightColors;

export type ColorTokens = typeof lightColors;
