import prisma from '../db.js';

export const CLAUDE_PRICING = {
    input: 3, // $ per 1M tokens
    output: 15 // $ per 1M tokens
};

export const CREDIT_TO_TOKEN_RATIO = {
    input: 500, // 1 credit = 500 input tokens
    output: 300 // 1 credit = 300 output tokens
};

/**
 * Deducts credits and logs usage.
 * Input: 1 credit per 500 tokens
 * Output: 1 credit per 300 tokens
 */
export async function deductCredits(params: {
    userId: string;
    inputTokens: number;
    outputTokens: number;
    model: string;
    provider: string;
}) {
    const { userId, inputTokens, outputTokens, model, provider } = params;

    // 1. Calculate Credits Used
    const inputCredits = inputTokens / CREDIT_TO_TOKEN_RATIO.input;
    const outputCredits = outputTokens / CREDIT_TO_TOKEN_RATIO.output;
    const totalCreditsUsed = inputCredits + outputCredits;

    // 2. Calculate Actual Cost in USD (Approx for internal tracking)
    const inputCostUSD = (inputTokens / 1_000_000) * CLAUDE_PRICING.input;
    const outputCostUSD = (outputTokens / 1_000_000) * CLAUDE_PRICING.output;
    const totalCostUSD = inputCostUSD + outputCostUSD;

    // 3. Update User and Log Usage inside a transaction
    try {
        await prisma.$transaction([
            prisma.user.upsert({
                where: { id: userId },
                update: {
                    credits: { decrement: totalCreditsUsed },
                    totalCostUSD: { increment: totalCostUSD }
                },
                create: {
                    id: userId,
                    email: 'syncing...', // Will be updated on actual sync
                    credits: 0 - totalCreditsUsed,
                    totalCostUSD: totalCostUSD
                }
            }),
            prisma.usageLog.create({
                data: {
                    userId,
                    inputTokens,
                    outputTokens,
                    creditsUsed: totalCreditsUsed,
                    costUSD: totalCostUSD,
                    model,
                    provider
                }
            })
        ]);
        return { totalCreditsUsed, totalCostUSD };
    } catch (error) {
        console.error('Failed to deduct credits:', error);
        return { totalCreditsUsed: 0, totalCostUSD: 0 };
    }
}
