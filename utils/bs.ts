import fs from 'fs';
import path from 'path';
import bs58 from 'bs58';

/**
 * Decode a Base58-encoded private key string into a byte array and save it as JSON
 * @param base58Key Base58-encoded private key string
 * @param filePath Path to save the JSON file (e.g., "./privateKey.json")
 */
function savePrivateKeyAsJson(base58Key: string, filePath: string): void {
  try {
    const byteArray = bs58.decode(base58Key);
    const json = {
      base58: base58Key,
      byteArray: Array.from(byteArray), // Convert Uint8Array to a normal array
    };
    fs.writeFileSync(filePath, JSON.stringify(json, null, 2));
    console.log(`Private key has been saved as JSON: ${filePath}`);
  } catch (error) {
    console.error('Error while saving:', error);
  }
}

// Example usage
const base58PrivateKey = 'InputYourPrivateKey';
savePrivateKeyAsJson(
  base58PrivateKey,
  path.resolve(__dirname, '../key/id.json'),
);
