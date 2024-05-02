import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ClientsModule, Transport } from '@nestjs/microservices';

import { UsersService } from './users.service';
import { ReqresService } from '../libs/reqres.service';
import { EmailService } from '../libs/email.service';
import { UsersController } from './users.controller';
import { User, UserSchema } from './users.schema';
import { Avatar, AvatarSchema } from './avatar.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Avatar.name, schema: AvatarSchema },
    ]),
    ClientsModule.register([
      {
        name: 'USER_SERVICE',
        transport: Transport.RMQ,
        options: {
          urls: [process.env.RABBIT_MQ_URL],
          queue: 'users_queue',
          queueOptions: {
            durable: false,
          },
        },
      },
    ]),
  ],
  controllers: [UsersController],
  providers: [UsersService, ReqresService, EmailService],
})
export class UsersModule {}
