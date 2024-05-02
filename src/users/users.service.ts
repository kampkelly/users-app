import * as fs from 'fs';
import { v4 } from 'uuid';
import { Injectable, Inject } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ClientProxy } from '@nestjs/microservices';
import { Model } from 'mongoose';

import { User, UserDocument } from './users.schema';
import { Avatar, AvatarDocument } from './avatar.schema';
import { CreateUserDto, GetUserDto } from './dto/index';
import { ReqresService } from '../libs/reqres.service';
import { EmailService } from '../libs/email.service';

@Injectable()
export class UsersService {
  constructor(
    private readonly reqresService: ReqresService,
    private readonly emailService: EmailService,
    @Inject('USER_SERVICE') private client: ClientProxy,
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    @InjectModel(Avatar.name)
    private readonly avatarModel: Model<AvatarDocument>,
  ) {}

  async createUser(createUserDto: CreateUserDto): Promise<string> {
    const userRequest = await this.reqresService.makeRequest('users', 'POST', {
      ...createUserDto,
    });
    const newUser = new this.userModel({
      userId: userRequest.id,
      name: userRequest.name,
      job: userRequest.job,
    });

    const createdUser = await newUser.save();

    await this.emailService.sendEmail();
    this.client.emit('user_created', 'User has been created');

    return userRequest;
  }

  async getUser(id: string): Promise<any> {
    const userRequest = await this.reqresService.makeRequest(
      `users/${id}`,
      'GET',
    );

    return userRequest;
  }

  async getUserAvatar(userId: string): Promise<any> {
    const existingAvatar = await this.avatarModel.findOne({ userId });

    if (existingAvatar?.userId) {

      try {
        const base64Data = fs.readFileSync(
          `avatars/${existingAvatar.hash}.jpg`,
          { encoding: 'base64' },
        );
        return base64Data;
      } catch (error) {
        // continue
      }
    }

    const userRequest = await this.reqresService.makeRequest(
      `users/${userId}`,
      'GET',
    );

    if (!userRequest.data) {
      return null;
    }

    const response = await fetch(userRequest.data.avatar);

    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.statusText}`);
    }
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const fileNameHash = v4();
    const fileName = `avatars/${fileNameHash}.jpg`;
    fs.writeFileSync(fileName, buffer);

    const newAvatar = new this.avatarModel({
      userId: userRequest.data.id,
      hash: fileNameHash,
    });

    await newAvatar.save();

    const base64Data = buffer.toString('base64');
    return base64Data;
  }
}
