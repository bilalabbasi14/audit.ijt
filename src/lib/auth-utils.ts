export const AUTH_EMAIL_DOMAIN = 'auditijt.internal';

export function usernameToEmail(username: string): string {
  if (username.includes('@')) return username;
  return `${username}@${AUTH_EMAIL_DOMAIN}`;
}

export function emailToUsername(email: string): string {
  if (!email.endsWith(`@${AUTH_EMAIL_DOMAIN}`)) return email;
  return email.split('@')[0];
}
