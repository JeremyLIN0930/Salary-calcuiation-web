export interface ThemeTokens {
  background: string
  surface: string
  surfaceSecondary: string
  card: string
  sidebar: string
  sidebarHover: string
  sidebarActive: string
  sidebarText: string
  sidebarTitle: string
  header: string
  border: string
  divider: string
  primary: string
  primaryHover: string
  danger: string
  success: string
  warning: string
  textPrimary: string
  textSecondary: string
  textMuted: string
  placeholder: string
  inputBackground: string
  tableHeader: string
  tableRow: string
  tableHover: string
  shadow: string
  radius: string
}

export const lightTokens: ThemeTokens = {
  background: '#F8FAFC',
  surface: '#FFFFFF',
  surfaceSecondary: '#F1F5F9',
  card: '#FFFFFF',
  sidebar: '#FFFFFF',
  sidebarHover: '#F1F5F9',
  sidebarActive: '#2F80ED',
  sidebarText: '#475569',
  sidebarTitle: '#1E293B',
  header: '#FFFFFF',
  border: '#E2E8F0',
  divider: '#F1F5F9',
  primary: '#2F80ED',
  primaryHover: '#1D6FD8',
  danger: '#EF4444',
  success: '#34A853',
  warning: '#F57C00',
  textPrimary: '#1E293B',
  textSecondary: '#64748B',
  textMuted: '#94A3B8',
  placeholder: '#94A3B8',
  inputBackground: '#F8FAFC',
  tableHeader: '#F8FAFC',
  tableRow: '#FFFFFF',
  tableHover: '#F1F5F9',
  shadow: '0 8px 24px rgba(0,0,0,0.04)',
  radius: '16px',
}

export const darkTokens: ThemeTokens = {
  background: '#0F172A',
  surface: '#1E293B',
  surfaceSecondary: '#334155',
  card: '#1E293B',
  sidebar: '#111827',
  sidebarHover: '#1F2937',
  sidebarActive: '#2563EB',
  sidebarText: '#CBD5E1',
  sidebarTitle: '#FFFFFF',
  header: '#1E293B',
  border: 'rgba(255,255,255,0.08)',
  divider: 'rgba(255,255,255,0.08)',
  primary: '#2563EB',
  primaryHover: '#1D4ED8',
  danger: '#EF4444',
  success: '#34A853',
  warning: '#F57C00',
  textPrimary: '#FFFFFF',
  textSecondary: '#CBD5E1',
  textMuted: '#94A3B8',
  placeholder: '#64748B',
  inputBackground: '#334155',
  tableHeader: '#1E293B',
  tableRow: '#0F172A',
  tableHover: '#1E293B',
  shadow: '0 8px 24px rgba(0,0,0,0.3)',
  radius: '16px',
}
