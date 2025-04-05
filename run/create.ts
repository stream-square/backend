import {
  buildWhirlpoolClient,
  WhirlpoolContext,
  ORCA_WHIRLPOOL_PROGRAM_ID,
} from '@orca-so/whirlpools-sdk';
import { Wallet, AnchorProvider } from '@coral-xyz/anchor';
import { Connection } from '@solana/web3.js';
import { format } from 'path';
import { loadKeypairFromFile } from '../utils/load';
import { writeProgramJsonToFile } from '../utils/json';
import { createPool } from '../func/createPool';
import { createFeeTier } from '../func/createFeeTier';
import { createWhirlpoolsConfig } from '../func/createConfig';
import { initializeTickArrays } from '../func/initializeTickArrays';
import { openPosition } from '../func/openPosition';

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

  for (let i = 0; i < 1; i++) {
    // 5. Create Whirlpools config and save to file
    const whirlpoolsConfig = await createWhirlpoolsConfig(ctx, wallet);
    writeProgramJsonToFile(`Whirlpools${i}Config.json`, {
      name: `Whirlpools${i}Config`,
      address: whirlpoolsConfig.toBase58(),
    });

    // 6. Create FeeTier and save to file
    const feeTier = await createFeeTier(ctx, wallet, whirlpoolsConfig, 64);
    writeProgramJsonToFile(`FeeTier${i}.json`, {
      name: `FeeTier${i}`,
      address: feeTier.toBase58(),
    });

    // 7. Create a Whirlpool pool and save to file
    const pool = await createPool(ctx, wallet, whirlpoolsConfig);
    writeProgramJsonToFile(`Whirlpools${i}.json`, {
      name: `Whirlpools${i}`,
      address: pool.toBase58(),
    });

    // 🔽 Build Whirlpool client to fetch pool info
    const client = buildWhirlpoolClient(ctx);
    const whirlpool = await client.getPool(pool);
    const poolData = whirlpool.getData();
    const tickSpacing = poolData.tickSpacing;
    const currentTick = poolData.tickCurrentIndex;

    // 🔽 Calculate tick range
    const tickLower =
      Math.floor((currentTick - tickSpacing * 2) / tickSpacing) * tickSpacing;
    const tickUpper =
      Math.floor((currentTick + tickSpacing * 2) / tickSpacing) * tickSpacing;

    // 7.5. Initialize TickArrays
    await initializeTickArrays(
      ctx,
      wallet,
      pool,
      tickLower,
      tickUpper,
      tickSpacing,
    );

    // 8. Open a position and save to file
    const position = await openPosition(ctx, wallet, pool);
    writeProgramJsonToFile(`Whirlpools${i}Position.json`, {
      name: `Whirlpools${i}Position`,
      address: position.toBase58(),
    });
  }
}

void main();
