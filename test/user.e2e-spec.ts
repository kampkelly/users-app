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

describe('Users', () => {
  let app: INestApplication;

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
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();
  });

  it(`/users`, () => {
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

    fetchMock.restore();
  });

  afterAll(async () => {
    await app.close();
  });
});
