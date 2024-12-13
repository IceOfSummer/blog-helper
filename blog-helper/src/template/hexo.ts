import {BaseStaticResourceMetadata, CommonBlogDatasource, StaticResource, StaticResourceContent, Tag} from "./type";
import {Markdown, splitMarkdownContent} from "../uti/spliter";
import {BaseDatasourceMetadata, DatasourceItem, WebVisitPath} from "../type";
import fs from "node:fs";
import path from "node:path";
import yaml from "yaml";
import createPageWithIndexBuilder, {PageHelperWithIndex} from "../holder/page-index-helper";
import searchPages from "../uti/search";
import cached from "../uti/cached";
import mime from 'mime'

type HexoDatasourceConfig = {
  rootDirectory: string
  pageDirectory: string
  homePageDirectory: string
  staticResourceDirectory: string
  configFileName?: string
}

export type CommonMetadata = {
  tags: string[]
  categories: string[]
  isHomePage?: boolean
} & BaseDatasourceMetadata

export type HexoBasePageMetadata = {
  tags?: string[] | string
  categories?: string[] | string
  title?: string
}



/**
 * - PageMetadata: markdown 顶部使用三个 `-` 包裹起来的 yaml 数据
 * - Metadata: 为防止文章太多而爆内存，从 `PageMetadata` 提取部分字段用于构建索引
 */
export default class HexoDatasource<PageMetadata extends HexoBasePageMetadata> implements CommonBlogDatasource<PageMetadata, CommonMetadata> {

  private config: Required<HexoDatasourceConfig>

  private pageWithIndex: PageHelperWithIndex<CommonMetadata>

  private staticResourceIndex: PageHelperWithIndex<BaseStaticResourceMetadata>

  constructor(config: HexoDatasourceConfig) {
    this.config = {
      // TODO
      configFileName: '_config.yml',
      ...config,
    }

    const pages = searchPages<CommonMetadata>({
      pageDirectory: path.join(this.config.rootDirectory, this.config.pageDirectory),
      nestedHomePageDirectory: config.homePageDirectory
    })
    this.parseAllPages(pages)

    const resources = searchPages<BaseStaticResourceMetadata>({
      pageDirectory: path.join(this.config.rootDirectory, this.config.staticResourceDirectory),
      searchPattern: './**/*'
    })
    for (let resource of resources) {
      resource.metadata.contentType = mime.getType(resource.filepath) ?? ''
    }

    this.staticResourceIndex = createPageWithIndexBuilder(resources)
      .addIndexForArray('visitPath')
      .build()

    this.pageWithIndex = createPageWithIndexBuilder<CommonMetadata>(pages)
      .addIndex('isHomePage')
      // no need for this
      // .addIndexForArray('tags')
      // .addIndexForArray('categories')
      .addIndexForArray('visitPath')
      .build()
  }

  /**
   * 解析所有页面，并添加元数据到 {@link DatasourceItem} 上
   * @private
   */
  private parseAllPages(items: DatasourceItem<CommonMetadata>[]) {
    function asArray(item: string[] | string | undefined): string[] {
      if (Array.isArray(item)) {
        return item
      }
      if (typeof item === 'string') {
        return [item]
      }
      return []
    }

    for (let item of items) {
      const markdown = this.readPageContent(item.filepath)
      item.metadata.tags = asArray(markdown.metadata.tags)
      item.metadata.categories = asArray(markdown.metadata.categories)
    }
  }

  @cached()
  private readPageContent(path: string): Markdown<PageMetadata> {
    const content = fs.readFileSync(path, 'utf8')
    return splitMarkdownContent(content, path)
  }

  @cached({ onlySingleValue: true })
  getConfig<T = Record<string, any>>(): Promise<Readonly<T>> {
    let configFile
    if (!fs.existsSync((configFile = path.resolve(this.config.rootDirectory, '_config.yml')))
      && !fs.existsSync((configFile = path.resolve(this.config.rootDirectory, '_config.yaml')))) {
      throw new Error('Could not find config file from both _config.yml and _config.yaml')
    }
    const parsed = yaml.parse(fs.readFileSync(configFile, { encoding: 'utf8' }))
    return Promise.resolve(parsed)
  }

  pageHomePosts(page: number | undefined = 0, size: number | undefined = 8): Promise<readonly Markdown<PageMetadata>[]> {
    const pages = this.pageWithIndex.getByIndex('isHomePage', true)
    const start = page * size
    const target = pages.slice(start, start + size)

    return Promise.resolve(target.map(t => this.readPageContent(t.filepath)));
  }

  homePostSize(): Promise<number> {
    return Promise.resolve(this.pageWithIndex.getByIndex('isHomePage', true).length)
  }

  getAllPagesUrl(): Promise<readonly DatasourceItem<CommonMetadata>[]> {
    return Promise.resolve(this.pageWithIndex.listAll())
  }

  async getAllStaticResource(): Promise<Readonly<DatasourceItem[]>> {
    return this.staticResourceIndex.listAll()
  }

  getPageByWebUrl(url: WebVisitPath): Promise<Readonly<Markdown<PageMetadata>> | undefined> {
    const items = this.pageWithIndex.getByIndex('visitPath', url)
    if (items.length === 0) {
      return Promise.resolve(undefined)
    }
    const target = items[0]
    return Promise.resolve(this.readPageContent(target.filepath))
  }

  getStaticResourceByWebUrl(url: WebVisitPath): Promise<Readonly<StaticResource> | undefined> {
    const items = this.staticResourceIndex.getByIndex('visitPath', url)
    if (items.length === 0) {
      return Promise.resolve(undefined)
    }
    const target = items[0]

    return Promise.resolve({
      base64: fs.readFileSync(target.filepath, {encoding: 'base64'}),
      contentType: target.metadata.contentType
    })
  }

  @cached({onlySingleValue: true})
  async getTagMapping(): Promise<Map<Tag, Readonly<DatasourceItem<CommonMetadata>[]>>> {
    const pages = this.pageWithIndex.listAll()
    const r = new Map<Tag, DatasourceItem<CommonMetadata>[]>()
    for (const page of pages) {
      for (const category of page.metadata.tags) {
        let o = r.get(category)
        if (!o) {
          o = []
          r.set(category, o)
        }
        o.push(page)
      }
    }
    return r
  }

  @cached({onlySingleValue: true})
  async getCategoriesMapping(): Promise<Map<Tag, Readonly<DatasourceItem<CommonMetadata>[]>>> {
    const pages = this.pageWithIndex.listAll()
    const r = new Map<Tag, DatasourceItem<CommonMetadata>[]>()
    for (const page of pages) {
      for (const category of page.metadata.categories) {
        let o = r.get(category)
        if (!o) {
          o = []
          r.set(category, o)
        }
        o.push(page)
      }
    }
    return r
  }


}