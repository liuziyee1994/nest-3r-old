// 在utils.ts就近创建一个index.ts，在index.ts中导出utils.ts里的函数,这样做是为了方便导入
// 这样做的话后续直接导入helpers目录就可以使用utils里定义的函数
export * from './utils';
