export function base64urlEncode(input: Uint8Array | ArrayBuffer): string {
  const data = input instanceof ArrayBuffer
    ? new Uint8Array(input)
    : input;

  // use native toBase64 if available
  if (Uint8Array.prototype.toBase64 !== undefined) {
    return data.toBase64({ alphabet: 'base64url', omitPadding: true });
  }

  // fallback to btoa
  return btoa(String.fromCharCode(...data))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

// toBase64 is supported in all browsers and most other runtimes, but is still missing in typescript
declare global {
  interface Uint8Array {
    /** @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Uint8Array/toBase64 */
    toBase64(options?: { alphabet?: 'base64' | 'base64url', omitPadding?: boolean }): string,
  }
}
