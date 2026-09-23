import {
  Controller,
  Get,
  Post,
  Body,
  Param,
} from '@nestjs/common';
import { OrdersService, CalculatePriceDto, CreateOrderDto } from './orders.service';
import { Public } from '../common/decorators/public.decorator';

@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Public()
  @Post('calculate-price')
  async calculatePrice(@Body() dto: CalculatePriceDto) {
    const calculation = await this.ordersService.calculatePrice(dto);
    return {
      message: 'Price calculation retrieved',
      data: calculation,
    };
  }

  @Public()
  @Post()
  async createOrder(@Body() dto: CreateOrderDto) {
    const order = await this.ordersService.createOrder(dto);
    return {
      message: 'Order created successfully. Ready for UPI Payment.',
      data: order,
    };
  }

  @Public()
  @Get(':orderNumber')
  async getOrder(@Param('orderNumber') orderNumber: string) {
    const order = await this.ordersService.getOrderByNumber(orderNumber);
    return {
      message: 'Order details retrieved',
      data: order,
    };
  }

  @Public()
  @Post(':orderNumber/pay-simulate')
  async paySimulate(
    @Param('orderNumber') orderNumber: string,
    @Body() body: { transactionId?: string },
  ) {
    const order = await this.ordersService.markOrderPaid(
      orderNumber,
      body?.transactionId,
    );
    return {
      message: 'Payment verified and sent to Xerox shop printer queue',
      data: order,
    };
  }
}
