/**
 * Custom SHA-256 password hashing implementation for future-proof security.
 * Uses the standard Web Crypto API (crypto.subtle.digest) which is natively supported
 * in Node.js (v15+) and all modern web browsers.
 */
export async function customHashPassword(password: string, salt: string = 'devflow_auth_v1'): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(`salt:${salt}:pass:${password}:devflow_custom_hash_v1`);
  
  // Web Crypto API is available as globalThis.crypto in browsers and Node.js
  const cryptoObject = globalThis.crypto;
  if (!cryptoObject || !cryptoObject.subtle) {
    throw new Error('Web Crypto API (crypto.subtle) is required for custom password hashing.');
  }

  const hashBuffer = await cryptoObject.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}
