export const AUTH_EMAIL_DOMAIN = 'auditijt.internal';

export function emailToUsername(email: string): string {
  if (!email.endsWith(`@${AUTH_EMAIL_DOMAIN}`)) return email;
  return email.split('@')[0];
}
