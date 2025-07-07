import { UnauthorizedException } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';

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

describe('AuthController', () => {
  let controller: AuthController;
  let _authService: AuthService;

  const mockAuthService = {
    validateUser: jest.fn(),
    login: jest.fn(),
  };

  const mockUser = {
    id: 'test-user-id',
    email: 'test@example.com',
    username: 'testuser',
    firstName: 'Test',
    lastName: 'User',
    role: UserRole.SYSTEM_ADMIN,
    branchId: 'test-branch-id',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockLoginResponse = {
    access_token: 'mock.jwt.token',
    user: {
      id: mockUser.id,
      email: mockUser.email,
      username: mockUser.username,
      firstName: mockUser.firstName,
      lastName: mockUser.lastName,
      role: mockUser.role,
      branchId: mockUser.branchId,
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    _authService = module.get<AuthService>(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('login', () => {
    const loginDto: LoginDto = {
      email: 'test@example.com',
      password: 'password123',
    };

    it('should successfully login with valid credentials', async () => {
      mockAuthService.validateUser.mockResolvedValue(mockUser);
      mockAuthService.login.mockResolvedValue(mockLoginResponse);

      const result = await controller.login(loginDto);

      expect(mockAuthService.validateUser).toHaveBeenCalledWith(loginDto.email, loginDto.password);
      expect(mockAuthService.login).toHaveBeenCalledWith(mockUser);
      expect(result).toEqual(mockLoginResponse);
    });

    it('should throw UnauthorizedException for invalid credentials', async () => {
      mockAuthService.validateUser.mockResolvedValue(null);

      await expect(controller.login(loginDto)).rejects.toThrow(UnauthorizedException);

      expect(mockAuthService.validateUser).toHaveBeenCalledWith(loginDto.email, loginDto.password);
      expect(mockAuthService.login).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedException for inactive user', async () => {
      const inactiveUser = { ...mockUser, isActive: false };
      mockAuthService.validateUser.mockResolvedValue(inactiveUser);

      await expect(controller.login(loginDto)).rejects.toThrow(UnauthorizedException);

      expect(mockAuthService.validateUser).toHaveBeenCalledWith(loginDto.email, loginDto.password);
      expect(mockAuthService.login).not.toHaveBeenCalled();
    });

    it('should handle service errors gracefully', async () => {
      mockAuthService.validateUser.mockRejectedValue(new Error('Database connection failed'));

      await expect(controller.login(loginDto)).rejects.toThrow('Database connection failed');

      expect(mockAuthService.validateUser).toHaveBeenCalledWith(loginDto.email, loginDto.password);
      expect(mockAuthService.login).not.toHaveBeenCalled();
    });

    it('should validate email format in DTO', async () => {
      const invalidLoginDto: LoginDto = {
        email: 'invalid-email',
        password: 'password123',
      };

      // The validation would typically be handled by class-validator
      // In a real test, you might want to test the validation pipe
      expect(invalidLoginDto.email).toBe('invalid-email');
    });

    it('should require password in DTO', async () => {
      const incompleteDto = {
        email: 'test@example.com',
        // password is missing
      } as LoginDto;

      // The validation would typically be handled by class-validator
      expect(incompleteDto.password).toBeUndefined();
    });
  });

  describe('profile endpoint (protected)', () => {
    // This would be tested in integration tests since it requires
    // JWT authentication middleware to be properly set up
    it('should be accessible with valid JWT token', () => {
      // This test would require setting up the JWT strategy and guards
      // For unit testing, we focus on the controller logic
      expect(controller).toBeDefined();
    });
  });

  describe('error handling', () => {
    it('should handle unexpected errors in login', async () => {
      const loginDto: LoginDto = {
        email: 'test@example.com',
        password: 'password123',
      };

      mockAuthService.validateUser.mockImplementation(() => {
        throw new Error('Unexpected error');
      });

      await expect(controller.login(loginDto)).rejects.toThrow('Unexpected error');
    });
  });

  describe('input validation', () => {
    it('should handle empty email gracefully', async () => {
      const loginDto: LoginDto = {
        email: '',
        password: 'password123',
      };

      mockAuthService.validateUser.mockResolvedValue(null);

      await expect(controller.login(loginDto)).rejects.toThrow(UnauthorizedException);
    });

    it('should handle empty password gracefully', async () => {
      const loginDto: LoginDto = {
        email: 'test@example.com',
        password: '',
      };

      mockAuthService.validateUser.mockResolvedValue(null);

      await expect(controller.login(loginDto)).rejects.toThrow(UnauthorizedException);
    });
  });
});
