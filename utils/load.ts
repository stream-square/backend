import { Keypair } from '@solana/web3.js';
import fs from 'fs';
import path from 'path';

/**
 * Loads a Solana Keypair from a JSON file at the given path.
 * @param filePath - Path to the Keypair JSON file.
 * @returns Keypair object.
 * @throws Throws an error if the file does not exist or has an invalid format.
 */
export function loadKeypairFromFile(filePath: string): Keypair {
  const resolvedPath = path.resolve(__dirname, `../key/${filePath}`);

  try {
    const rawData = fs.readFileSync(resolvedPath, 'utf-8');
    const secretKey = Uint8Array.from(JSON.parse(rawData).byteArray);
    return Keypair.fromSecretKey(secretKey);
  } catch (err) {
    throw new Error(`Failed to load Keypair (${resolvedPath}): ${err}`);
  }
}
