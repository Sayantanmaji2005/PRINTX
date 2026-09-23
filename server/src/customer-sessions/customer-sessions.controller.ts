import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  Req,
} from '@nestjs/common';
import { Request } from 'express';
import { CustomerSessionsService } from './customer-sessions.service';
import { StartSessionDto } from './dto/start-session.dto';
import { Public } from '../common/decorators/public.decorator';

@Controller('customer-sessions')
export class CustomerSessionsController {
  constructor(
    private readonly sessionsService: CustomerSessionsService,
  ) {}

  @Public()
  @Post('start')
  async startSession(
    @Body() dto: StartSessionDto,
    @Req() req: Request,
  ) {
    const ip = (req.headers['x-forwarded-for'] as string) || req.ip;
    const session = await this.sessionsService.startSession(dto, ip);
    return {
      message: 'Guest session created successfully',
      data: session,
    };
  }

  @Public()
  @Get(':id')
  async getSession(@Param('id') id: string) {
    const session = await this.sessionsService.getSession(id);
    return {
      message: 'Session details retrieved',
      data: session,
    };
  }
}
