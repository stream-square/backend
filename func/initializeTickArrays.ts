import {
  PDAUtil,
  WhirlpoolIx,
  ORCA_WHIRLPOOL_PROGRAM_ID,
  TickUtil,
} from '@orca-so/whirlpools-sdk';
import { TransactionInstruction, Transaction } from '@solana/web3.js';

/**
 * Initializes the necessary TickArrays for a given position.
 * This should be called before calling openPosition().
 */
export async function initializeTickArrays(
  ctx,
  wallet,
  poolAddress,
  tickLower,
  tickUpper,
  tickSpacing,
) {
  const startTickLower = TickUtil.getStartTickIndex(tickLower, tickSpacing);
  const startTickUpper = TickUtil.getStartTickIndex(tickUpper, tickSpacing);

  const tickArrayLowerPda = PDAUtil.getTickArray(
    ORCA_WHIRLPOOL_PROGRAM_ID,
    poolAddress,
    startTickLower,
  );
  const tickArrayUpperPda = PDAUtil.getTickArray(
    ORCA_WHIRLPOOL_PROGRAM_ID,
    poolAddress,
    startTickUpper,
  );

  console.log('Pool Address:', poolAddress.toBase58());
  console.log('StartTickLower:', startTickLower);
  console.log('StartTickUpper:', startTickUpper);
  console.log('TickArrayLower PDA:', tickArrayLowerPda.publicKey.toBase58());
  console.log('TickArrayUpper PDA:', tickArrayUpperPda.publicKey.toBase58());

  const ixList: TransactionInstruction[] = [];

  // Check if the TickArray account exists. If not, add the initialization instruction.
  const maybePushInitIx = async (
    startTick: number,
    tickArrayPda: ReturnType<typeof PDAUtil.getTickArray>,
  ) => {
    const acc = await ctx.connection.getAccountInfo(tickArrayPda.publicKey);
    if (!acc) {
      const ix = WhirlpoolIx.initTickArrayIx(ctx.program, {
        whirlpool: poolAddress,
        funder: wallet.publicKey,
        startTick,
        tickArrayPda,
      });
      ixList.push(...ix.instructions);
    } else {
      console.log(
        `TickArray already initialized: ${tickArrayPda.publicKey.toBase58()}`,
      );
    }
  };

  await maybePushInitIx(startTickLower, tickArrayLowerPda);
  if (
    tickArrayLowerPda.publicKey.toBase58() !==
    tickArrayUpperPda.publicKey.toBase58()
  ) {
    await maybePushInitIx(startTickUpper, tickArrayUpperPda);
  }

  if (ixList.length === 0) {
    console.log('No new TickArrays to initialize.');
    return;
  }

  const tx = new Transaction().add(...ixList);
  const sig = await ctx.provider.sendAndConfirm(tx);
  console.log('TickArrays initialized');
  console.log('Transaction Signature:', sig);
}
