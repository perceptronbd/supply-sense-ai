import { ApiProperty } from '@nestjs/swagger';

export class RegistrationResponseDto {
  @ApiProperty({
    description: 'Registration success status',
    example: true,
  })
  success: boolean;

  @ApiProperty({
    description: 'Success message',
    example: 'Company and user registered successfully',
  })
  message: string;

  @ApiProperty({
    description: 'Registered company details',
  })
  company: {
    id: string;
    name: string;
    contactEmail: string;
    industry: string;
  };

  @ApiProperty({
    description: 'Registered user details',
  })
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    isSuperAdmin: boolean;
    isCompleteOnboarding: boolean;
  };

  @ApiProperty({
    description: 'JWT access token for immediate login',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  access_token: string;
}
