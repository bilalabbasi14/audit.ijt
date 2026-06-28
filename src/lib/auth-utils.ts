export const AUTH_EMAIL_DOMAIN = 'auditijt.internal';

export function usernameToEmail(username: string): string {
  const normalized = username.trim().toLowerCase();
  if (!normalized) return '';
  if (normalized.includes('@')) return normalized;
  return `${normalized}@${AUTH_EMAIL_DOMAIN}`;
}

export function emailToUsername(email: string): string {
  if (!email.endsWith(`@${AUTH_EMAIL_DOMAIN}`)) return email;
  return email.split('@')[0];
}
