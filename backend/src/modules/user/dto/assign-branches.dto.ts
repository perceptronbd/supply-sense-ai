import { ApiProperty } from '@nestjs/swagger';
import { ArrayMinSize, IsArray, IsIn, IsString, IsUUID } from 'class-validator';

export class AssignBranchesDto {
  @ApiProperty({
    description: 'Array of branch IDs to assign/remove/replace',
    example: ['branch-uuid-1', 'branch-uuid-2'],
    type: [String],
  })
  @IsArray()
  @ArrayMinSize(1, { message: 'At least one branch ID must be provided' })
  @IsUUID('4', { each: true, message: 'Each branch ID must be a valid UUID' })
  branchIds: string[];

  @ApiProperty({
    description: 'Action to perform with the branches',
    example: 'assign',
    enum: ['assign', 'remove', 'replace'],
  })
  @IsString()
  @IsIn(['assign', 'remove', 'replace'], {
    message: 'Action must be one of: assign, remove, replace',
  })
  action: 'assign' | 'remove' | 'replace';
}
