import {
  Controller,
  Post,
  Get,
  Body,
  Query,
  Param,
  BadRequestException,
} from '@nestjs/common';
import { AgentService, AgentHeartbeatDto } from './agent.service';
import { Public } from '../common/decorators/public.decorator';

@Controller('agent')
export class AgentController {
  constructor(private readonly agentService: AgentService) {}

  @Public()
  @Post('heartbeat')
  async heartbeat(@Body() dto: AgentHeartbeatDto) {
    if (!dto.shopSlug) {
      throw new BadRequestException('shopSlug is required');
    }
    const result = await this.agentService.handleHeartbeat(dto);
    return {
      message: 'Agent heartbeat processed',
      data: result,
    };
  }

  @Public()
  @Get('jobs')
  async getPendingJobs(@Query('shopSlug') shopSlug: string) {
    if (!shopSlug) {
      throw new BadRequestException('shopSlug is required');
    }
    const jobs = await this.agentService.getPendingJobs(shopSlug);
    return {
      message: 'Pending jobs retrieved',
      data: jobs,
    };
  }

  @Public()
  @Post('jobs/status')
  async updateJobStatus(
    @Body()
    dto: {
      orderNumber: string;
      jobId?: string;
      status: 'PRINTING' | 'PRINTED' | 'FAILED';
      printerName?: string;
      errorMessage?: string;
    },
  ) {
    if (!dto.orderNumber || !dto.status) {
      throw new BadRequestException('orderNumber and status are required');
    }
    const result = await this.agentService.updateJobStatus(dto);
    return {
      message: 'Job status updated',
      data: result,
    };
  }
}
