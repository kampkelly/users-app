import { Injectable, Inject } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ClientProxy } from '@nestjs/microservices';
import { Model } from 'mongoose';

import { User, UserDocument } from './users.schema';
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
    console.log('>>>the req', userRequest);

    const createdUser = await newUser.save();
    console.log('>>>cre', createdUser);

    await this.emailService.sendEmail();
    this.client.emit('user_created', 'User has been created');

    return userRequest;
  }
}
