import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { RequestFormService } from './request-form.service';
import { CreateRequestFormDto } from './dto/create-request-form.dto';
import { UpdateRequestFormDto } from './dto/update-request-form.dto';

@Controller('request-form')
export class RequestFormController {
  constructor(private readonly requestFormService: RequestFormService) {}

  @Post()
  async create(@Body() createRequestFormDto: CreateRequestFormDto) {
    // TODO: Get actual user ID from authentication context
    const userId = 'placeholder-user-id';
    return await this.requestFormService.create(createRequestFormDto, userId);
  }

  @Get()
  async findAll(
    @Query('fromBranchId') fromBranchId?: string,
    @Query('toBranchId') toBranchId?: string
  ) {
    return await this.requestFormService.findAll(fromBranchId, toBranchId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return await this.requestFormService.findOne(id);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateRequestFormDto: UpdateRequestFormDto
  ) {
    return await this.requestFormService.update(id, updateRequestFormDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return await this.requestFormService.remove(id);
  }

  @Post(':id/submit')
  @HttpCode(HttpStatus.OK)
  async submit(@Param('id') id: string) {
    return await this.requestFormService.submit(id);
  }

  @Post(':id/approve')
  @HttpCode(HttpStatus.OK)
  async approve(@Param('id') id: string) {
    // TODO: Get actual user ID from authentication context
    const userId = 'placeholder-user-id';
    return await this.requestFormService.approve(id, userId);
  }

  @Post(':id/reject')
  @HttpCode(HttpStatus.OK)
  async reject(@Param('id') id: string) {
    // TODO: Get actual user ID from authentication context
    const userId = 'placeholder-user-id';
    return await this.requestFormService.reject(id, userId);
  }

  @Post(':id/ready-for-mr')
  @HttpCode(HttpStatus.OK)
  async markReadyForMR(@Param('id') id: string) {
    return await this.requestFormService.markReadyForMR(id);
  }

  @Post('from-template/:templateId')
  async createFromTemplate(
    @Param('templateId') templateId: string,
    @Body() body: { fromBranchId: string; toBranchId: string }
  ) {
    // TODO: Get actual user ID from authentication context
    const userId = 'placeholder-user-id';
    return await this.requestFormService.createFromTemplate(
      templateId,
      body.fromBranchId,
      body.toBranchId,
      userId
    );
  }
}
