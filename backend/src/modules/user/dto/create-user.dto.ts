import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayMinSize,
  IsArray,
  IsEmail,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateUserDto {
  @ApiProperty({
    description: 'User email address (unique per company)',
    example: 'john.doe@company.com',
  })
  @IsEmail({}, { message: 'Please provide a valid email address' })
  email: string;

  @ApiProperty({
    description: 'Username (unique globally)',
    example: 'john.doe',
  })
  @IsString()
  @MinLength(3, { message: 'Username must be at least 3 characters long' })
  @MaxLength(50, { message: 'Username must not exceed 50 characters' })
  @Matches(/^[a-zA-Z0-9_.-]+$/, {
    message: 'Username can only contain letters, numbers, dots, hyphens, and underscores',
  })
  username: string;

  @ApiProperty({
    description: 'User first name',
    example: 'John',
  })
  @IsString()
  @MinLength(1, { message: 'First name is required' })
  @MaxLength(100, { message: 'First name must not exceed 100 characters' })
  firstName: string;

  @ApiPropertyOptional({
    description: 'User last name',
    example: 'Doe',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100, { message: 'Last name must not exceed 100 characters' })
  lastName?: string;

  @ApiPropertyOptional({
    description: 'User phone number',
    example: '+1234567890',
  })
  @IsOptional()
  @IsString()
  @MaxLength(20, { message: 'Phone number must not exceed 20 characters' })
  phone?: string;

  @ApiPropertyOptional({
    description: 'Government ID or employee ID',
    example: 'EMP001',
  })
  @IsOptional()
  @IsString()
  @MaxLength(50, { message: 'Government ID must not exceed 50 characters' })
  governmentId?: string;

  @ApiProperty({
    description: 'User password (will be hashed)',
    example: 'SecurePassword123!',
    minLength: 8,
  })
  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
    message:
      'Password must contain at least one lowercase letter, one uppercase letter, and one number',
  })
  password: string;

  @ApiProperty({
    description: 'Array of role IDs to assign to the user (at least one required)',
    example: ['role-uuid-1', 'role-uuid-2'],
    type: [String],
  })
  @IsArray()
  @ArrayMinSize(1, { message: 'At least one role must be assigned' })
  @IsUUID('4', { each: true, message: 'Each role ID must be a valid UUID' })
  roleIds: string[];

  @ApiProperty({
    description: 'Array of branch IDs to assign to the user (at least one required)',
    example: ['branch-uuid-1', 'branch-uuid-2'],
    type: [String],
  })
  @IsArray()
  @ArrayMinSize(1, { message: 'At least one branch must be assigned' })
  @IsUUID('4', { each: true, message: 'Each branch ID must be a valid UUID' })
  branchIds: string[];
}
