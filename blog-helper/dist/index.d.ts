type DatasourceItem<UserData> = {
    /**
     * 唯一标识符, 通常是文件访问路径
     */
    id: string;
    /**
     * 访问路径
     */
    visitPath: WebVisitPath;
    /**
     * 文件类型，可以是文件路径，或者文件类型拓展符
     */
    type: string;
    /**
     * 文件路径
     */
    filepath: string;
    /**
     * 用户通过回调函数添加的元数据
     */
    metadata: UserData;
};
type WebVisitPath = string[];
interface Datasource<UserData> {
    /**
     * 获取所有的资源
     * @return {string} 文章唯一标识符
     */
    getAllPages(): Promise<Array<DatasourceItem<UserData>>>;
    /**
     * 获取资源的内容
     */
    getPage(id: DatasourceItem<UserData>['id']): Promise<string | undefined>;
}

type WebPathCallback<UserData> = (page: DatasourceItem<UserData>) => void;
type FileSystemDatasourceConfig<UserData> = {
    /**
     * 存放所有页面的目录
     */
    pageDirectory: string | string[];
    /**
     * 搜索模式, 默认为 '.&#47;**&#47;*.{md,mdx}'
     */
    pageSearchPattern?: string;
    /**
     * 用于处理自定义的访问路径
     * @param path 原始访问路径
     * @return {string[]} 新的访问路径
     */
    pageCreatedCallback?: WebPathCallback<UserData>[];
    /**
     * 禁用内容解析
     */
    disableContentParse?: boolean;
    /**
     * 初始化值
     */
    userDataInitialValue?: UserData;
};
declare class FileSystemDatasource<UserData> implements Datasource<UserData> {
    protected readonly config: Required<FileSystemDatasourceConfig<UserData>>;
    private idToFileIndex;
    constructor(conf: FileSystemDatasourceConfig<UserData>);
    private saveToIndex;
    /**
     * 为所有页面构造索引
     */
    init(): void;
    listPages(rootPath: string): DatasourceItem<UserData>[];
    private parseFile;
    getPage(id: DatasourceItem<UserData>['id']): Promise<string | undefined>;
    getAllPages(): Promise<DatasourceItem<UserData>[]>;
}

type Markdown<T = unknown> = {
    metadata: T;
    content: string;
};
/**
 * 解析 Markdown 文本内容
 * @param content Markdown内容，提供一个以换行符分割的数组或者整个字符串，后者将会被转化为前者
 * @param filepath 文件路径，当解析 markdown 错误时，将会带上文件路径以便于排查
 */
declare const splitMarkdownContent: <T>(content: string[] | string, filepath?: string) => Markdown<T>;

/**
 * 调整标题等级。若 markdown 标题包含 h1，则将所有标题等级提升，确保没有 h1 标签。
 */
declare function adjustToc(): (tree: any) => void;

declare function generateHeadingId(): (tree: any) => void;

export { FileSystemDatasource, adjustToc as adjustTocPlugin, generateHeadingId as generateHeadingIdPlugin, splitMarkdownContent };
