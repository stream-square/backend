import {
  buildWhirlpoolClient,
  WhirlpoolIx,
  PDAUtil,
  ORCA_WHIRLPOOL_PROGRAM_ID,
  NO_TOKEN_EXTENSION_CONTEXT,
  increaseLiquidityQuoteByInputToken,
} from '@orca-so/whirlpools-sdk';
import { DecimalUtil, Percentage } from '@orca-so/common-sdk';
import { BN } from '@coral-xyz/anchor';
import {
  getAccount,
  getMint,
  getAssociatedTokenAddress,
  getOrCreateAssociatedTokenAccount,
} from '@solana/spl-token';
import { Transaction } from '@solana/web3.js';
import { PublicKey } from '@solana/web3.js';

/**
 * Increases liquidity for an existing Whirlpool position.
 *
 * @param ctx - Whirlpool context with program and provider.
 * @param wallet - The wallet used to authorize and sign the transaction.
 * @param poolAddress - The address of the Whirlpool pool.
 * @param positionMint - The mint address of the position NFT.
 * @param tokenAmountA - Amount of token A to deposit (e.g. 100).
 * @param tokenAmountB - Amount of token B to deposit (e.g. 0.5).
 */
export async function increaseLiquidity(
  ctx,
  wallet,
  poolAddress: PublicKey,
  positionMint: PublicKey,
  tokenAmountA: number,
  tokenAmountB: number,
) {
  const client = buildWhirlpoolClient(ctx);
  const whirlpool = await client.getPool(poolAddress);
  const poolData = whirlpool.getData();

  const tokenMintA = poolData.tokenMintA;
  const tokenMintB = poolData.tokenMintB;

  // Get or create associated token accounts
  const tokenAccountA = await getOrCreateAssociatedTokenAccount(
    ctx.connection,
    wallet.payer,
    tokenMintA,
    wallet.publicKey,
  );
  const tokenAccountB = await getOrCreateAssociatedTokenAccount(
    ctx.connection,
    wallet.payer,
    tokenMintB,
    wallet.publicKey,
  );

  // Load position data
  const positionPda = PDAUtil.getPosition(
    ORCA_WHIRLPOOL_PROGRAM_ID,
    positionMint,
  );
  const position = await client.getPosition(positionPda.publicKey);
  const positionData = position.getData();
  console.log(positionData);

  // Calculate tick array PDAs from the position's tick range
  const tickArrayLower = PDAUtil.getTickArrayFromTickIndex(
    positionData.tickLowerIndex,
    poolData.tickSpacing,
    poolAddress,
    ORCA_WHIRLPOOL_PROGRAM_ID,
  );
  const tickArrayUpper = PDAUtil.getTickArrayFromTickIndex(
    positionData.tickUpperIndex,
    poolData.tickSpacing,
    poolAddress,
    ORCA_WHIRLPOOL_PROGRAM_ID,
  );

  // Fetch token mint decimals
  const decimalsA = (await getMint(ctx.connection, tokenMintA)).decimals;
  const decimalsB = (await getMint(ctx.connection, tokenMintB)).decimals;

  // Set slippage to 3%
  const slippage = Percentage.fromFraction(3, 100);

  // Generate liquidity quote using token A as input
  const quote = await increaseLiquidityQuoteByInputToken(
    poolData.tokenMintA,
    DecimalUtil.fromNumber(tokenAmountA, decimalsA),
    positionData.tickLowerIndex,
    positionData.tickUpperIndex,
    slippage,
    whirlpool,
    NO_TOKEN_EXTENSION_CONTEXT,
  );
  console.log('quote: ', quote);

  // Log current token balances
  const ataA = await getAssociatedTokenAddress(tokenMintA, wallet.publicKey);
  const accountA = await getAccount(ctx.connection, ataA);
  console.log('💰 Token A balance:', Number(accountA.amount) / 10 ** decimalsA);

  const ataB = await getAssociatedTokenAddress(tokenMintB, wallet.publicKey);
  const accountB = await getAccount(ctx.connection, ataB);
  console.log('💰 Token B balance:', Number(accountB.amount) / 10 ** decimalsB);

  // Build the instruction to increase liquidity
  const ix = WhirlpoolIx.increaseLiquidityIx(ctx.program, {
    whirlpool: poolAddress,
    positionAuthority: wallet.publicKey,
    position: positionPda.publicKey,
    positionTokenAccount: await getAssociatedTokenAddress(
      positionMint,
      wallet.publicKey,
    ),
    tokenOwnerAccountA: tokenAccountA.address,
    tokenOwnerAccountB: tokenAccountB.address,
    tokenVaultA: poolData.tokenVaultA,
    tokenVaultB: poolData.tokenVaultB,
    tickArrayLower: tickArrayLower.publicKey,
    tickArrayUpper: tickArrayUpper.publicKey,
    liquidityAmount: quote.liquidityAmount,
    tokenMaxA: quote.tokenMaxA,
    tokenMaxB: quote.tokenMaxB,
  });

  // Send and confirm the transaction
  const tx = new Transaction().add(...ix.instructions);
  const sig = await ctx.provider.sendAndConfirm(tx, [...ix.signers]);

  console.log('Liquidity added');
  console.log('Tx Signature:', sig);
}
