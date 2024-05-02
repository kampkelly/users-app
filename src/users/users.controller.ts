import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  HttpCode,
  ValidationPipe,
} from '@nestjs/common';

import { UsersService } from './users.service';
import { CreateUserDto } from './dto/index';

@Controller()
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post('users')
  @HttpCode(201)
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

  @Delete('user/:id/avatar')
  @HttpCode(204)
  async deleteUserAvatar(@Param('id') id: string) {
    const result = await this.usersService.deleteUserAvatar(id);
    return { ...result };
  }
}
