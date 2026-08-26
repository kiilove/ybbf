const webCrypto = (globalThis as any).crypto;

/**
 * 비밀번호 해싱을 위한 무작위 솔트(Salt)를 생성합니다.
 */
export function generateSalt(): string {
  const arr = new Uint8Array(16);
  webCrypto.getRandomValues(arr);
  return Array.from(arr).map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * 입력된 비밀번호와 솔트를 조합하여 단방향 해싱합니다.
 * 에지의 CPU 실행 제한을 감안하여 PBKDF2-SHA512 알고리즘을 사용합니다.
 */
export async function hashPassword(password: string, salt: string, pepper?: string): Promise<string> {
  const encoder = new TextEncoder();
  const inputPassword = pepper ? password + pepper : password;
  const passwordKey = await webCrypto.subtle.importKey(
    'raw',
    encoder.encode(inputPassword),
    { name: 'PBKDF2' },
    false,
    ['deriveBits']
  );
  
  const derivedBits = await webCrypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: encoder.encode(salt),
      iterations: 1000,
      hash: 'SHA-512'
    },
    passwordKey,
    512 // 512 bits = 64 bytes
  );
  
  return Array.from(new Uint8Array(derivedBits))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * 대칭키 문자열을 암호화/복호화에 적합한 CryptoKey 객체로 변환합니다. (AES-GCM 256비트)
 */
async function getCryptoKey(secretKey: string): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secretKey);
  
  // 입력 키를 SHA-256 해시하여 항상 32바이트(256비트)의 규격화된 키를 획득합니다.
  const hashBuffer = await webCrypto.subtle.digest('SHA-256', keyData);
  
  return webCrypto.subtle.importKey(
    'raw',
    hashBuffer,
    { name: 'AES-GCM' },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * AES-256-GCM 알고리즘으로 평문을 암호화합니다. (Web Crypto Subtle 사용)
 * 리턴 형식: ivHex:cipherTextAndTagHex
 */
export async function encryptText(text: string, secretKey: string): Promise<string> {
  if (!text) return '';
  const key = await getCryptoKey(secretKey);
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  
  const iv = new Uint8Array(12);
  webCrypto.getRandomValues(iv);
  
  const encryptedBuffer = await webCrypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: iv
    },
    key,
    data
  );
  
  const ivHex = Array.from(iv).map(b => b.toString(16).padStart(2, '0')).join('');
  const encryptedHex = Array.from(new Uint8Array(encryptedBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
    
  return `${ivHex}:${encryptedHex}`;
}

/**
 * AES-256-GCM 알고리즘으로 암호문을 복호화합니다. (Web Crypto Subtle 사용)
 */
export async function decryptText(encryptedText: string, secretKey: string): Promise<string> {
  if (!encryptedText) return '';
  const parts = encryptedText.split(':');
  if (parts.length !== 2) {
    throw new Error('올바르지 않은 암호화 형식입니다. (Web Crypto 규격 불일치)');
  }
  
  const [ivHex, encryptedHex] = parts;
  const key = await getCryptoKey(secretKey);
  
  // Hex 문자열을 Uint8Array 바이트 배열로 디코딩
  const iv = new Uint8Array(ivHex.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16)));
  const encryptedData = new Uint8Array(encryptedHex.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16)));
  
  const decryptedBuffer = await webCrypto.subtle.decrypt(
    {
      name: 'AES-GCM',
      iv: iv
    },
    key,
    encryptedData
  );
  
  return new TextDecoder().decode(decryptedBuffer);
}
