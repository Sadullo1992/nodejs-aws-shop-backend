import { HttpService } from '@nestjs/axios';
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
import { Request } from 'express';
import { lastValueFrom, map } from 'rxjs';
import { stripTrailingSlash } from './helpers/stripTrailingSlash';

@Injectable()
export class AppService {
  constructor(private httpService: HttpService) {}

  async getResponseFromService(
    serviceName: string,
    serviceUrl: string,
    req: Request,
  ): Promise<AxiosResponse<any, unknown>> {
    const baseURL = stripTrailingSlash(serviceUrl);
    const url = req.originalUrl.replace(`/${serviceName}`, '');

    const headers =
      req.headers.authorization ? { Authorization: req.headers.authorization }
        : {};

    const config: AxiosRequestConfig = {
      url,
      baseURL,
      method: req.method,
      data: req.body,
      headers,
    };

    

    try {
      const request = this.httpService.request(config).pipe(map((res) => res));

      const res = await lastValueFrom(request);

      return res;
    } catch (e) {
      if (e.response) {
        return e.response;
      }
      throw new HttpException(
        'Internal server error',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
