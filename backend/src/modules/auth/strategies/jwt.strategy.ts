import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { JwtPayload } from '../interfaces/jwt-payload.interface';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'your-secret-key',
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
      branchIds: payload.branchIds,
      firstName: payload.firstName,
      lastName: payload.lastName,
      isSuperAdmin: payload.isSuperAdmin,
    };
  }
}
