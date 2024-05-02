import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import Mongoose from 'mongoose';
import { ClientProxy } from '@nestjs/microservices';
import * as nodemailer from 'nodemailer';
import * as fetchMock from 'fetch-mock';

import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { ReqresService } from '../libs/reqres.service';
import { EmailService } from '../libs/email.service';
import { User, UserDocument, UserSchema } from './users.schema';

describe('UsersController', () => {
  let userController: UsersController;
  let client: ClientProxy;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
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

    client = module.get<ClientProxy>('USER_SERVICE');
    userController = module.get<UsersController>(UsersController);
  });

  it('should be defined', () => {
    expect(userController).toBeDefined();
  });

  it('should create a user', async () => {
    const createUserDto = {
      name: 'test1',
      job: 'job1',
    };

    const userResponse = { id: '123', name: 'test2', job: 'job2' };
    fetchMock.post('https://reqres.in/api/users', {
      status: 201,
      body: JSON.stringify(userResponse),
    });

    jest.spyOn(client, 'emit').mockReturnValue(undefined);
    jest.spyOn(nodemailer, 'createTransport').mockReturnValue(undefined);

    const result = await userController.createUser(createUserDto);

    expect(nodemailer.createTransport).toHaveBeenCalled();
    expect(client.emit).toHaveBeenCalledWith(
      'user_created',
      'User has been created',
    );

    expect(result).toEqual({ user: userResponse });

    fetchMock.restore();
  });

  it('should get a user', async () => {
    const userResponse = {
      id: 2,
      email: 'janet.weaver@reqres.in',
      first_name: 'Janet',
      last_name: 'Weaver',
      avatar: 'https://reqres.in/img/faces/2-image.jpg',
    };
    fetchMock.get('https://reqres.in/api/users/1', {
      status: 200,
      body: JSON.stringify({ data: userResponse }),
    });

    const result = await userController.getUser('1');

    expect(result).toEqual({ user: userResponse });

    fetchMock.restore();
  });
});
