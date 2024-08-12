import { HttpModule } from '@nestjs/axios';
import { CacheModule } from '@nestjs/cache-manager';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [
    ConfigModule.forRoot(),
    HttpModule,
    CacheModule.register({ ttl: 120000 }), // ttl: 2 min
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
