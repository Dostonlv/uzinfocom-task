import { PartialType } from '@nestjs/mapped-types';
import { ApiProperty } from '@nestjs/swagger';
import { CreateUserDto } from './create-user.dto';

export class UpdateUserDto extends PartialType(CreateUserDto) {
  @ApiProperty({
    description: 'User email address',
    example: 'updated@example.com',
    required: false,
  })
  email?: string;

  @ApiProperty({
    description: 'User password',
    example: 'newpassword123',
    minLength: 6,
    required: false,
  })
  password?: string;
}
