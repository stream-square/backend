import {
  WhirlpoolContext,
  WhirlpoolIx,
  PDAUtil,
  ORCA_WHIRLPOOL_PROGRAM_ID,
} from '@orca-so/whirlpools-sdk';
import { Wallet } from '@coral-xyz/anchor';
import { PublicKey, sendAndConfirmTransaction } from '@solana/web3.js';
import { Transaction } from '@solana/web3.js';

/**
 * Initializes a new FeeTier account for the given configuration and tick spacing.
 * @param ctx - WhirlpoolContext containing provider and program.
 * @param wallet - Wallet used to authorize and fund the transaction.
 * @param configKey - Public key of the whirlpools config account.
 * @param tickSpacing - Tick spacing value for this fee tier.
 * @returns The public key of the created FeeTier PDA.
 */
export async function createFeeTier(
  ctx: WhirlpoolContext,
  wallet: Wallet,
  whirlpoolsConfigKey: PublicKey,
  tickSpacing: number,
): Promise<PublicKey> {
  // Derive the FeeTier PDA
  const feeTierPda = PDAUtil.getFeeTier(
    ORCA_WHIRLPOOL_PROGRAM_ID,
    whirlpoolsConfigKey,
    tickSpacing,
  );

  // Build the initializeFeeTier instruction
  const ix = WhirlpoolIx.initializeFeeTierIx(ctx.program, {
    whirlpoolsConfig: whirlpoolsConfigKey,
    tickSpacing: tickSpacing,
    defaultFeeRate: 300, // 0.3%
    feeAuthority: wallet.publicKey,
    funder: wallet.publicKey,
    feeTierPda: feeTierPda,
  });

  // Create and send the transaction
  const tx = new Transaction().add(...ix.instructions);
  const sig = await sendAndConfirmTransaction(ctx.provider.connection, tx, [
    wallet.payer,
    ...ix.signers,
  ]);

  // Log the result
  console.log('FeeTier created for tickSpacing:', tickSpacing);
  console.log('FeeTier PDA:', feeTierPda.publicKey.toBase58());
  console.log('Transaction signature:', sig);

  return feeTierPda.publicKey;
}
