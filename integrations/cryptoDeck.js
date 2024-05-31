const keyHexString = "54686973206973206120736563726574"; // Sua chave em formato hexadecimal
const fixedIVHexString = '00000000000000000000000000000000'; // IV fixo em formato hexadecimal
const keyBuffer = hexStringToArrayBuffer(keyHexString);

async function cryptoDeck(deckCards) {
  let a = await encrypt(deckCards, keyBuffer);
  return a;
}

async function encrypt(text, key) {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);

  const iv = hexStringToArrayBuffer(fixedIVHexString);

  const cryptoKey = await window.crypto.subtle.importKey(
    "raw",
    key,
    { name: "AES-CBC" },
    false,
    ["encrypt"]
  );

  const encryptedData = await window.crypto.subtle.encrypt(
    {
      name: "AES-CBC",
      iv: iv,
    },
    cryptoKey,
    data
  );

  // Convertendo o resultado da criptografia em uma string hexadecimal
  const encryptedBytes = new Uint8Array(encryptedData);
  const encryptedHexString = Array.from(encryptedBytes)
    .map(byte => ('00' + byte.toString(16)).slice(-2))
    .join('');

  return encryptedHexString;
}

async function decrypt(ciphertext, key) {
  const iv = hexStringToArrayBuffer(fixedIVHexString);
  const encryptedData = hexStringToArrayBuffer(ciphertext.slice(32));

  const cryptoKey = await window.crypto.subtle.importKey(
    "raw",
    key,
    { name: "AES-CBC" },
    false,
    ["decrypt"]
  );

  const decryptedData = await window.crypto.subtle.decrypt(
    {
      name: "AES-CBC",
      iv: iv,
    },
    cryptoKey,
    encryptedData
  );

  const decoder = new TextDecoder();
  const plaintext = decoder.decode(decryptedData);

  return plaintext;
}

function hexStringToArrayBuffer(hexString) {
  const bytes = new Uint8Array(hexString.length / 2);
  for (let i = 0; i < hexString.length; i += 2) {
    bytes[i / 2] = parseInt(hexString.slice(i, i + 2), 16);
  }
  return bytes.buffer;
}
