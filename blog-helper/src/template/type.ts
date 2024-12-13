import {BaseDatasourceMetadata, DatasourceItem, WebVisitPath} from "../type";
import {Markdown} from "../uti/spliter";


export type StaticResourceContent = {
  base64: string
  contentType: string
}

export type Tag = string

export type Category = string

export type BaseStaticResourceMetadata = {
  contentType: string
} & BaseDatasourceMetadata

export type StaticResource = {
  base64: string
  contentType: string
}

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
  pageHomePosts(page?: number, size?: number): Promise<Readonly<Markdown<PageMetadata>[]>>

  /**
   * {@link BlogDataSource#pageHomePosts} 的总博客文章数量
   */
  homePostSize(): Promise<number>

  /**
   * 获取所有文章，包括首页的文章
   * <ul>
   *   <li>k: 访问路径</li>
   *   <li>v: 静态资源</li>
   * </ul>
   */
  getAllPagesUrl(): Promise<Readonly<Array<DatasourceItem<DatasourceItemMetadata>>>>

  /**
   * 获取所有静态资源.
   * @return {} 静态资源
   * <ul>
   *   <li>k: 访问路径, see: {@link StaticResource#accessPath}</li>
   *   <li>v: 静态资源</li>
   * </ul>
   */
  getAllStaticResource(): Promise<Readonly<DatasourceItem[]>>
  /**
   * 根据访问路径获取Post
   * @param url url
   */
  getPageByWebUrl(url: WebVisitPath): Promise<Readonly<Markdown<PageMetadata>> | undefined>

  /**
   * 根据访问路径获取静态资源
   * @return base64 文件内容
   */
  getStaticResourceByWebUrl(url: WebVisitPath): Promise<Readonly<StaticResource> | undefined>
  /**
   * 获取标签下对应的所有 Post
   */
  getTagMapping(): Promise<Map<Tag, Readonly<DatasourceItem<DatasourceItemMetadata>[]>>>

  /**
   * 获取某个分类下对应的所有 Post
   */
  getCategoriesMapping(): Promise<Map<Category, Readonly<DatasourceItem<DatasourceItemMetadata>[]>>>
}