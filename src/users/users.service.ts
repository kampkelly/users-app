import * as fs from 'fs';
import { v4 } from 'uuid';
import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ClientProxy } from '@nestjs/microservices';
import { Model } from 'mongoose';

import { User, UserDocument } from './users.schema';
import { Avatar, AvatarDocument } from './avatar.schema';
import { CreateUserDto } from './dto/index';
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
    const userResponse = await this.reqresService.makeRequest('users', 'POST', {
      ...createUserDto,
    });
    const newUser = new this.userModel({
      userId: userResponse.id,
      name: userResponse.name,
      job: userResponse.job,
    });

    await newUser.save();

    // send email
    await this.emailService.sendEmail();

    // emit an event
    this.client.emit('user_created', 'User has been created');

    return userResponse;
  }

  async getUser(id: string): Promise<any> {
    const userResponse = await this.reqresService.makeRequest(
      `users/${id}`,
      'GET',
    );

    return userResponse;
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

    const userResponse = await this.reqresService.makeRequest(
      `users/${userId}`,
      'GET',
    );

    if (!userResponse.data) {
      return null;
    }

    const response = await fetch(userResponse.data.avatar);

    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.statusText}`);
    }
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const fileNameHash = v4();
    const fileName = `avatars/${fileNameHash}.jpg`;
    fs.writeFileSync(fileName, buffer);

    const newAvatar = new this.avatarModel({
      userId: userResponse.data.id,
      hash: fileNameHash,
    });

    await newAvatar.save();

    const base64Data = buffer.toString('base64');
    return base64Data;
  }

  async deleteUserAvatar(userId: string): Promise<any> {
    const existingAvatar = await this.avatarModel.findOne({ userId });

    if (!existingAvatar?.userId) {
      throw new NotFoundException('User does not exist');
    }

    if (existingAvatar?.userId) {
      try {
        fs.unlinkSync(`avatars/${existingAvatar.hash}.jpg`);
      } catch (error) {
        // continue
      }
    }

    await this.avatarModel.deleteOne({ _id: existingAvatar._id }).exec();
    return { message: 'Avatar file deleted successfully' };
  }
}
