import {
  All,
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Param,
  Req,
  Res,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getIntro() {
    return 'BFF Service!';
  }

  @All([':serviceName/*', ':serviceName'])
  async redirectToService(
    @Param('serviceName') serviceName: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const serviceUrl = process.env[serviceName];
    if (!serviceUrl)
      throw new HttpException('Cannot process request', HttpStatus.BAD_GATEWAY);

    const serviceRes = await this.appService.getResponseFromService(
      serviceName,
      serviceUrl,
      req,
    );

    return res
      .set(serviceRes.headers)
      .status(serviceRes.status)
      .send(serviceRes.data);
  }
}
