import {
  Body,
  Controller,
  Delete,
  Get,
  Post,
  Query,
  SerializeOptions,
  ValidationPipe,
} from '@nestjs/common';

import {
  CreateCommentDto,
  QueryCommentDto,
  QueryCommentTreeDto,
} from '@/modules/content/dtos/comment.dto';
import { CommentService } from '@/modules/content/services';
import { DeleteDto } from '@/modules/restful/dtos/delete.dto';

// @UseInterceptors(AppIntercepter)
@Controller('comments')
export class CommentController {
  constructor(protected service: CommentService) {}

  @Get('tree')
  @SerializeOptions({ groups: ['comment-tree'] })
  async tree(
    @Query(
      new ValidationPipe({
        transform: true,
        whitelist: true,
        forbidNonWhitelisted: true,
        forbidUnknownValues: true,
        validationError: { target: false },
      }),
    )
    query: QueryCommentTreeDto,
  ) {
    return this.service.findTrees(query);
  }

  @Get()
  @SerializeOptions({ groups: ['comment-list'] })
  async list(
    @Query(
      new ValidationPipe({
        transform: true,
        forbidUnknownValues: true,
        validationError: { target: false },
      }),
    )
    query: QueryCommentDto,
  ) {
    return this.service.paginate(query);
  }

  @Post()
  @SerializeOptions({ groups: ['comment-detail'] })
  async store(
    @Body(
      new ValidationPipe({
        transform: true,
        whitelist: true,
        forbidNonWhitelisted: true,
        forbidUnknownValues: true,
        validationError: { target: false },
      }),
    )
    data: CreateCommentDto,
  ) {
    return this.service.create(data);
  }

  @Delete(':id')
  @SerializeOptions({ groups: ['comment-detail'] })
  async delete(@Body() data: DeleteDto) {
    const { ids } = data;
    return this.service.delete(ids);
  }
}
