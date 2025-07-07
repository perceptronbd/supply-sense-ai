import { ApiProperty } from '@nestjs/swagger';
import { ArrayMinSize, IsArray, IsIn, IsString, IsUUID } from 'class-validator';

export class AssignRolesDto {
  @ApiProperty({
    description: 'Array of role IDs to assign/remove/replace',
    example: ['role-uuid-1', 'role-uuid-2'],
    type: [String],
  })
  @IsArray()
  @ArrayMinSize(1, { message: 'At least one role ID must be provided' })
  @IsUUID('4', { each: true, message: 'Each role ID must be a valid UUID' })
  roleIds: string[];

  @ApiProperty({
    description: 'Action to perform with the roles',
    example: 'assign',
    enum: ['assign', 'remove', 'replace'],
  })
  @IsString()
  @IsIn(['assign', 'remove', 'replace'], {
    message: 'Action must be one of: assign, remove, replace',
  })
  action: 'assign' | 'remove' | 'replace';
}
