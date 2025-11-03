import { BadRequestException, Inject, Injectable, Logger } from '@nestjs/common';
import { Decimal } from '@prisma/client/runtime/library';
import {
  AI_MODEL_COSTS,
  AI_MODEL_NAMES,
  AI_MODEL_TOKENS_PER_CREDIT,
  TAiModelNames,
} from '@supplysense/constant';
import { PrismaService } from '@supplysense/prisma';
import type { UsageRecord } from '@supplysense/prisma-client';
import { PUBLIC_COMPANY_ID } from '@/modules/chat/chat.controller';

/**
 * Interface defining parameters for token price calculation
 */
interface ITokenPriceCalculate {
  inputTokens: number;
  outputTokens: number;
  isDeductCredit?: boolean; // Whether to deduct credits from company subscription
  modelUsed?: TAiModelNames; // Name of the AI tool/model used
  companyId: string; // ID of the company to charge
  metadata?: Record<string, string>; // Additional metadata for usage tracking
  tx?: PrismaService; // Transactional Prisma service instance
}

/**
 * Shared service for common business logic across the application
 * Handles AI token usage calculation, billing, and usage tracking
 */
@Injectable()
export class TokenAndCredit {
  private readonly logger = new Logger(TokenAndCredit.name);
  constructor(
    @Inject(PrismaService)
    private readonly prismaService: PrismaService
  ) {}

  async tokenPriceCalculate({
    inputTokens,
    outputTokens,
    isDeductCredit = false,
    companyId,
    modelUsed = AI_MODEL_NAMES.DEEPSEEK,
    metadata = {},
    tx,
  }: ITokenPriceCalculate) {
    // get the input and output token costs dynamically based on
    const modelCosts = AI_MODEL_COSTS[modelUsed] || AI_MODEL_COSTS[AI_MODEL_NAMES.DEEPSEEK];

    const run = async (prisma: PrismaService) => {
      // Calculate input token cost (cost per 1M tokens converted to actual usage)
      const calculatedInputPrice = (modelCosts.input / 1000000) * inputTokens;

      // Calculate output token cost (cost per 1M tokens converted to actual usage)
      const calculatedOutputPrice = (modelCosts.output / 1000000) * outputTokens;

      // Calculate total tokens used
      const totalTokens = inputTokens + outputTokens;

      // Calculate total cost in USD
      const totalTokenPrice = calculatedInputPrice + calculatedOutputPrice;

      // Convert tokens to credits (rounded up to nearest whole credit)
      const totalCredit = Math.ceil(totalTokens / AI_MODEL_TOKENS_PER_CREDIT);

      // Deduct credits from company subscription if requested
      if (isDeductCredit) {
        await prisma.companySubscription.update({
          where: { companyId },
          data: { remainingCredits: { decrement: totalCredit } },
        });
      }

      // Prepare usage record data (excluding auto-generated fields)
      const usageRecordInput: Omit<UsageRecord, 'id' | 'timestamp'> = {
        companyId,
        inputTokens,
        outputTokens,
        totalTokens,
        modelUsed,
        toolUsed: '',
        costUSD: new Decimal(totalTokenPrice), // Using Decimal for precise currency handling
        creditsCharged: totalCredit,
        metadata,
      };
      this.logger.debug('Usage record Input:', usageRecordInput);

      // Create usage record in database for tracking and analytics
      await prisma.usageRecord.create({
        data: usageRecordInput,
      });
    };

    if (tx) {
      // Use provided transaction
      await run(tx);
    } else {
      // Start a new transaction
      await this.prismaService.$transaction(async (prisma) => {
        await run(prisma as PrismaService);
      });
    }
  }
  /**
   * this will be used for general purpose credit checks
   **/
  async isAvailableCredit(companyId: string) {
    const companySubscription = await this.prismaService.companySubscription.findFirst({
      where: { companyId },
      select: { remainingCredits: true },
    });
    if (!companySubscription) {
      throw new BadRequestException('No subscription plan purchased');
    }
    return companySubscription.remainingCredits.gt(0);
  }

  /**
   * this will be used for only chat credit checks
   **/
  async isAvailableChatCredit(companyId: string) {
    const available = await this.isAvailableCredit(companyId);
    return available;
  }
  // this will be used for all credit checks other than chat
  async canContinueFurther(companyId: string) {
    const hasAvailableCredit = await this.isAvailableCredit(companyId);
    if (!hasAvailableCredit) {
      this.logger.error('Insufficient credit for generating descriptions');
      throw new BadRequestException('Insufficient credit');
    }
  }
  // this will be used for chat only
  async canContinueForChat(companyId: string) {
    // Skip credit check for public messages (public company ID)
    if (companyId === PUBLIC_COMPANY_ID) {
      return true;
    }

    const hasAvailableCredit = await this.isAvailableChatCredit(companyId);
    if (!hasAvailableCredit) {
      this.logger.error('Insufficient credit for generating descriptions');
      throw new BadRequestException('Insufficient credit');
    }
  }
}
