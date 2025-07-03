import { ForbiddenException, Injectable, OnModuleInit } from '@nestjs/common';
import { isNil, omit } from 'lodash';
import { MeiliSearch } from 'meilisearch';

import { PostEntity } from '@/modules/content/entities';
import { getSearchData, getSearchItem } from '@/modules/content/helpers';
import {
  CategoryRepository,
  CommentRepository,
  PostRepository,
} from '@/modules/content/repositories';
import { SearchOption } from '@/modules/content/types';
import { SelectTrashMode } from '@/modules/database/constants';
import { MeilliService } from '@/modules/meilisearch/meili.service';

@Injectable()
export class SearchService implements OnModuleInit {
  index = 'content';

  protected _client: MeiliSearch;

  constructor(
    protected meilliService: MeilliService,
    protected categoryRepository: CategoryRepository,
    protected postRepository: PostRepository,
    protected commentRepository: CommentRepository, // private moduleRef: ModuleRef,
  ) {
    this._client = this.meilliService.getClient();
  }

  async onModuleInit() {
    await this.client.deleteIndex('content');
    this.client
      .index(this.index)
      .updateFilterableAttributes(['deletedAt', 'publishedAt']);
    this.client
      .index(this.index)
      .updateSortableAttributes(['updatedAt', 'commentCount']);
    const posts = await this.postRepository
      .buildBaseQB()
      .withDeleted()
      .getMany();
    await this.client
      .index(this.index)
      .addDocuments(
        await getSearchData(
          posts,
          this.categoryRepository,
          this.commentRepository,
        ),
      );
  }

  get client() {
    if (isNil(this._client))
      throw new ForbiddenException('Has not any meilli search client!');
    return this._client;
  }

  async search(text: string, param: SearchOption = {}) {
    const option = {
      page: 1,
      limit: 10,
      trashed: SelectTrashMode.NONE,
      ...param,
    };
    const limit = isNil(option.limit) || option.limit < 1 ? 1 : option.limit;
    const page = isNil(option.page) || option.page < 1 ? 1 : option.page;
    let filter = ['deletedAt IS NULL'];
    if (option.trashed === SelectTrashMode.ALL) {
      filter = [];
    } else if (option.trashed === SelectTrashMode.ONLY) {
      filter = ['deletedAt IS NOT NULL'];
    }
    if (option.isPublished) {
      filter.push('publishedAt IS NOT NULL');
    }
    const result = await this.client.index(this.index).search(text, {
      page,
      limit,
      sort: ['updatedAt:desc', 'commentCount:desc'],
      filter,
    });
    return {
      items: result.hits,
      currentPage: result.page,
      perPage: result.hitsPerPage,
      totalItems: result.estimatedTotalHits,
      itemCount: result.totalHits,
      ...omit(result, [
        'hits',
        'page',
        'hitsPerPage',
        'estimatedTotalHits',
        'totalHits',
      ]),
    };
  }

  async create(post: PostEntity) {
    return this.client
      .index(this.index)
      .addDocuments(
        await getSearchItem(
          this.categoryRepository,
          this.commentRepository,
          post,
        ),
      );
  }

  async update(posts: PostEntity[]) {
    return this.client
      .index(this.index)
      .updateDocuments(
        await getSearchData(
          posts,
          this.categoryRepository,
          this.commentRepository,
        ),
      );
  }

  async delete(ids: string[]) {
    return this.client.index(this.index).deleteDocuments(ids);
  }
}
