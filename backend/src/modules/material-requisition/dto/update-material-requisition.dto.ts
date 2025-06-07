import { PartialType } from '@nestjs/mapped-types';
import { CreateMaterialRequisitionDto } from './create-material-requisition.dto';

export class UpdateMaterialRequisitionDto extends PartialType(CreateMaterialRequisitionDto) {}
