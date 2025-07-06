import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  SerializeOptions,
  ValidationPipe,
} from '@nestjs/common';

import { ApiTags } from '@nestjs/swagger';

import { ContentModule } from '@/modules/content/content.module';
import {
  CreateTagDto,
  QueryTagDto,
  UpdateTagDto,
} from '@/modules/content/dtos/tag.dto';
import { TagService } from '@/modules/content/services';
import { Depends } from '@/modules/restful/decorators/depends.decorator';
import { DeleteDto } from '@/modules/restful/dtos';

// @UseInterceptors(AppIntercepter)
@ApiTags('标签操作')
@Depends(ContentModule)
@Controller('tags')
export class TagController {
  constructor(protected service: TagService) {}

  @Get()
  @SerializeOptions({})
  async list(
    @Query(
      new ValidationPipe({
        transform: true,
        whitelist: true,
        forbidNonWhitelisted: true,
        forbidUnknownValues: true,
        validationError: { target: false },
      }),
    )
    options: QueryTagDto,
  ) {
    return this.service.paginate(options);
  }

  @Get(':id')
  @SerializeOptions({})
  async detail(
    @Param('id', new ParseUUIDPipe())
    id: string,
  ) {
    return this.service.detail(id);
  }

  @Post()
  @SerializeOptions({})
  async store(
    @Body(
      new ValidationPipe({
        transform: true,
        whitelist: true,
        forbidNonWhitelisted: true,
        forbidUnknownValues: true,
        validationError: { target: false },
        groups: ['create'],
      }),
    )
    data: CreateTagDto,
  ) {
    return this.service.create(data);
  }

  @Patch()
  @SerializeOptions({})
  async update(
    @Body(
      new ValidationPipe({
        transform: true,
        whitelist: true,
        forbidNonWhitelisted: true,
        forbidUnknownValues: true,
        validationError: { target: false },
        groups: ['update'],
      }),
    )
    data: UpdateTagDto,
  ) {
    return this.service.update(data);
  }

  @Delete()
  @SerializeOptions({ groups: ['post-list'] })
  async delete(
    @Body()
    data: DeleteDto,
  ) {
    const { ids } = data;
    return this.service.delete(ids);
  }
}
