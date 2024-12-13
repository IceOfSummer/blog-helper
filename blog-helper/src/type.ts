
/**
 * html 富文本字符串
 */
type HTML = string

export interface MarkdownParser {
  /**
   * 解析markdown
   */
  parse(markdown: string): Promise<HTML>
}

export type WebVisitPath = string[]


export type BaseDatasourceMetadata = {
  /**
   * 是否为首页
   */
  isHomePage?: boolean,
  /**
   * 访问路径
   */
  visitPath: WebVisitPath
}

export type DatasourceItem<UserData extends BaseDatasourceMetadata = BaseDatasourceMetadata> = {
  /**
   * 唯一标识符, 通常是文件访问路径
   */
  id: string;
  /**
   * 文件类型，可以是文件路径，或者文件类型拓展符
   */
  type: string
  /**
   * 文件路径
   */
  filepath: string
  /**
   * 用户通过回调函数添加的元数据
   */
  metadata: UserData
}

