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

export type ColorTokens = {
  [K in keyof typeof lightColors]: string;
};

export const darkColors: ColorTokens = {
  background: '#111827',
  surface: '#1F2937',
  surfaceMuted: '#172033',
  border: '#374151',
  borderStrong: '#4B5563',
  textPrimary: '#F9FAFB',
  textSecondary: '#D1D5DB',
  textMuted: '#9CA3AF',
  textOnPrimary: '#FFFFFF',
  textOnDanger: '#FFFFFF',
  primary: '#3B82F6',
  primaryPressed: '#2563EB',
  primaryMuted: '#1E3A5F',
  secondary: '#374151',
  secondaryPressed: '#4B5563',
  secondaryBorder: '#6B7280',
  danger: '#EF4444',
  dangerPressed: '#DC2626',
  dangerMuted: '#5F2020',
  disabledBackground: '#374151',
  disabledText: '#9CA3AF',
  error: '#FCA5A5',
  focusRing: '#60A5FA',
  sidebarBackground: '#0B1220',
  sidebarBorder: '#374151',
  sidebarText: '#D1D5DB',
  sidebarTextMuted: '#9CA3AF',
  sidebarTextActive: '#FFFFFF',
  sidebarItemActive: '#2563EB',
  sidebarItemPressed: '#374151',
};

/** Legacy light tokens for screens awaiting full token-hook migration. */
export const colors = lightColors;
