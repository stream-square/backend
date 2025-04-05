import {
  WhirlpoolContext,
  ORCA_WHIRLPOOL_PROGRAM_ID,
} from '@orca-so/whirlpools-sdk';
import { Wallet, AnchorProvider } from '@coral-xyz/anchor';
import { Connection, PublicKey } from '@solana/web3.js';
import { format } from 'path';
import { loadKeypairFromFile } from '../utils/load';
import { writeProgramJsonToFile } from '../utils/json';
import { createPool } from '../func/createPool';
import { createFeeTier } from '../func/createFeeTier';
import { createWhirlpoolsConfig } from '../func/createConfig';
import { increaseLiquidity } from '../func/increaseLiquidity';

async function main() {
  // 1. Set up RPC connection
  const RPC_ENDPOINT = 'https://api.devnet.solana.com';
  const connection = new Connection(RPC_ENDPOINT, 'confirmed');

  // 2. Load wallet from local secret key file
  const SECRET_KEY_PATH = 'id.json';
  const wallet = new Wallet(loadKeypairFromFile(SECRET_KEY_PATH));

  // 3. Create Anchor provider
  const provider = new AnchorProvider(connection, wallet, {});

  // 4. Create Whirlpool context using the Devnet program ID
  const ctx = WhirlpoolContext.withProvider(
    provider,
    ORCA_WHIRLPOOL_PROGRAM_ID,
  );

  const pool = new PublicKey('CmH9ZMZCg2E3srXF4KR2j66A335wguNGYe1A5NFdpYUq');
  const positionMint = new PublicKey(
    '8oEfeDAsi3YwDyBxSkNJp5RKYHpEmUC1V8SQP1XbB1XD',
  );
  const position = await increaseLiquidity(
    ctx,
    wallet,
    pool,
    positionMint,
    100,
    100,
  );
}
void main();
