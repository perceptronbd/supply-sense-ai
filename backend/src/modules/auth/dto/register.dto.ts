import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class RegisterDto {
  @ApiProperty({
    description: 'Company name',
    example: 'Acme Manufacturing Corp',
  })
  @IsString()
  @MinLength(2, { message: 'Company name must be at least 2 characters' })
  @MaxLength(100, { message: 'Company name must not exceed 100 characters' })
  companyName: string;

  @ApiProperty({
    description: 'Company contact email',
    example: 'contact@acme.com',
  })
  @IsEmail({}, { message: 'Please enter a valid company email address' })
  companyEmail: string;

  @ApiProperty({
    description: 'User first name',
    example: 'John',
  })
  @IsString()
  @MinLength(1, { message: 'First name is required' })
  @MaxLength(50, { message: 'First name must not exceed 50 characters' })
  firstName: string;

  @ApiProperty({
    description: 'User last name',
    example: 'Doe',
  })
  @IsString()
  @MinLength(1, { message: 'Last name is required' })
  @MaxLength(50, { message: 'Last name must not exceed 50 characters' })
  lastName: string;

  @ApiProperty({
    description: 'User email address',
    example: 'john.doe@acme.com',
  })
  @IsEmail({}, { message: 'Please enter a valid email address' })
  email: string;

  @ApiProperty({
    description: 'User password',
    example: 'SecurePassword123!',
  })
  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters' })
  password: string;

  @ApiProperty({
    description: 'Company tax ID or business registration number',
    example: '123-45-6789',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(50, { message: 'Tax ID must not exceed 50 characters' })
  taxId?: string;

  @ApiProperty({
    description: 'Company business address',
    example: '123 Manufacturing St, Industrial City, ST 12345',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(200, { message: 'Business address must not exceed 200 characters' })
  businessAddress?: string;

  @ApiProperty({
    description: 'Company contact phone number',
    example: '+1-555-123-4567',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(20, { message: 'Phone number must not exceed 20 characters' })
  contactPhone?: string;
}
