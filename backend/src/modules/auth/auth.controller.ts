import { Body, Controller, HttpCode, HttpStatus, Inject, Post } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { AuthResponseDto } from './dto/auth-response.dto';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { RegistrationResponseDto } from './dto/registration-response.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(@Inject(AuthService) private readonly authService: AuthService) {
    console.log('AuthController constructor called - AuthService:', !!authService);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Authenticate user',
    description: 'Authenticate a user with email and password and return a JWT token',
  })
  @ApiBody({ type: LoginDto })
  @ApiResponse({
    status: 200,
    description: 'User successfully authenticated',
    type: AuthResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid credentials',
  })
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto.email, loginDto.password);
  }

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Register new company and super admin user',
    description: 'Register a new company with the first super admin user account',
  })
  @ApiBody({ type: RegisterDto })
  @ApiResponse({
    status: 201,
    description: 'Company and user successfully registered',
    type: RegistrationResponseDto,
  })
  @ApiResponse({
    status: 409,
    description: 'Company email or user email already exists',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid registration data',
  })
  async register(@Body() registerDto: RegisterDto): Promise<RegistrationResponseDto> {
    return this.authService.register(registerDto);
  }
}
