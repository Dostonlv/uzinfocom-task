import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { UserService } from '../../user/user.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(private userService: UserService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'kisuke',
    });
  }

  async validate(payload: { sub: string; email: string }) {
    const user = await this.userService.findOne(payload.sub);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    return { userId: user.id, email: user.email };
  }
}
