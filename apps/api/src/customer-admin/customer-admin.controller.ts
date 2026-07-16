import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import type { Request } from 'express';

import { CustomerAdminService } from './customer-admin.service';

const CUSTOMER_COOKIE = 'dawu_customer_session';

@Controller('customer-admin')
export class CustomerAdminController {
  constructor(
    private readonly customerAdminService: CustomerAdminService,
  ) {}

  @Get('dashboard')
  dashboard(@Req() request: Request) {
    return this.customerAdminService.getDashboard(
      this.getToken(request),
    );
  }

  @Get('customers')
  customers(
    @Req() request: Request,
    @Query('search') search?: string,
    @Query('role') role?: string,
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.customerAdminService.getCustomers(
      this.getToken(request),
      {
        search,
        role,
        status,
        page: Number(page) || 1,
        limit: Number(limit) || 20,
      },
    );
  }

  @Get('customers/:id')
  customer(
    @Req() request: Request,
    @Param('id') customerId: string,
  ) {
    return this.customerAdminService.getCustomer(
      this.getToken(request),
      customerId,
    );
  }

  @Patch('customers/:id/profile')
  updateProfile(
    @Req() request: Request,
    @Param('id') customerId: string,
    @Body() body: any,
  ) {
    return this.customerAdminService.updateProfile(
      this.getToken(request),
      customerId,
      {
        name: body.name,
        email: body.email,
        phone: body.phone,
      },
      this.getRequestInfo(request),
    );
  }

  @Post('customers/:id/block')
  blockCustomer(
    @Req() request: Request,
    @Param('id') customerId: string,
    @Body() body: any,
  ) {
    return this.customerAdminService.blockCustomer(
      this.getToken(request),
      customerId,
      body.reason,
      this.getRequestInfo(request),
    );
  }

  @Post('customers/:id/unblock')
  unblockCustomer(
    @Req() request: Request,
    @Param('id') customerId: string,
  ) {
    return this.customerAdminService.unblockCustomer(
      this.getToken(request),
      customerId,
      this.getRequestInfo(request),
    );
  }

  @Post('customers/:id/reset-password')
  resetPassword(
    @Req() request: Request,
    @Param('id') customerId: string,
    @Body() body: any,
  ) {
    return this.customerAdminService.resetPassword(
      this.getToken(request),
      customerId,
      body.password,
      this.getRequestInfo(request),
    );
  }

  @Post('customers/:id/revoke-sessions')
  revokeSessions(
    @Req() request: Request,
    @Param('id') customerId: string,
  ) {
    return this.customerAdminService.revokeSessions(
      this.getToken(request),
      customerId,
      this.getRequestInfo(request),
    );
  }

  @Patch('customers/:id/role')
  updateRole(
    @Req() request: Request,
    @Param('id') customerId: string,
    @Body() body: any,
  ) {
    return this.customerAdminService.updateRole(
      this.getToken(request),
      customerId,
      body.role,
      this.getRequestInfo(request),
    );
  }

  @Delete('customers/:id')
  deleteCustomer(
    @Req() request: Request,
    @Param('id') customerId: string,
  ) {
    return this.customerAdminService.deleteCustomer(
      this.getToken(request),
      customerId,
      this.getRequestInfo(request),
    );
  }

  @Post('customers/:id/restore')
  restoreCustomer(
    @Req() request: Request,
    @Param('id') customerId: string,
  ) {
    return this.customerAdminService.restoreCustomer(
      this.getToken(request),
      customerId,
      this.getRequestInfo(request),
    );
  }

  @Get('audit-logs')
  auditLogs(
    @Req() request: Request,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
  ) {
    return this.customerAdminService.getAuditLogs(
      this.getToken(request),
      {
        page: Number(page) || 1,
        limit: Number(limit) || 30,
        search,
      },
    );
  }

  private getToken(request: Request) {
    const cookieHeader = request.headers.cookie;

    if (!cookieHeader) {
      return null;
    }

    for (const part of cookieHeader.split(';')) {
      const [name, ...valueParts] =
        part.trim().split('=');

      if (name === CUSTOMER_COOKIE) {
        return decodeURIComponent(
          valueParts.join('='),
        );
      }
    }

    return null;
  }

  private getRequestInfo(request: Request) {
    const forwardedFor =
      request.headers['x-forwarded-for'];

    const ip =
      typeof forwardedFor === 'string'
        ? forwardedFor.split(',')[0].trim()
        : request.socket.remoteAddress || null;

    return {
      ip,
      userAgent:
        request.headers['user-agent'] || null,
    };
  }
}