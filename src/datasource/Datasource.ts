
export type DatasourceItem<UserData> = {
  /**
   * 唯一标识符, 通常是文件访问路径
   */
  id: string;
  /**
   * 访问路径
   */
  visitPath: WebVisitPath
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

export type WebVisitPath = string[]


export interface Datasource<UserData> {
  /**
   * 获取所有的资源
   * @return {string} 文章唯一标识符
   */
  getAllPages(): Promise<Array<DatasourceItem<UserData>>>

  /**
   * 获取资源的内容
   */
  getPage(id: DatasourceItem<UserData>['id']): Promise<string | undefined>
}