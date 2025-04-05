import { buildWhirlpoolClient } from '@orca-so/whirlpools-sdk';
import { PublicKey } from '@solana/web3.js';

/**
 * Fetches and logs detailed information about a position NFT.
 * @param ctx - WhirlpoolContext with provider and program.
 * @param positionMint - The mint address of the position NFT.
 * @returns Position account data.
 */
export async function getPositionInfo(ctx, positionMint: PublicKey) {
  const client = buildWhirlpoolClient(ctx);

  // Wait for the position account to be available (10 seconds)
  await new Promise((res) => setTimeout(res, 10000));

  // Fetch the position using the provided mint address
  const position = await client.getPosition(positionMint);
  const data = position.getData();

  // Log position data
  console.log('Position Info:');
  console.log('- Liquidity:', data.liquidity.toString());
  console.log('- Tick Lower:', data.tickLowerIndex);
  console.log('- Tick Upper:', data.tickUpperIndex);
  console.log('- Whirlpool:', data.whirlpool.toBase58());

  return data;
}
