import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException } from '@nestjs/common';
import * as argon2 from 'argon2';
import { AuthService } from './auth.service';
import { PrismaService } from '../../app/prisma.service';

// Mock the Prisma client import
jest.mock('../../../generated/prisma', () => ({
  PrismaClient: jest.fn().mockImplementation(() => ({
    $connect: jest.fn(),
    $disconnect: jest.fn(),
  })),
  UserRole: {
    SYSTEM_ADMIN: 'SYSTEM_ADMIN',
    BRANCH_MANAGER: 'BRANCH_MANAGER',
    INVENTORY_CLERK: 'INVENTORY_CLERK',
    PROCUREMENT_SPECIALIST: 'PROCUREMENT_SPECIALIST',
    PRODUCTION_PLANNER: 'PRODUCTION_PLANNER',
  },
}));

const { UserRole } = require('../../../generated/prisma');

describe('AuthService', () => {
  let service: AuthService;
  let prismaService: PrismaService;
  let jwtService: JwtService;

  const mockUser = {
    id: 'test-user-id',
    email: 'test@example.com',
    username: 'testuser',
    firstName: 'Test',
    lastName: 'User',
    password: 'hashedPassword',
    role: UserRole.BRANCH_MANAGER,
    branchId: 'test-branch-id',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    branch: {
      id: 'test-branch-id',
      name: 'Test Branch',
      code: 'TEST',
      address: 'Test Address',
      phone: '+1-555-0123',
      email: 'test@branch.com',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  };

  const mockPrismaService = {
    user: {
      findUnique: jest.fn(),
    },
  };

  const mockJwtService = {
    sign: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
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
      // Arrange
      const email = 'test@example.com';
      const password = 'password123';
      const hashedPassword = await argon2.hash(password);

      const userWithHashedPassword = {
        ...mockUser,
        password: hashedPassword,
      };

      mockPrismaService.user.findUnique.mockResolvedValue(
        userWithHashedPassword
      );

      // Act
      const result = await service.validateUser(email, password);

      // Assert
      expect(result).toEqual({
        id: mockUser.id,
        email: mockUser.email,
        username: mockUser.username,
        firstName: mockUser.firstName,
        lastName: mockUser.lastName,
        role: mockUser.role,
        branchId: mockUser.branchId,
        branch: mockUser.branch,
      });
      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { email },
        include: { branch: true },
      });
    });

    it('should return null when user is not found', async () => {
      // Arrange
      const email = 'nonexistent@example.com';
      const password = 'password123';

      mockPrismaService.user.findUnique.mockResolvedValue(null);

      // Act
      const result = await service.validateUser(email, password);

      // Assert
      expect(result).toBeNull();
      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { email },
        include: { branch: true },
      });
    });

    it('should return null when user is inactive', async () => {
      // Arrange
      const email = 'test@example.com';
      const password = 'password123';
      const hashedPassword = await argon2.hash(password);

      const inactiveUser = {
        ...mockUser,
        password: hashedPassword,
        isActive: false,
      };

      mockPrismaService.user.findUnique.mockResolvedValue(inactiveUser);

      // Act
      const result = await service.validateUser(email, password);

      // Assert
      expect(result).toBeNull();
    });

    it('should return null when password is invalid', async () => {
      // Arrange
      const email = 'test@example.com';
      const password = 'wrongpassword';
      const hashedPassword = await argon2.hash('correctpassword');

      const userWithHashedPassword = {
        ...mockUser,
        password: hashedPassword,
      };

      mockPrismaService.user.findUnique.mockResolvedValue(
        userWithHashedPassword
      );

      // Act
      const result = await service.validateUser(email, password);

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('login', () => {
    it('should return access token and user data', async () => {
      // Arrange
      const authenticatedUser = {
        id: mockUser.id,
        email: mockUser.email,
        username: mockUser.username,
        firstName: mockUser.firstName,
        lastName: mockUser.lastName,
        role: mockUser.role,
        branchId: mockUser.branchId,
        branch: mockUser.branch,
      };

      const expectedToken = 'jwt-token';
      mockJwtService.sign.mockReturnValue(expectedToken);

      // Act
      const result = await service.login(authenticatedUser);

      // Assert
      expect(result).toEqual({
        access_token: expectedToken,
        user: authenticatedUser,
      });
      expect(mockJwtService.sign).toHaveBeenCalledWith({
        userId: authenticatedUser.id,
        email: authenticatedUser.email,
        username: authenticatedUser.username,
        role: authenticatedUser.role,
        branchId: authenticatedUser.branchId,
      });
    });
  });
});
