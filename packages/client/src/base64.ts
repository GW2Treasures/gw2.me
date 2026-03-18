export function base64urlEncode(input: Uint8Array | ArrayBuffer): string {
  const data = input instanceof ArrayBuffer
    ? new Uint8Array(input)
    : input;

  return btoa(String.fromCharCode(...data))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

