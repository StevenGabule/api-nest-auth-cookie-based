import { ConfigModule, ConfigService } from '@nestjs/config';
import { DynamicModule, Module } from '@nestjs/common';
import { DbConfig } from './db.interface';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';

@Module({})
export class DBModule {
  private static getConnectionOptions(
    config: ConfigService,
    dbConfig: DbConfig,
  ): TypeOrmModuleOptions {
    const databaseUrl = config.get<string>('DATABASE_URL');
    return {
      type: 'postgres',
      url: databaseUrl,
      ssl:
        process.env.NODE_ENV !== 'local' && process.env.NODE_ENV !== 'test'
          ? { rejectUnauthorized: false }
          : false,
      entities: dbConfig.entities,
      synchronize: true,
      logging: true,
    };
  }

  public static forRoot(dbConfig: DbConfig): DynamicModule {
    return {
      module: DBModule,
      imports: [
        TypeOrmModule.forRootAsync({
          imports: [ConfigModule],
          useFactory: (configService: ConfigService) =>
            DBModule.getConnectionOptions(configService, dbConfig),
          inject: [ConfigService],
        }),
      ],
      controllers: [],
      providers: [],
      exports: [],
    };
  }
}
