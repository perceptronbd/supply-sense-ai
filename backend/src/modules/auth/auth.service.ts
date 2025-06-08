import { Injectable, UnauthorizedException } from '@nestjs/common';
import type { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';
import type { PrismaService } from '../../app/prisma.service';
import type { UserResponseDto } from './dto/auth-response.dto';
import type { JwtPayload } from './interfaces/jwt-payload.interface';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService
  ) {}

  async login(
    email: string,
    password: string
  ): Promise<{ access_token: string; user: UserResponseDto }> {
    const user = await this.validateUser(email, password);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload: JwtPayload = {
      username: user.email,
      sub: user.id,
      role: user.role,
      firstName: user.firstName,
      lastName: user.lastName,
      branchId: user.branchId,
    };

    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        branchId: user.branchId,
        isActive: user.isActive,
      },
    };
  }
  async generateToken(user: UserResponseDto): Promise<string> {
    const payload = {
      username: user.email,
      sub: user.id,
      role: user.role,
      firstName: user.firstName,
      lastName: user.lastName,
      branchId: user.branchId,
    };
    return this.jwtService.sign(payload);
  }

  async validateUser(email: string, password: string): Promise<UserResponseDto | null> {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return null;
    }

    if (!user.isActive) {
      return null;
    }

    try {
      // Use argon2 to verify password
      const isValidPassword = await argon2.verify(user.password, password);
      if (isValidPassword) {
        return user;
      }
    } catch (error) {
      // If password verification fails, return null
      console.error('Password verification error:', error);
    }

    return null;
  }
}
