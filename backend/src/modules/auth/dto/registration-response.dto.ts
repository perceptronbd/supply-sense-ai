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

  @ApiProperty({
    description: 'Refresh token for obtaining new access tokens',
    example: 'd8c9f01f-cf5d-49f7-a9dd-de9d24c75ab0',
  })
  refresh_token: string;
}
