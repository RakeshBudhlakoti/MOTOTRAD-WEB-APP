import { Module, Global } from '@nestjs/common';
import { CommissionService } from './commissions.service';
import { SettingsModule } from '../settings/settings.module';
import { CommissionsController } from './commissions.controller';

@Global()
@Module({
  imports: [SettingsModule],
  controllers: [CommissionsController],
  providers: [CommissionService],
  exports: [CommissionService],
})
export class CommissionsModule {}
