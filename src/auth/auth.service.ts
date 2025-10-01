import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UserService } from '../user/user.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
  constructor(
    private userService: UserService,
    private jwtService: JwtService,
  ) {}

  async register(registerDto: RegisterDto) {
    const { email, password } = registerDto;
    const user = await this.userService.create({
      email,
      password,
    });
    const payload = { email: user.email, sub: user.id };
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
      },
    };
  }

  async login(loginDto: LoginDto) {
    const user = await this.validateUser(loginDto.email, loginDto.password);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload = { email: user.email, sub: user.id };
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
      },
    };
  }

  async validateUser(
    email: string,
    password: string,
  ): Promise<Omit<
    { id: string; email: string; createdAt: Date },
    'password'
  > | null> {
    const user = await this.userService.findByEmail(email);
    if (user) {
      const isValid = await bcrypt.compare(password, user.password);
      if (isValid) {
        return {
          id: user.id,
          email: user.email,
          createdAt: user.createdAt,
        };
      }
    }
    return null;
  }
}
