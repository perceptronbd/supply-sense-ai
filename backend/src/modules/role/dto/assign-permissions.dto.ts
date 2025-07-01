import { ApiProperty } from '@nestjs/swagger';
import { ArrayMinSize, IsArray, IsIn, IsString, IsUUID } from 'class-validator';

export class AssignPermissionsDto {
  @ApiProperty({
    description: 'Array of permission IDs to assign/remove/replace',
    example: ['permission-uuid-1', 'permission-uuid-2'],
    type: [String],
  })
  @IsArray()
  @ArrayMinSize(1, { message: 'At least one permission ID must be provided' })
  @IsUUID('4', { each: true, message: 'Each permission ID must be a valid UUID' })
  permissionIds: string[];

  @ApiProperty({
    description: 'Action to perform with the permissions',
    example: 'assign',
    enum: ['assign', 'remove', 'replace'],
  })
  @IsString()
  @IsIn(['assign', 'remove', 'replace'], {
    message: 'Action must be one of: assign, remove, replace',
  })
  action: 'assign' | 'remove' | 'replace';
}
