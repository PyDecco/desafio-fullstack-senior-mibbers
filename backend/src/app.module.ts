import { Module } from '@nestjs/common';
import { CouponsModule } from './adapter/http/coupons.module';

@Module({ imports: [CouponsModule] })
export class AppModule {}
