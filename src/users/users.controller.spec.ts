import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { ReqresService } from '../libs/reqres.service';
import { EmailService } from '../libs/email.service';
import { User, UserDocument } from './users.schema';

describe('UsersController', () => {
  let controller: UsersController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        UsersService,
        ReqresService,
        EmailService,
        {
          provide: 'USER_SERVICE',
          useValue: {},
        },
        {
          provide: getModelToken(User.name),
          useValue: {} as Model<UserDocument>,
        },
      ],
    }).compile();

    controller = module.get<UsersController>(UsersController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
