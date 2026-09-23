import { Module } from '@nestjs/common';
import { CustomerSessionsService } from './customer-sessions.service';
import { CustomerSessionsController } from './customer-sessions.controller';

@Module({
  controllers: [CustomerSessionsController],
  providers: [CustomerSessionsService],
  exports: [CustomerSessionsService],
})
export class CustomerSessionsModule {}
