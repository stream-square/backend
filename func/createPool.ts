import {
  WhirlpoolContext,
  buildWhirlpoolClient,
  PriceMath,
} from '@orca-so/whirlpools-sdk';
import { DecimalUtil } from '@orca-so/common-sdk';
import { Wallet } from '@coral-xyz/anchor';
import { PublicKey } from '@solana/web3.js';
import { serverConfig } from '../configs/config';

/**
 * Creates a new liquidity pool on the Whirlpool protocol.
 * @param ctx - WhirlpoolContext with provider and program ID.
 * @param wallet - Wallet to fund and authorize the pool creation.
 * @param config - WhirlpoolsConfig public key in string format.
 * @returns The public key of the created pool.
 */
export async function createPool(
  ctx: WhirlpoolContext,
  wallet: Wallet,
  whirlpoolsConfigKey: PublicKey,
) {
  // Create the Orca Whirlpool client
  const client = buildWhirlpoolClient(ctx);
  console.log('Orca Whirlpool client initialized on Devnet');

  const config = serverConfig();
  // zBTC
  const tokenMintA = new PublicKey(config.programs[0].address);
  // Meme
  const tokenMintB = new PublicKey(config.programs[1].address);

  const tickSpacing = 64;
  const initialPrice = DecimalUtil.fromNumber(1.0);
  const funder = wallet.publicKey;

  // Calculate sqrtPriceX64 and initial tick index (tick = 0 for price 1.0)
  const sqrtPriceX64 = PriceMath.priceToSqrtPriceX64(initialPrice, 6, 6);
  const initialTick = PriceMath.sqrtPriceX64ToTickIndex(sqrtPriceX64);

  // Create the pool with the given parameters
  const { poolKey, tx } = await client.createPool(
    whirlpoolsConfigKey,
    tokenMintA,
    tokenMintB,
    tickSpacing,
    initialTick,
    funder,
  );

  // Execute the transaction
  const sig = await tx.buildAndExecute();

  // Log results
  console.log('Pool created successfully');
  console.log('Pool Address:', poolKey.toBase58());
  console.log('Transaction Signature:', sig);

  return poolKey;
}
