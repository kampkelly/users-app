import { Controller, Post, Body, ValidationPipe } from '@nestjs/common';

import { UsersService } from './users.service';
import { CreateUserDto } from './dto/index';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  async createUser(@Body(new ValidationPipe()) createUserDto: CreateUserDto) {
    const user = await this.usersService.createUser(createUserDto);
    return { user };
  }
}
