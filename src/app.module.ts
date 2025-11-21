import { Module } from '@nestjs/common';
import { DomainModule } from './domain/domain.module';
import { ConfigModule } from '@nestjs/config';
import { DBModule } from './database/db.module';
import { UserEntity } from './domain/user/entity/user.entity';

@Module({
  imports: [
    DomainModule,
    ConfigModule.forRoot({ isGlobal: true }),
    DBModule.forRoot({
      entities: [UserEntity],
    }),
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
