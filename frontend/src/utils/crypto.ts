const ENCRYPTION_PASSPHRASE = "sanjeevani-rural-telemed-pass-2026";

async function getAESKey(): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.digest("SHA-256", enc.encode(ENCRYPTION_PASSPHRASE));
  return crypto.subtle.importKey(
    "raw",
    keyMaterial,
    { name: "AES-GCM" },
    false,
    ["encrypt", "decrypt"]
  );
}

export async function encryptField(plainText: string): Promise<{ cipher: string; iv: string }> {
  if (!plainText) return { cipher: '', iv: '' };
  try {
    const key = await getAESKey();
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encoded = new TextEncoder().encode(plainText);

    const cipherBuffer = await crypto.subtle.encrypt(
      { name: "AES-GCM", iv },
      key,
      encoded
    );

    return {
      cipher: btoa(String.fromCharCode(...new Uint8Array(cipherBuffer))),
      iv: btoa(String.fromCharCode(...iv))
    };
  } catch (err) {
    console.error("Encryption failed:", err);
    return { cipher: btoa(plainText), iv: 'fallback' };
  }
}

export async function decryptField(cipher: string, iv: string): Promise<string> {
  if (!cipher) return '';
  if (iv === 'fallback') {
    try { return atob(cipher); } catch (e) { return cipher; }
  }
  try {
    const key = await getAESKey();
    const cipherBytes = Uint8Array.from(atob(cipher), c => c.charCodeAt(0));
    const ivBytes = Uint8Array.from(atob(iv), c => c.charCodeAt(0));

    const decrypted = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: ivBytes },
      key,
      cipherBytes
    );
    return new TextDecoder().decode(decrypted);
  } catch (err) {
    try {
      return atob(cipher);
    } catch {
      return "[Encrypted Record]";
    }
  }
}