import {
  buildWhirlpoolClient,
  PDAUtil,
  WhirlpoolIx,
  ORCA_WHIRLPOOL_PROGRAM_ID,
} from '@orca-so/whirlpools-sdk';
import {
  Keypair,
  PublicKey,
  Transaction,
  sendAndConfirmTransaction,
} from '@solana/web3.js';
import { getAssociatedTokenAddress } from '@solana/spl-token';

/**
 * Opens a new position in the given Whirlpool pool.
 * @param ctx - WhirlpoolContext with provider and program.
 * @param wallet - Wallet used to authorize the transaction.
 * @param poolAddress - The address of the Whirlpool pool.
 * @returns The public key of the position mint (NFT).
 */
export async function openPosition(ctx, wallet, poolAddress: PublicKey) {
  // 1. Load the pool
  const client = buildWhirlpoolClient(ctx);
  const whirlpool = await client.getPool(poolAddress);
  const data = whirlpool.getData();

  // 2. Define tick range (tickLower, tickUpper)
  const tickSpacing = data.tickSpacing;
  const currentTick = data.tickCurrentIndex;

  const tickLower =
    Math.floor((currentTick - tickSpacing * 2) / tickSpacing) * tickSpacing;
  const tickUpper =
    Math.floor((currentTick + tickSpacing * 2) / tickSpacing) * tickSpacing;
  console.log('tickLower: ', tickLower);
  console.log('tickUpper: ', tickUpper);

  // 3. Generate a new keypair for the position NFT
  const positionMintKeypair = Keypair.generate();
  const positionPda = PDAUtil.getPosition(
    ORCA_WHIRLPOOL_PROGRAM_ID,
    positionMintKeypair.publicKey,
  );
  const positionTokenAccount = await getAssociatedTokenAddress(
    positionMintKeypair.publicKey,
    wallet.publicKey,
  );

  // 4. Create the openPosition instruction
  const ix = WhirlpoolIx.openPositionIx(ctx.program, {
    whirlpool: poolAddress,
    owner: wallet.publicKey,
    funder: wallet.publicKey,
    tickLowerIndex: tickLower,
    tickUpperIndex: tickUpper,
    positionPda: positionPda,
    positionMintAddress: positionMintKeypair.publicKey,
    positionTokenAccount: positionTokenAccount,
  });

  // 5. Build and send the transaction
  const tx = new Transaction().add(...ix.instructions);
  const sig = await sendAndConfirmTransaction(ctx.connection, tx, [
    wallet.payer,
    positionMintKeypair,
    ...ix.signers,
  ]);

  // Log result
  console.log('Position created successfully');
  console.log('Position mint:', positionMintKeypair.publicKey.toBase58());
  console.log('Transaction signature:', sig);

  return positionMintKeypair.publicKey;
}
