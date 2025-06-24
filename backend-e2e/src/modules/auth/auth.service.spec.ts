import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../../../backend/src/app/prisma.service';
import { AuthService } from '../../../../backend/src/modules/auth/auth.service';
import { UserResponseDto } from '../../../../backend/src/modules/auth/dto/auth-response.dto';

// Mock argon2 module
jest.mock('argon2', () => ({
  verify: jest.fn(),
}));

import * as argon2 from 'argon2';

describe('AuthService', () => {
  let service: AuthService;
  let prismaService: PrismaService;
  let jwtService: JwtService;

  // Mock user data
  const mockCompany = {
    id: 'company-1',
    name: 'Test Company',
    code: 'TEST',
    isActive: true,
  };

  const mockUser = {
    id: 'user-1',
    email: 'test@company.com',
    firstName: 'Test',
    lastName: 'User',
    password: '$argon2id$v=19$m=65536,t=3,p=4$hash',
    isActive: true,
    companyId: 'company-1',
    company: mockCompany,
    userRoles: [
      {
        role: {
          id: 'role-1',
          name: 'Admin',
          companyId: 'company-1',
          permissions: [
            {
              permission: {
                module: 'INVENTORY_MANAGEMENT',
                action: 'CREATE',
              },
            },
            {
              permission: {
                module: 'INVENTORY_MANAGEMENT',
                action: 'READ',
              },
            },
          ],
        },
      },
    ],
    userBranches: [
      {
        branch: {
          id: 'branch-1',
          name: 'Main Branch',
          companyId: 'company-1',
        },
      },
    ],
  };

  const mockUserResponse: UserResponseDto = {
    id: 'user-1',
    email: 'test@company.com',
    firstName: 'Test',
    lastName: 'User',
    companyId: 'company-1',
    companyName: 'Test Company',
    roles: ['Admin'],
    permissions: ['INVENTORY_MANAGEMENT:CREATE', 'INVENTORY_MANAGEMENT:READ'],
    branches: [{ id: 'branch-1', name: 'Main Branch', code: 'MB001', isHQ: true }],
    branchIds: ['branch-1'],
    isSuperAdmin: false,
    isActive: true,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: PrismaService,
          useValue: {
            user: {
              findUnique: jest.fn(),
              update: jest.fn(),
            },
          },
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn().mockReturnValue('mock-jwt-token'),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    prismaService = module.get<PrismaService>(PrismaService);
    jwtService = module.get<JwtService>(JwtService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('validateUser', () => {
    it('should return user data when credentials are valid', async () => {
      const email = 'test@company.com';
      const password = 'password123';

      (prismaService.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (argon2.verify as jest.Mock).mockResolvedValue(true);

      const result = await service.validateUser(email, password);

      expect(result).toBeDefined();
      expect(result?.id).toBe('user-1');
      expect(result?.email).toBe('test@company.com');
      expect(result?.companyId).toBe('company-1');
    });

    it('should return null for non-existent user', async () => {
      const email = 'nonexistent@company.com';
      const password = 'password123';

      (prismaService.user.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await service.validateUser(email, password);

      expect(result).toBeNull();
    });

    it('should return null for incorrect password', async () => {
      const email = 'test@company.com';
      const password = 'wrongpassword';

      (prismaService.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (argon2.verify as jest.Mock).mockResolvedValue(false);

      const result = await service.validateUser(email, password);

      expect(result).toBeNull();
    });

    it('should return null for inactive user', async () => {
      const inactiveUser = { ...mockUser, isActive: false };
      const email = 'test@company.com';
      const password = 'password123';

      (prismaService.user.findUnique as jest.Mock).mockResolvedValue(inactiveUser);

      const result = await service.validateUser(email, password);

      expect(result).toBeNull();
    });

    it('should return null for inactive company', async () => {
      const userWithInactiveCompany = {
        ...mockUser,
        company: { ...mockCompany, isActive: false },
      };
      const email = 'test@company.com';
      const password = 'password123';

      (prismaService.user.findUnique as jest.Mock).mockResolvedValue(userWithInactiveCompany);

      const result = await service.validateUser(email, password);

      expect(result).toBeNull();
    });
  });

  describe('login', () => {
    it('should return access token and user data', async () => {
      const email = 'test@company.com';
      const password = 'password123';

      jest.spyOn(service, 'validateUser').mockResolvedValue(mockUserResponse);

      const result = await service.login(email, password);

      expect(result).toBeDefined();
      expect(result.access_token).toBe('mock-jwt-token');
      expect(result.user).toBeDefined();
      expect(result.user.id).toBe('user-1');
      expect(result.user.companyId).toBe('company-1');
    });

    it('should throw UnauthorizedException for invalid credentials', async () => {
      const email = 'test@company.com';
      const password = 'wrongpassword';

      jest.spyOn(service, 'validateUser').mockResolvedValue(null);

      await expect(service.login(email, password)).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('generateToken', () => {
    it('should generate JWT token for user', async () => {
      const result = await service.generateToken(mockUserResponse);

      expect(result).toBe('mock-jwt-token');
      expect(jwtService.sign).toHaveBeenCalledWith({
        username: 'test@company.com',
        sub: 'user-1',
        companyId: 'company-1',
        roles: ['Admin'],
        permissions: ['INVENTORY_MANAGEMENT:CREATE', 'INVENTORY_MANAGEMENT:READ'],
        branchIds: ['branch-1'],
        firstName: 'Test',
        lastName: 'User',
        isSuperAdmin: false,
      });
    });
  });
});
