import {BaseDatasourceMetadata, DatasourceItem} from "../type";
import path from "node:path";
import {globSync} from "glob";
import os from "node:os";

type SearchConfig<T extends BaseDatasourceMetadata> = {
  initialMetadata?: T
  /**
   * glob 搜索模式，默认为 '.&#47;**&#47;*.{md,mdx}'
   */
  searchPattern?: string
  /**
   * 页面存放路径
   */
  pageDirectory: string
  /**
   * 指明一个目录为特殊目录，该目录中的页面是首页页面，在设置访问路径时需要去除掉目录的前缀。
   */
  nestedHomePageDirectory?: string
}

export const searchPages = <T extends BaseDatasourceMetadata> (config: SearchConfig<T>): DatasourceItem<T>[] => {
  let nested: string[] | undefined
  if (config.nestedHomePageDirectory) {
    const relative = path.relative(config.pageDirectory, config.nestedHomePageDirectory)
    if (relative.startsWith('..')) {
      throw Error('nestedHomePageDirectory must be nested in pageDirectory!')
    }
    nested = path.normalize(relative).split(path.sep)
  }
  // const nested = config.nestedHomePageDirectory ? config.nestedHomePageDirectory.split('/') : undefined

  const root = path.resolve(config.pageDirectory)
  const items = globSync(config.searchPattern ?? './**/*.{md,mdx}', { cwd: root })


  return items.map(relative => {
    const visitPath = relative.split(path.sep)
    const ext = path.extname(relative)
    if (ext) {
      const t = visitPath[visitPath.length - 1]
      visitPath[visitPath.length - 1] = t.substring(0, t.length - ext.length)
    }

    const base: DatasourceItem<T> = {
      filepath: path.join(root, relative),
      type: ext,
      id: relative,
      // @ts-ignore
      metadata: {
        isHomePage: false,
        visitPath,
      }
    }
    if (nested && visitPath.length > nested.length) {
      let match = true
      for (let i = 0; i < nested.length; i++) {
        if (visitPath[i] != nested[i]) {
          match = false
          break
        }
      }
      if (match) {
        base.metadata.visitPath = base.metadata.visitPath.slice(nested.length)
        base.metadata.isHomePage = true
      }
    }
    return base
  })
}

