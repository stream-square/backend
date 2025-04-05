import { WhirlpoolContext, WhirlpoolIx } from '@orca-so/whirlpools-sdk';
import { Wallet } from '@coral-xyz/anchor';
import { Keypair, Transaction, PublicKey } from '@solana/web3.js';

/**
 * Creates a new Whirlpools config account on Solana.
 * @param ctx - WhirlpoolContext containing the Anchor provider and program.
 * @param wallet - Wallet used to fund and authorize the transaction.
 * @returns The public key of the created whirlpools config account.
 */
export async function createWhirlpoolsConfig(
  ctx: WhirlpoolContext,
  wallet: Wallet,
): Promise<PublicKey> {
  // Generate a new keypair for the whirlpools config account
  const configKeypair = Keypair.generate();

  // Create the initialize config instruction
  const ix = WhirlpoolIx.initializeConfigIx(ctx.program, {
    whirlpoolsConfigKeypair: configKeypair,
    funder: wallet.publicKey,
    rewardEmissionsSuperAuthority: wallet.publicKey,
    feeAuthority: wallet.publicKey,
    collectProtocolFeesAuthority: wallet.publicKey,
    defaultProtocolFeeRate: 300, // 3%
  });

  // Send the transaction with the generated config keypair
  const tx = await ctx.provider.sendAndConfirm(
    new Transaction().add(...ix.instructions),
    [configKeypair],
  );

  // Log the result
  console.log('Whirlpools config account created.');
  console.log('Config public key:', configKeypair.publicKey.toBase58());

  return configKeypair.publicKey;
}
