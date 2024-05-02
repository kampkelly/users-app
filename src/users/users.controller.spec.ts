import * as fs from 'fs';
import { NotFoundException } from '@nestjs/common';
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
import { Avatar, AvatarDocument, AvatarSchema } from './avatar.schema';

describe('UsersController', () => {
  let userController: UsersController;
  let client: ClientProxy;
  let module: TestingModule;
  let avatarModel;

  beforeAll(async () => {
    module = await Test.createTestingModule({
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
        {
          provide: getModelToken(Avatar.name),
          useFactory: () => {
            Mongoose.connect(process.env.TEST_DB_URL);
            return Mongoose.model<AvatarDocument>(Avatar.name, AvatarSchema);
          },
        },
      ],
    }).compile();

    client = module.get<ClientProxy>('USER_SERVICE');
    userController = module.get<UsersController>(UsersController);

    avatarModel = module.get<Mongoose.Model<AvatarDocument>>(
      getModelToken(Avatar.name),
    );
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

  it('should get a user avatar for new user', async () => {
    const userResponse = {
      id: 1,
      email: 'janet.weaver@reqres.in',
      first_name: 'Janet',
      last_name: 'Weaver',
      avatar: 'https://reqres.in/img/faces/2-image.jpg',
    };
    fetchMock.get('https://reqres.in/api/users/1', {
      status: 200,
      body: JSON.stringify({ data: userResponse }),
    });

    const arrBuffer = new ArrayBuffer(2);

    fetchMock.get(userResponse.avatar, {
      status: 200,
      body: arrBuffer,
    });

    const mockWriteFileSync = jest
      .spyOn(fs, 'writeFileSync')
      .mockImplementation(() => {});

    const result = await userController.getUserAvatar('1');

    expect(mockWriteFileSync).toHaveBeenCalledWith(
      expect.any(String),
      expect.any(Buffer),
    );

    expect(typeof result.avatar).toBe('string');

    fetchMock.restore();
    mockWriteFileSync.mockRestore();
  });

  it('should retrieve user avatar for already stored user', async () => {
    const expectedBase64 = 'base64string';
    const mockReadFileSync = jest
      .spyOn(fs, 'readFileSync')
      .mockReturnValue(expectedBase64);

    const result = await userController.getUserAvatar('1');

    expect(mockReadFileSync).toHaveBeenCalledWith(
      expect.stringContaining('avatars/'),
      { encoding: 'base64' },
    );
    expect(result.avatar).toBe(expectedBase64);
    expect(typeof result.avatar).toBe('string');

    mockReadFileSync.mockRestore();
  });

  it('should delete user avatar', async () => {
    const mockRemoveFileSync = jest.spyOn(fs, 'unlinkSync').mockReturnValue();

    const result = await userController.deleteUserAvatar('1');

    expect(mockRemoveFileSync).toHaveBeenCalledWith(
      expect.stringContaining('avatars/'),
    );
    expect(result.message).toBe('Avatar file deleted successfully');

    mockRemoveFileSync.mockRestore();
  });

  it('should not delete user avatar if user not found', async () => {
    await expect(userController.deleteUserAvatar('1')).rejects.toThrow(
      NotFoundException,
    );

    await avatarModel.deleteMany({});
  });
});
