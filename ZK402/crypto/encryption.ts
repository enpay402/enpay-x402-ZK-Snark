import { ethers } from 'ethers';

export async function encryptAmount(
  amount: string,
  secret: string
): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(amount);

  const keyMaterial = await deriveKey(secret);
  const iv = crypto.getRandomValues(new Uint8Array(12));

  const encryptedData = await crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: iv
    },
    keyMaterial,
    data
  );

  const encryptedArray = new Uint8Array(encryptedData);
  const combined = new Uint8Array(iv.length + encryptedArray.length);
  combined.set(iv);
  combined.set(encryptedArray, iv.length);

  return ethers.hexlify(combined);
}

export async function decryptAmount(
  encryptedHex: string,
  secret: string
): Promise<string> {
  const combined = ethers.getBytes(encryptedHex);
  const iv = combined.slice(0, 12);
  const encryptedData = combined.slice(12);

  const keyMaterial = await deriveKey(secret);

  try {
    const decryptedData = await crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: iv
      },
      keyMaterial,
      encryptedData
    );

    const decoder = new TextDecoder();
    return decoder.decode(decryptedData);
  } catch (error) {
    throw new Error('Decryption failed: Invalid secret or corrupted data');
  }
}

async function deriveKey(secret: string): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  return await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: encoder.encode('x402-zk-snark-salt'),
      iterations: 100000,
      hash: 'SHA-256'
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

export function generateRandomSecret(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return ethers.hexlify(array);
}

export function hashSecret(secret: string): string {
  return ethers.keccak256(ethers.toUtf8Bytes(secret));
}

export async function encryptData(
  data: string,
  publicKey: string
): Promise<string> {
  const encoder = new TextEncoder();
  const dataBytes = encoder.encode(data);

  const secret = generateRandomSecret();
  const encrypted = await encryptAmount(data, secret);

  const wrappedKey = ethers.keccak256(
    ethers.solidityPacked(['string', 'string'], [secret, publicKey])
  );

  return JSON.stringify({
    encrypted,
    wrappedKey
  });
}

export async function decryptData(
  encryptedPackage: string,
  privateKey: string
): Promise<string> {
  const { encrypted, wrappedKey } = JSON.parse(encryptedPackage);

  const recoveredSecret = ethers.keccak256(
    ethers.solidityPacked(['string', 'string'], [wrappedKey, privateKey])
  );

  return await decryptAmount(encrypted, recoveredSecret);
}

export default {
  encryptAmount,
  decryptAmount,
  generateRandomSecret,
  hashSecret,
  encryptData,
  decryptData
};
