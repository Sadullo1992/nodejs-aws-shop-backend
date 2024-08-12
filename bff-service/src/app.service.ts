import { HttpService } from '@nestjs/axios';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { AxiosRequestConfig, AxiosResponse } from 'axios';
import { Cache } from 'cache-manager';
import { Request } from 'express';
import { lastValueFrom, map } from 'rxjs';
import { stripTrailingSlash } from './helpers/stripTrailingSlash';

@Injectable()
export class AppService {
  constructor(
    private httpService: HttpService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  async getResponseFromService(
    serviceName: string,
    serviceUrl: string,
    req: Request,
  ): Promise<AxiosResponse<any, unknown>> {
    const baseURL = stripTrailingSlash(serviceUrl);
    const url = req.originalUrl.replace(`/${serviceName}`, '');

    const headers = req.headers.authorization
      ? { Authorization: req.headers.authorization }
      : {};

    const config: AxiosRequestConfig = {
      url,
      baseURL,
      method: req.method,
      data: req.body,
      headers,
    };

    const isCacheRequest =
      req.method === 'GET' && url === '/products' && serviceName === 'product';

    try {
      const cachedProductsRes =
        await this.cacheManager.get<AxiosResponse>('products');
      console.log('request: ', isCacheRequest);
      console.log('value', !!cachedProductsRes);

      if (isCacheRequest && cachedProductsRes) {
        return cachedProductsRes;
      }

      const request = this.httpService.request(config).pipe(map((res) => res));
      const res = await lastValueFrom(request);

      if (isCacheRequest) {
        await this.cacheManager.set('products', res);
        return res;
      }

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
