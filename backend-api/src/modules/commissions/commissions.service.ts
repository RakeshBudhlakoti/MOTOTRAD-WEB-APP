import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/modules/prisma/prisma.service';
import { SettingsService } from '@/modules/settings/settings.service';
import { CommissionType, Product } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

@Injectable()
export class CommissionService {
  constructor(
    private prisma: PrismaService,
    private settingsService: SettingsService,
  ) {}

  async calculateCommission(productId: string, baseAmount: number | Decimal) {
    try {
      const product = await this.prisma.product.findUnique({
        where: { id: productId },
      });

      if (!product) {
        throw new Error('Product not found');
      }

      let enabled = false;
      let type: CommissionType = CommissionType.NONE;
      let amount = 0;
      let min = 0;
      let max = 0;

      if (product.useGlobalCommission) {
        const globalEnabled = await this.settingsService.getByKey('commission_enabled');
        enabled = globalEnabled === true || globalEnabled === 'true';
        console.log(`[CommissionService] Global Enabled: ${globalEnabled} -> ${enabled}`);
        
        if (enabled) {
          const globalType = await this.settingsService.getByKey('commission_type');
          type = (globalType as CommissionType) || CommissionType.NONE;
          
          const globalAmount = await this.settingsService.getByKey('commission_amount');
          amount = parseFloat(globalAmount || '0');
          
          const globalMin = await this.settingsService.getByKey('min_commission_amount');
          min = parseFloat(globalMin || '0');
          
          const globalMax = await this.settingsService.getByKey('max_commission_amount');
          max = parseFloat(globalMax || '0');
          console.log(`[CommissionService] Global Config: type=${type}, amount=${amount}, min=${min}, max=${max}`);
        }
      } else {
        enabled = product.commissionEnabled;
        type = product.commissionType;
        amount = product.commissionAmount ? parseFloat(product.commissionAmount.toString()) : 0;
        min = product.minCommissionAmount ? parseFloat(product.minCommissionAmount.toString()) : 0;
        max = product.maxCommissionAmount ? parseFloat(product.maxCommissionAmount.toString()) : 0;
        console.log(`[CommissionService] Product Config: enabled=${enabled}, type=${type}, amount=${amount}, min=${min}, max=${max}`);
      }

      if (!enabled || type === CommissionType.NONE) {
        console.log(`[CommissionService] Commission disabled or NONE`);
        return {
          baseAmount: Math.max(0.01, parseFloat(baseAmount.toString()) || 0),
          commissionAmount: 0,
          commissionType: CommissionType.NONE,
          finalAmount: Math.max(0.01, parseFloat(baseAmount.toString()) || 0),
        };
      }

      let commission = 0;
      const base = Math.max(0.01, parseFloat(baseAmount.toString()) || 0);
      console.log(`[CommissionService] Calculating for base: ${base}`);

      if (type === CommissionType.FLAT) {
        commission = amount;
      } else if (type === CommissionType.PERCENTAGE) {
        commission = (base * amount) / 100;
      }

      // Ensure commission is not NaN
      commission = isNaN(commission) ? 0 : commission;

      // Apply min/max limits
      if (min > 0 && commission < min) {
        commission = min;
      }
      if (max > 0 && commission > max) {
        commission = max;
      }

      // Ensure final values are non-negative
      commission = Math.max(0, commission);

      return {
        baseAmount: base,
        commissionAmount: commission,
        commissionType: type,
        commissionRate: amount, // The original percentage or flat value
        finalAmount: base + commission,
      };
    } catch (error) {
      console.error('[CommissionService] Error calculating commission:', error);
      // Fallback to no commission on error to avoid breaking the checkout
      const base = Math.max(0.01, parseFloat(baseAmount.toString()) || 0);
      return {
        baseAmount: base,
        commissionAmount: 0,
        commissionType: CommissionType.NONE,
        commissionRate: 0,
        finalAmount: base,
      };
    }
  }
}
