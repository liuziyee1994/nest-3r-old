// 就近创建一个index.ts,在这个文件里将目录下的东西都导出
// barrel file桶文件,集中导出模块内容,其他地方只需要导入index所在目录即可
export * from './category.controller';
export * from './tag.controller';
export * from './post.controller';
export * from './comment.controller';
