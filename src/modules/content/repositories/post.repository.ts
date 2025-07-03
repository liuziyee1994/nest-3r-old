import { CommentEntity } from '@/modules/content/entities/comment.entity';
import { PostEntity } from '@/modules/content/entities/post.entity';
import { BaseRepository } from '@/modules/database/base/repository';
import { CustomRepository } from '@/modules/database/decorators/repository.decorator';

@CustomRepository(PostEntity)
export class PostRepository extends BaseRepository<PostEntity> {
  protected _qbName = 'post';

  buildBaseQB() {
    // 在查询之前先查询出评论数量在添加到commentCount字段上
    return (
      this.createQueryBuilder('post')
        .leftJoinAndSelect('post.category', 'category')
        .leftJoinAndSelect('post.tags', 'tags')
        // 添加一个子查询,用来查询评论数量
        .addSelect((subQuery) => {
          return subQuery
            .select('COUNT(c.id)', 'count')
            .from(CommentEntity, 'c')
            .where('c.post.id = post.id');
        }, 'commentCount')
        // 通过loadRelationCountAndMap将前面查询出来的评论数映射到commentCount这个虚拟字段
        .loadRelationCountAndMap('post.commentCount', 'post.comments')
    );
  }
}
