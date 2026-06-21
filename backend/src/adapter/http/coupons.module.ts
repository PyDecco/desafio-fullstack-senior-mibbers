import { Module } from '@nestjs/common';
import { ValidateCouponUseCase } from '../../usecase/validate-coupon.usecase';
import { CLOCK } from '../../ports/clock';
import { COUPON_REPOSITORY } from '../../ports/coupon-repository';
import { SystemClock } from './clock/system.clock';
import { InMemoryCouponRepository } from '../persistence/in-memory-coupon.repository';
import { seedCoupons } from '../persistence/seed';
import { CouponsController } from './coupons.controller';

@Module({
  controllers: [CouponsController],
  providers: [
    ValidateCouponUseCase,
    { provide: COUPON_REPOSITORY, useFactory: () => new InMemoryCouponRepository(seedCoupons()) },
    { provide: CLOCK, useClass: SystemClock },
  ],
})
export class CouponsModule {}
