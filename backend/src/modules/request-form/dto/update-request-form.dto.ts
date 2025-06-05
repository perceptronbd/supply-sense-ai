import { PartialType } from '@nestjs/mapped-types';
import { CreateRequestFormDto } from './create-request-form.dto';

export class UpdateRequestFormDto extends PartialType(CreateRequestFormDto) {}
