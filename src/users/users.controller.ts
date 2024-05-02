import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  ValidationPipe,
} from '@nestjs/common';

import { UsersService } from './users.service';
import { CreateUserDto } from './dto/index';

@Controller()
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post('users')
  async createUser(@Body(new ValidationPipe()) createUserDto: CreateUserDto) {
    const user = await this.usersService.createUser(createUserDto);
    return { user };
  }

  @Get('user/:id')
  async getUser(@Param('id') id: string) {
    const userData = await this.usersService.getUser(id);
    return { user: userData.data };
  }

  @Get('user/:id/avatar')
  async getUserAvatar(@Param('id') id: string) {
    const avatar = await this.usersService.getUserAvatar(id);
    return { avatar };
  }
}
