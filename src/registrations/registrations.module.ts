import { Module } from '@nestjs/common';
import { RegistrationsController } from './registrations.controller';
import { RegistrationsService } from './registrations.service';
import { CompositorService } from './compositor.service';

@Module({
  controllers: [RegistrationsController],
  providers: [RegistrationsService, CompositorService],
  exports: [RegistrationsService, CompositorService],
})
export class RegistrationsModule {}
