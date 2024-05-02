import * as fs from 'fs';
import 'dotenv/config';
import * as request from 'supertest';
import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import Mongoose from 'mongoose';
import { getModelToken } from '@nestjs/mongoose';
import * as fetchMock from 'fetch-mock';

import { AppModule } from '../src/app.module';
import { UsersModule } from '../src/users/users.module';
import { User, UserDocument, UserSchema } from '../src/users/users.schema';
import {
  Avatar,
  AvatarDocument,
  AvatarSchema,
} from '../src/users/avatar.schema';

describe('Users', () => {
  let app: INestApplication;
  let avatarModel;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule, UsersModule],
      providers: [
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

    avatarModel = moduleRef.get<Mongoose.Model<AvatarDocument>>(
      getModelToken(Avatar.name),
    );

    app = moduleRef.createNestApplication();
    await app.init();
  });

  it('/users - should not create a user with invalid data', async () => {
    const createUserDto = {
      title: 'test1',
      job: 'job1',
    };

    return request(app.getHttpServer())
      .post('/users')
      .send(createUserDto)
      .expect(400);
  });

  it(`/users - should create a user`, () => {
    const createUserDto = {
      name: 'test1',
      job: 'job1',
    };
    const userRequest = { id: '123', name: 'test2', job: 'job2' };

    fetchMock.post('https://reqres.in/api/users', {
      status: 201,
      body: JSON.stringify(userRequest),
    });

    return request(app.getHttpServer())
      .post('/users')
      .send(createUserDto)
      .expect(201)
      .expect({
        user: userRequest,
      });
  });

  it(`/user/:id`, () => {
    fetchMock.restore();
    const userResponse = {
      id: 2,
      email: 'janet.weaver@reqres.in',
      first_name: 'Janet',
      last_name: 'Weaver',
      avatar: 'https://reqres.in/img/faces/2-image.jpg',
    };

    fetchMock.get('https://reqres.in/api/users/2', {
      status: 200,
      body: JSON.stringify({ data: userResponse }),
    });

    return request(app.getHttpServer()).get('/user/2').expect(200).expect({
      user: userResponse,
    });
  });

  it('/api/user/{userId}/avatar - should get a user avatar for new user', async () => {
    fetchMock.restore();
    const userResponse = {
      id: 2,
      email: 'janet.weaver@reqres.in',
      first_name: 'Janet',
      last_name: 'Weaver',
      avatar: 'https://reqres.in/img/faces/2-image.jpg',
    };
    fetchMock.get('https://reqres.in/api/users/2', {
      status: 200,
      body: JSON.stringify({ data: userResponse }),
    });

    const arrBuffer = new ArrayBuffer(2);

    fetchMock.get(userResponse.avatar, {
      status: 200,
      body: arrBuffer,
    });

    jest.spyOn(fs, 'writeFileSync').mockImplementation(() => {});

    return request(app.getHttpServer())
      .get('/user/2/avatar')
      .expect(200)
      .expect((res) => {
        expect(typeof res.body.avatar).toBe('string');
      });
  });

  it('/api/user/{userId}/avatar - should retrieve user avatar for already stored user', async () => {
    const expectedBase64 = 'base64string';
    jest.spyOn(fs, 'readFileSync').mockReturnValue(expectedBase64);

    return request(app.getHttpServer())
      .get('/user/2/avatar')
      .expect(200)
      .expect((res) => {
        expect(typeof res.body.avatar).toBe('string');
      });
  });

  it('/api/user/{userId}/avatar', async () => {
    jest.spyOn(fs, 'unlinkSync').mockReturnValue();

    return request(app.getHttpServer()).delete('/user/2/avatar').expect(204);
  });

  it('/api/user/{userId}/avatar - should not delete user avatar if user not found', async () => {
    return request(app.getHttpServer()).delete('/user/2/avatar').expect(404);
  });

  afterAll(async () => {
    await avatarModel.deleteMany({});

    await app.close();
  });
});
