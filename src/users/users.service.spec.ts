import 'dotenv/config';
import { Test, TestingModule } from '@nestjs/testing';
import { ClientProxy } from '@nestjs/microservices';
import { getModelToken } from '@nestjs/mongoose';
import Mongoose from 'mongoose';
import * as nodemailer from 'nodemailer';
import * as fetchMock from 'fetch-mock';

import { UsersService } from './users.service';
import { ReqresService } from '../libs/reqres.service';
import { EmailService } from '../libs/email.service';
import { User, UserDocument, UserSchema } from './users.schema';

describe('UsersService', () => {
  let userService: UsersService;
  let client: ClientProxy;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        ReqresService,
        EmailService,
        {
          provide: 'USER_SERVICE',
          useValue: {
            emit: jest.fn(),
          },
        },
        {
          provide: getModelToken(User.name),
          useFactory: () => {
            Mongoose.connect(process.env.TEST_DB_URL);
            return Mongoose.model<UserDocument>(User.name, UserSchema);
          },
        },
      ],
    }).compile();

    userService = module.get<UsersService>(UsersService);
    client = module.get<ClientProxy>('USER_SERVICE');
  });

  afterAll(async () => {
    await Mongoose.connection.close();
  });

  it('should be defined', () => {
    expect(userService).toBeDefined();
  });

  it('should create a user', async () => {
    const createUserDto = {
      name: 'test1',
      job: 'job1',
    };

    const userRequest = { id: '123', name: 'test2', job: 'job2' };
    fetchMock.post('https://reqres.in/api/users', {
      status: 201,
      body: JSON.stringify(userRequest),
    });

    jest.spyOn(client, 'emit').mockReturnValue(undefined);
    jest.spyOn(nodemailer, 'createTransport').mockReturnValue(undefined);

    const result = await userService.createUser(createUserDto);

    expect(nodemailer.createTransport).toHaveBeenCalled();
    expect(client.emit).toHaveBeenCalledWith(
      'user_created',
      'User has been created',
    );

    expect(result).toEqual(userRequest);

    fetchMock.restore();
  });
});
