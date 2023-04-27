export function expiresAt(seconds: number): Date {
  const expires = new Date();
  expires.setSeconds(expires.getSeconds() + seconds);
  return expires;
}
