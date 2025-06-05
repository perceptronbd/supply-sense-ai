import { PartialType } from '@nestjs/mapped-types';
import { CreateManufacturingListDto } from './create-manufacturing-list.dto';

export class UpdateManufacturingListDto extends PartialType(
  CreateManufacturingListDto
) {}
