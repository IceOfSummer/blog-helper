import type { BaseDatasourceMetadata, DatasourceItem, WebVisitPath } from '../type'
import type { Markdown } from '../uti/spliter'
import type { CommonMetadata } from './hexo'

export type Tag = string

export type Category = string

export type BaseStaticResourceMetadata = {
  contentType: string
} & BaseDatasourceMetadata

export type StaticResource = {
  base64: string
  contentType: string
}

/**
 * 总结常见博客通常会用到的方法。
 */
export interface CommonBlogDatasource<PageMetadata, DatasourceItemMetadata extends BaseDatasourceMetadata> {
  /**
   * 获取配置
   */
  getConfig<T>(): Promise<Readonly<T>>
  /**
   * 分页获取用于首页展示的博客文章.
   * @param page 从0开始的页码
   * @param size 每页大小
   */
  pageHomePosts(page?: number, size?: number): Promise<DatasourceItem<DatasourceItemMetadata>[]>

  /**
   * 获取首页页面数量
   */
  homePostSize(): Promise<number>
  /**
   * 获取所有页面
   */
  getAllPages(): Promise<Array<DatasourceItem<DatasourceItemMetadata>>>

  /**
   * 获取所有静态资源.
   */
  getAllStaticResource(): Promise<DatasourceItem[]>
  /**
   * 根据访问路径获取Post. 该方法应该缓存读取结果，以确保多次调用不会出现重复读取的情况。
   * @param url url
   */
  readContent(url: WebVisitPath): Promise<Markdown<PageMetadata> | undefined>
  /**
   * 根据页面访问路径获取页面
   */
  getPageByWebVisitPath(url: WebVisitPath): DatasourceItem<CommonMetadata> | undefined
  /**
   * 根据访问路径获取静态资源
   * @return base64 文件内容
   */
  readStaticResourceByWebUrl(url: WebVisitPath): Promise<StaticResource| undefined>
  /**
   * 获取标签下对应的所有 Post
   */
  getTagMapping(): Promise<Map<Tag, DatasourceItem<DatasourceItemMetadata>[]>>

  /**
   * 获取某个分类下对应的所有 Post
   */
  getCategoriesMapping(): Promise<Map<Category, DatasourceItem<DatasourceItemMetadata>[]>>
}