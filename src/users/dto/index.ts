import { IsString, IsNumber } from 'class-validator';

export class CreateUserDto {
  @IsString()
  name: string;

  @IsString()
  job: string;
}

export class GetUserDto {
  @IsNumber()
  id: number;
}
