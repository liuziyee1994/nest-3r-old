// src/modules/content/repositories/tag.repository.ts
import { PostEntity } from '@/modules/content/entities/post.entity';
import { TagEntity } from '@/modules/content/entities/tag.entity';
import { BaseRepository } from '@/modules/database/base/repository';
import { CustomRepository } from '@/modules/database/decorators/repository.decorator';

@CustomRepository(TagEntity)
export class TagRepository extends BaseRepository<TagEntity> {
  protected _qbName = 'tag';

  buildBaseQB() {
    return this.createQueryBuilder('tag')
      .leftJoinAndSelect('tag.posts', 'posts')
      .addSelect(
        (subQuery) =>
          subQuery.select('COUNT(p.id)', 'count').from(PostEntity, 'p'),
        'postCount',
      )
      .orderBy('postCount', 'DESC')
      .loadRelationCountAndMap('tag.postCount', 'tag.posts');
  }
}
