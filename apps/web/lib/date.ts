export function expiresAt(seconds: number): Date {
  const expires = new Date();
  expires.setSeconds(expires.getSeconds() + seconds);
  return expires;
}

export function isExpired(expiresAt: Date | null): boolean {
  if(expiresAt === null) {
    return false;
  }

  return expiresAt < new Date();
}
