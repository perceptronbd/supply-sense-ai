import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { appConfig } from '@/config/app.config';
import { JwtPayload } from '../interfaces/jwt-payload.interface';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: appConfig.jwtSecret,
    });
  }

  async validate(payload: JwtPayload) {
    return {
      id: payload.sub,
      email: payload.username,
      username: payload.username,
      companyId: payload.companyId,
      roles: payload.roles,
      permissions: payload.permissions,
      firstName: payload.firstName,
      lastName: payload.lastName,
      isSuperAdmin: payload.isSuperAdmin,
    };
  }
}
