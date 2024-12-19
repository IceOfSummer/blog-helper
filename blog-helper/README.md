# blog-helper

> [!CAUTION]
> 目前正处于测试阶段!

一个工具库，用于帮助开发者快速构建基于 SSG 模式输出的博客。

---

通常，我们构建一个 SSG 博客需要如下的流程：

1. 搜索博客文件(例如 markdown 文件)并确定访问路径(一个博客通常会分为普通页面和首页页面，需要将文件路径转换为网页访问路径)
2. 解析博客文件，读取文件内容，提取顶部元数据
3. 渲染，即将文件内容转换为 html
4. 展示

其中，前 3 步与博客架构使用的基础框架基本无关，即无论是使用 Vue.js、React.js 或者其它框架，对于前 3 步所使用的代码，两者之间基本可以直接复用。

所以本库主要是**协助**完成前 3 步(包括)的步骤，减轻开发者的心智负担。

主要功能:

- markdown 扫描
- markdown 解析/渲染为 HTML
- mdx 支持(仅支持 React)
- 提供有关 hexo 博客迁移的支持

## Example

[nextjs-particlex-theme/particlex](https://github.com/nextjs-particlex-theme/particlex/blob/refactor/export/src/api/svc/impl/BlogServiceImpl.ts): 
一个基于 [Next.js](https://nextjs.org/) 的博客框架。 

## 快速开始

### 从 Hexo 博客迁移

该类将会为你完成除了第三步渲染之外的步骤，并且封装一些常用的方法:

```typescript
import { HexoDatasource } from 'blog-helper'

const hexo = new HexoDatasource({
  rootDirectory: '<abstract_hexo_root_path>',
  homePageDirectory: 'source/_posts',
  pageDirectory: 'source',
  staticResourceDirectory: 'source/static'
})

const urls = await hexo.getAllPagesUrl()
console.log(urls)

const home = await hexo.pageHomePosts(0, 999)
console.log(home)

// ...
```
**静态资源只能存放在一个目录中，不可以和页面混放！虽然 hexo 支持混放，但是在 SSG 框架中很难处理混放的场景。**

更多方法详见: [HexoDatasource](https://github.com/IceOfSummer/blog-helper/wiki/Api#hexodatasource)

### 自定义流程 

#### 1. 搜索博客文件

该过程仅扫描有哪些页面，并获取对应的访问路径，该过程不会实际读取文件内容。

> [!NOTE]
> 详细可以参考: [holder/index.test.ts](blog-helper/__tests__/holder/index.test.ts)

假设博客目录结构如下:

```
root
├── cn
│     └── nihao.md
├── static
│     └── logo.png
├── hello.md
└── world.md

```

扫描所有的页面和静态资源:

```typescript
import { searchPages, createPageWithIndexBuilder, BaseDatasourceMetadata } from 'blog-helper'

const pages = searchPages({
    pageDirectory: '<path_to_root>/root',
    nestedHomePageDirectory: '<path_to_root>/root/cn',
})

// 构建索引
const pageSource = createPageSourceBuilder<BaseDatasourceMetadata>(pages)
  .addIndex('isHomePage')
  .build()

// 获取所有首页页面
const homePages = pageSource.getByIndex('isHomePage', true)
// 获取所有页面
const allPages = pageSource.listAll()

// 为静态资源构建索引
const resources = searchPages<BaseStaticResourceMetadata>({
  pageDirectory: '<path_to_root>/root',
  searchPattern: './static/**/*'
})

const resourceSource = createPageSourceBuilder<BaseDatasourceMetadata>(resources)
  .build()

// ...
```

更多详细信息请查阅:

- [createPageSourceBuilder](https://github.com/IceOfSummer/blog-helper/wiki/Api#createPageSourceBuilder)
- [searchPages](https://github.com/IceOfSummer/blog-helper/wiki/Api#searchpages)

###### 关于索引

索引的值由 [createPageSourceBuilder](https://github.com/IceOfSummer/blog-helper/wiki/Api#createPageSourceBuilder) 的泛型决定，默认类型为:

```typescript
export type BaseDatasourceMetadata = {
  isHomePage?: boolean,
  visitPath: WebVisitPath /* string[] */
}
```

你可以为所有的字段构建索引，如果值的类型是 `string | number | boolean`， 那么内部将会自动生成对应索引的键；
否则你需要手动指示如何生成键(也可以覆盖默认的生成规则):

```typescript
  const pgaeWithIndex = createPageWithIndexBuilder(pages)
  .addIndex('isHomePage', (v => v?.toString() ?? 'empty'))
  .build()
```

###### 为数组类型生成索引

如果元数据数组类型，并且类型是 `string[] | number[] | boolean[]`，那么同样也可以自动构建索引，不过请使用 `addIndexForArray`:

```typescript
type MyMetadata = BaseDatasourceMetadata & {
  tag?: string[]
}
const pages = searchPages<MyMetadata>({
  pageDirectory: '__tests__/__source__/basic/',
  nestedHomePageDirectory: 'cn',
})

expect(pages.length).toBe(3)
pages[0].metadata.tag = ['one', 'hello']
pages[1].metadata.tag = ['two']

const pageWithIndex = createPageSourceBuilder(pages)
  .addIndexForArray('tag')
  .build()

expect(pages[0]).toStrictEqual(pageWithIndex.getByIndex('tag', ['one', 'hello'])[0])
expect(pages[1]).toStrictEqual(pageWithIndex.getByIndex('tag', ['two'])[0])
```

#### 2. markdown 解析


使用 `splitMarkdownContent` 即可对 markdown 进行简单解析，该方法要求 markdown 的格式如下：

```markdown
---
title: hello
foo: bar
obj:
  foo: fooInObj
---

Markdown Content
```

解析：

```typescript
import { splitMarkdownContent } from 'blog-helper'

type MyMarkdownMetadata = {
  foo?: string
  obj?: {
    foo?: string
  }
}

const markdownContent: string = "<content_below>"

const markdown = splitMarkdownContent<MyMarkdownMetadata>(markdownContent)

// hello
console.log(markdown.metadata.title)
// bar
console.log(markdown.metadata.foo)
// fooInObj
console.log(markdown.metadata.obj?.foo)
// Markdown Content
console.log(markdown.content)
```

#### 3. 渲染

##### 渲染 markdown 为 HTML

```typescript
import { createMdParser } from 'blog-helper'


const markdownParser = createMdParser()

const html: string = await markdownParser.parse(markdown)
```

##### 添加 mdx 支持(仅支持 React)

本库还提供了 mdx 支持，需要单独安装：

```shell
npm i @blog-helper/react-mdx --save
```

**该库仅支持 React 环境**

```typescript
import { createMdxParser } from '@blog-helper/react-mdx'

const mdxParser = createMdxParser({
  components: {
    /* Your custom components. */
  }
})

const reactNode: React.ReactNode = mdxParser.parse(markdown)
```

有关 `components` 参数，详细请参考[官方文档](https://mdxjs.com/guides/injecting-components/)

## 其它

- [最佳实践](https://github.com/IceOfSummer/blog-helper/wiki/Best-Practice)
- [Api](https://github.com/IceOfSummer/blog-helper/wiki/Api)
- [Types](https://github.com/IceOfSummer/blog-helper/wiki/Types)