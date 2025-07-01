import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsBoolean, IsIn, IsInt, IsOptional, IsString, IsUUID, Max, Min } from 'class-validator';

export class QueryUserDto {
  @ApiPropertyOptional({
    description: 'Search term for user name, email, or username',
    example: 'john',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: 'Filter by role ID',
    example: 'role-uuid',
  })
  @IsOptional()
  @IsUUID('4', { message: 'Role ID must be a valid UUID' })
  roleId?: string;

  @ApiPropertyOptional({
    description: 'Filter by branch ID',
    example: 'branch-uuid',
  })
  @IsOptional()
  @IsUUID('4', { message: 'Branch ID must be a valid UUID' })
  branchId?: string;

  @ApiPropertyOptional({
    description: 'Filter by active status',
    example: true,
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({
    description: 'Page number for pagination (1-based)',
    example: 1,
    minimum: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Page must be an integer' })
  @Min(1, { message: 'Page must be at least 1' })
  page?: number;

  @ApiPropertyOptional({
    description: 'Number of items per page',
    example: 10,
    minimum: 1,
    maximum: 100,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Limit must be an integer' })
  @Min(1, { message: 'Limit must be at least 1' })
  @Max(100, { message: 'Limit cannot exceed 100' })
  limit?: number;

  @ApiPropertyOptional({
    description: 'Sort field',
    example: 'firstName',
    enum: ['firstName', 'lastName', 'email', 'username', 'createdAt', 'lastLogin'],
  })
  @IsOptional()
  @IsString()
  @IsIn(['firstName', 'lastName', 'email', 'username', 'createdAt', 'lastLogin'])
  sortBy?: string;

  @ApiPropertyOptional({
    description: 'Sort order',
    example: 'asc',
    enum: ['asc', 'desc'],
  })
  @IsOptional()
  @IsString()
  @IsIn(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc';

  @ApiPropertyOptional({
    description: 'Include user roles in response',
    example: true,
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  @IsBoolean()
  includeRoles?: boolean;

  @ApiPropertyOptional({
    description: 'Include user branches in response',
    example: true,
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  @IsBoolean()
  includeBranches?: boolean;
}
