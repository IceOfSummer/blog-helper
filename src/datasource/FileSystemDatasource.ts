import type { Datasource, DatasourceItem } from './Datasource'
import path from 'node:path'
import { globSync } from 'glob'
import fs from 'node:fs'

type WebPathCallback<UserData> = (page: DatasourceItem<UserData>) => void

export type FileSystemDatasourceConfig<UserData> = {
  /**
   * 存放所有页面的目录
   */
  pageDirectory: string | string[]
  /**
   * 搜索模式, 默认为 '.&#47;**&#47;*.{md,mdx}'
   */
  pageSearchPattern?: string
  /**
   * 用于处理自定义的访问路径
   * @param path 原始访问路径
   * @return {string[]} 新的访问路径
   */
  pageCreatedCallback?: WebPathCallback<UserData>[]
  /**
   * 禁用内容解析
   */
  disableContentParse?: boolean
  /**
   * 初始化值
   */
  userDataInitialValue?: UserData
}


export class FileSystemDatasource<UserData> implements Datasource<UserData> {

  protected readonly config: Required<FileSystemDatasourceConfig<UserData>>

  private idToFileIndex: Record<string, DatasourceItem<UserData>> = {}

  public constructor(conf: FileSystemDatasourceConfig<UserData>) {
    this.config = {
      pageSearchPattern: './**/*.{md,mdx}',
      pageCreatedCallback: [],
      disableContentParse: false,
      // @ts-ignore. anyone can help me here?
      userDataInitialValue: {},
      ...conf,
    }
  }

  private saveToIndex(items: DatasourceItem<UserData>[]) {
    items.forEach(item => {
      this.idToFileIndex[item.id] = item
    })
  }

  /**
   * 为所有页面构造索引
   */
  public init() {
    const pageDirectories = Array.isArray(this.config.pageDirectory) ? this.config.pageDirectory : [this.config.pageDirectory]
    for (let pageDirectory of pageDirectories) {
      const pages = this.listPages(pageDirectory)
      this.saveToIndex(pages)
    }
  }

  public listPages(rootPath: string): DatasourceItem<UserData>[] {
    const searchGlob: string = path.join(rootPath, this.config.pageSearchPattern).replaceAll('\\', '/')

    return globSync(searchGlob, { cwd: process.env.BLOG_PATH }).map(
        v => (this.parseFile(rootPath, v))
      )
  }

  private parseFile(root: string, relative: string): DatasourceItem<UserData> {
    let visitPath = relative.split(path.sep)
    const ext = path.extname(path.sep)
    if (ext) {
      const t = visitPath[visitPath.length - 1]
      visitPath[visitPath.length - 1] = t.substring(0, t.length - ext.length)
    }

    const page: DatasourceItem<UserData> = {
      id: relative,
      type: ext ? ext.substring(1) : ext,
      visitPath: visitPath,
      filepath: path.join(root, relative),
      metadata: this.config.userDataInitialValue
    }
    for (let cb of this.config.pageCreatedCallback) {
      cb(page)
    }
    return page
  }

  getPage(id: DatasourceItem<UserData>['id']): Promise<string | undefined> {
    const page = this.idToFileIndex[id]
    if (!page) {
      return Promise.resolve(undefined)
    }
    const filepath = path.resolve(page.filepath)
    if (!fs.existsSync(filepath)) {
      throw new Error('Could not find page with item ' + filepath)
    }
    return Promise.resolve(fs.readFileSync(filepath, { encoding: 'utf-8' }))
  }

  getAllPages(): Promise<DatasourceItem<UserData>[]> {
    return Promise.resolve(Object.values(this.idToFileIndex))
  }

}