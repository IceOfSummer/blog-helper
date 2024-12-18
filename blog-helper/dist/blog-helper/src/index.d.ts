/**
 * html 富文本字符串
 */
type HTML = string;
interface MarkdownParser {
    /**
     * 解析markdown
     */
    parse(markdown: string): Promise<HTML>;
}
type WebVisitPath = string[];
type BaseDatasourceMetadata = {
    /**
     * 是否为首页
     */
    isHomePage?: boolean;
    /**
     * 访问路径
     */
    visitPath: WebVisitPath;
};
type DatasourceItem<UserData extends BaseDatasourceMetadata = BaseDatasourceMetadata> = {
    /**
     * 唯一标识符, 通常是文件访问路径
     */
    id: string;
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

type SearchConfig<T extends BaseDatasourceMetadata> = {
    initialMetadata?: T;
    /**
     * glob 搜索模式，默认为 '.&#47;**&#47;*.{md,mdx}'
     */
    searchPattern?: string;
    /**
     * 页面存放路径
     */
    pageDirectory: string;
    /**
     * 指明一个目录为特殊目录，该目录中的页面是首页页面，在设置访问路径时需要去除掉目录的前缀。
     */
    nestedHomePageDirectory?: string;
};
declare const searchPages: <T extends BaseDatasourceMetadata>(config: SearchConfig<T>) => DatasourceItem<T>[]

type Markdown<T = unknown> = {
    metadata: T;
    content: string;
};
/**
 * 解析 Markdown 文本内容
 * @param content Markdown内容，提供一个以换行符分割的数组或者整个字符串，后者将会被转化为前者
 * @param filepath 文件路径，当解析 markdown 错误时，将会带上文件路径以便于排查
 */
declare const splitMarkdownContent: <T>(content: string[] | string, filepath?: string) => Markdown<T>

/**
 * 调整标题等级。若 markdown 标题包含 h1，则将所有标题等级提升，确保没有 h1 标签。
 */
declare function adjustToc(): (tree: any) => void;

declare function generateHeadingId(): (tree: any) => void;

type PageHelperWithIndex<T extends BaseDatasourceMetadata> = {
    getById: (id: DatasourceItem<T>['id']) => DatasourceItem<T> | undefined;
    /**
     * 根据索引寻找对应的元素
     * @param index 索引名称
     * @param key 索引值
     * @return {} 找到的元素, 如果没找到，返回空数组
     */
    getByIndex: <Key extends keyof T>(index: keyof T, key: T[Key]) => DatasourceItem<T>[];
    listAll: () => DatasourceItem<T>[];
};
type ValueCastFunction<T> = (val: T) => string;
type AddIndexArgs<T extends BaseDatasourceMetadata, Key extends keyof T> = string extends T[Key] ? [key: Key] : boolean extends T[Key] ? [key: Key] : number extends T[Key] ? [key: Key] : [key: Key, valueToString: ValueCastFunction<T[Key]>];
type AddIndexFunction<T extends BaseDatasourceMetadata> = <Key extends keyof T>(...args: AddIndexArgs<T, Key>) => PageWithIndexBuilder<T>;
declare const ERR_MSG = 'Only array type can be used on this method!'
type AddIndexForArrayArgs<T extends BaseDatasourceMetadata, Key extends keyof T, Element> = Required<T>[Key] extends ArrayLike<infer Element> ? string extends Element ? [key: Key, valueToString?: ValueCastFunction<Element>] : number extends Element ? [key: Key, valueToString?: ValueCastFunction<Element>] : boolean extends Element ? [key: Key, valueToString?: ValueCastFunction<Element>] : [key: Key, valueToString: ValueCastFunction<Element>] : [typeof ERR_MSG];
type AddIndexForArrayFunction<T extends BaseDatasourceMetadata> = <Key extends keyof T, Element>(...args: AddIndexForArrayArgs<T, Key, Element>) => PageWithIndexBuilder<T>;
type PageWithIndexBuilder<T extends BaseDatasourceMetadata> = {
    addIndex: AddIndexFunction<T>;
    addIndexForArray: AddIndexForArrayFunction<T>;
    build: () => PageHelperWithIndex<T>;
};
declare const createPageWithIndexBuilder: <T extends BaseDatasourceMetadata>(items: DatasourceItem<T>[]) => PageWithIndexBuilder<T>

type Tag = string;
type Category = string;
type BaseStaticResourceMetadata = {
    contentType: string;
} & BaseDatasourceMetadata;
type StaticResource = {
    base64: string;
    contentType: string;
};
/**
 * 总结常见博客通常会用到的方法。
 */
interface CommonBlogDatasource<PageMetadata, DatasourceItemMetadata extends BaseDatasourceMetadata> {
    /**
     * 获取配置
     */
    getConfig<T>(): Promise<Readonly<T>>;
    /**
     * 分页获取用于首页展示的博客文章.
     * @param page 从0开始的页码
     * @param size 每页大小
     */
    pageHomePosts(page?: number, size?: number): Promise<DatasourceItem<DatasourceItemMetadata>[]>;
    /**
     * 获取首页文件数量
     */
    homePostSize(): Promise<number>;
    /**
     * 获取所有文章，包括首页的文章
     * <ul>
     *   <li>k: 访问路径</li>
     *   <li>v: 静态资源</li>
     * </ul>
     */
    getAllPagesUrl(): Promise<Array<DatasourceItem<DatasourceItemMetadata>>>;
    /**
     * 获取所有静态资源.
     */
    getAllStaticResource(): Promise<DatasourceItem[]>;
    /**
     * 根据访问路径获取Post. 该方法应该缓存读取结果，以确保多次调用不会出现重复读取的情况。
     * @param url url
     */
    readContent(url: WebVisitPath): Promise<Markdown<PageMetadata> | undefined>;
    /**
     * 根据页面访问路径获取页面
     */
    getPageByWebVisitPath(url: WebVisitPath): DatasourceItem<CommonMetadata> | undefined;
    /**
     * 根据访问路径获取静态资源
     * @return base64 文件内容
     */
    getStaticResourceByWebUrl(url: WebVisitPath): Promise<StaticResource | undefined>;
    /**
     * 获取标签下对应的所有 Post
     */
    getTagMapping(): Promise<Map<Tag, DatasourceItem<DatasourceItemMetadata>[]>>;
    /**
     * 获取某个分类下对应的所有 Post
     */
    getCategoriesMapping(): Promise<Map<Category, DatasourceItem<DatasourceItemMetadata>[]>>;
}

type HexoDatasourceConfig = {
    rootDirectory: string;
    pageDirectory: string;
    homePageDirectory: string;
    staticResourceDirectory: string;
    configFileName?: string;
};
type CommonMetadata = {
    tags: string[];
    categories: string[];
    isHomePage?: boolean;
} & BaseDatasourceMetadata;
type HexoBasePageMetadata = {
    tags?: string[] | string;
    categories?: string[] | string;
    title?: string;
};
/**
 * - PageMetadata: markdown 顶部使用三个 `-` 包裹起来的 yaml 数据
 * - Metadata: 为防止文章太多而爆内存，从 `PageMetadata` 提取部分字段用于构建索引
 */
declare class HexoDatasource<PageMetadata extends HexoBasePageMetadata> implements CommonBlogDatasource<PageMetadata, CommonMetadata> {
  private config
  private pageWithIndex
  private staticResourceIndex
  constructor(config: HexoDatasourceConfig);
  getPageByWebVisitPath(url: WebVisitPath): DatasourceItem<CommonMetadata> | undefined;
  /**
     * 解析所有页面，并添加元数据到 {@link DatasourceItem} 上
     * @private
     */
  private parseAllPages
  private readPageContent
  getConfig<T = Record<string, any>>(): Promise<T>;
  pageHomePosts(page?: number | undefined, size?: number | undefined): Promise<DatasourceItem<CommonMetadata>[]>;
  homePostSize(): Promise<number>;
  getAllPagesUrl(): Promise<DatasourceItem<CommonMetadata>[]>;
  getAllStaticResource(): Promise<DatasourceItem[]>;
  readContent(url: WebVisitPath): Promise<Markdown<PageMetadata> | undefined>;
  getStaticResourceByWebUrl(url: WebVisitPath): Promise<StaticResource | undefined>;
  getTagMapping(): Promise<Map<Tag, DatasourceItem<CommonMetadata>[]>>;
  getCategoriesMapping(): Promise<Map<Tag, DatasourceItem<CommonMetadata>[]>>;
}

type CacheConfig = {
    /**
     * 该如何构建缓存的键
     * @param args 方法入参
     */
    cacheKeyBuilder?: (...args: unknown[]) => string;
    /**
     * 最大容量
     */
    maxSize?: number;
    /**
     * 该方法是否仅会返回一个相同的值. 通常用于加载配置，而配置在构建过程中不会发生改变。
     */
    onlySingleValue?: boolean;
};
/**
 * 缓存某个类中方法的返回值.
 */
declare function cached({ cacheKeyBuilder, maxSize, onlySingleValue }?: CacheConfig): (_: unknown, __: string, descriptor: PropertyDescriptor) => void;

declare function createMdParser(): {
    parse(markdown: string): Promise<string>;
};

export { type BaseDatasourceMetadata, type BaseStaticResourceMetadata, type CacheConfig, type Category, type CommonBlogDatasource, type CommonMetadata, type DatasourceItem, type HexoBasePageMetadata, HexoDatasource, type Markdown, type MarkdownParser, type PageHelperWithIndex, type StaticResource, type Tag, type WebVisitPath, adjustToc as adjustTocPlugin, cached, createMdParser, createPageWithIndexBuilder, generateHeadingId as generateHeadingIdPlugin, searchPages, splitMarkdownContent }
