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

import {
  CreateCategoryDto,
  QueryCategoryDto,
  UpdateCategoryDto,
} from '@/modules/content/dtos/category.dto';
import { CategoryService } from '@/modules/content/services';
import { DeleteDto } from '@/modules/restful/dtos';

// @UseInterceptors(AppIntercepter)
@Controller('categories')
export class CategoryController {
  constructor(protected service: CategoryService) {}

  @Get('tree')
  @SerializeOptions({ groups: ['category-tree'] })
  async tree() {
    return this.service.findTrees();
  }

  // todo:删除@query和@body里的管道参数
  @Get()
  @SerializeOptions({ groups: ['category-list'] })
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
    options: QueryCategoryDto,
  ) {
    return this.service.paginate(options);
  }

  @Get(':id')
  @SerializeOptions({ groups: ['category-detail'] })
  async detail(
    @Param('id', new ParseUUIDPipe())
    id: string,
  ) {
    return this.service.detail(id);
  }

  @Post()
  @SerializeOptions({ groups: ['category-detail'] })
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
    data: CreateCategoryDto,
  ) {
    return this.service.create(data);
  }

  @Patch()
  @SerializeOptions({ groups: ['category-detail'] })
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
    data: UpdateCategoryDto,
  ) {
    return this.service.update(data);
  }

  @Delete()
  @SerializeOptions({ groups: ['category-list'] })
  async delete(
    @Body()
    data: DeleteDto,
  ) {
    const { ids } = data;
    return this.service.delete(ids);
  }
}
