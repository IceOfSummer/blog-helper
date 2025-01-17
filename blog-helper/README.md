# blog-helper


[中文文档](https://github.com/IceOfSummer/blog-helper/blob/master/README-zh.md)

A utility library, helping developers to build blogs that are based on SSG mode swiftly.


---

Generally, we have these steps to build a blog:

1. Search blog files (such as markdown files) and confirm the visit path.
2. Read and parse the file content; distill the metadata in the file.
3. Rendering, that is, converting the file content into HTML.
4. Display.

Among these steps, the previous three steps have no relation to your base framework, whether it is Vue.js, React.js, or another framework.
The code in these steps can be basically reused.

So the main goal of this library is to **assist** developers in finishing the three steps.


Major features:

- Markdown scan
- Markdown parse and render
- MDX support (Only supports React)
- The support to migrate from Hexo.


## Example

[nextjs-particlex-theme/particlex](https://github.com/nextjs-particlex-theme/particlex/blob/refactor/export/src/api/svc/impl/BlogServiceImpl.ts):
A blog base on [Next.js](https://nextjs.org/).

## Quick start

### Migrate from Hexo

We will help you finish the previous two steps and encapsulate some commonly used methods:

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

See [HexoDatasource](https://github.com/IceOfSummer/blog-helper/wiki/Api#hexodatasource) for more details.

### Custom Steps

#### 1. Search Blog Files

This step only searches the pages and determines the web visit URL, not reads the actual content.

Assume that we have such blog structure:

```
root
├── cn
│     └── nihao.md
├── static
│     └── logo.png
├── hello.md
└── world.md
```

We can search all the pages and static resources like this:

```typescript
import { searchPages, createPageWithIndexBuilder, BaseDatasourceMetadata } from 'blog-helper'

const pages = searchPages({
    pageDirectory: '<path_to_root>/root',
    nestedHomePageDirectory: '<path_to_root>/root/cn',
})

// build index
const pageSource = createPageSourceBuilder<BaseDatasourceMetadata>(pages)
  .addIndex('isHomePage')
  .build()

// get pages by index
const homePages = pageSource.getByIndex('isHomePage', true)
// get all pages
const allPages = pageSource.listAll()

// build index for static resource(optional).
const resources = searchPages<BaseStaticResourceMetadata>({
  pageDirectory: '<path_to_root>/root',
  searchPattern: './static/**/*'
})

const resourceSource = createPageSourceBuilder<BaseDatasourceMetadata>(resources)
  .build()

// ...
```


See the links below for more details:

- [holder/index.test.ts](https://github.com/IceOfSummer/blog-helper/blob/master/blog-helper/__tests__/holder/index.test.ts)
- [API/createPageSourceBuilder](https://github.com/IceOfSummer/blog-helper/wiki/Api#createPageSourceBuilder)
- [API/searchPages](https://github.com/IceOfSummer/blog-helper/wiki/Api#searchpages)

###### About Index

[//]: # (The value type of the index is determined by [createPageSourceBuilder]&#40;https://github.com/IceOfSummer/blog-helper/wiki/Api#createPageSourceBuilder&#41;'s generic.)
Basic metadata type is:

```typescript
export type BaseDatasourceMetadata = {
  isHomePage?: boolean,
  visitPath: WebVisitPath /* string[] */
}
```

You can build an index for all the properties. If the type of value is `string | number | boolean`, we can generate the index key automatically.
Otherwise, you have to give the second argument to generate the index key (you can use it to override the default too):

```typescript
  const pgaeWithIndex = createPageWithIndexBuilder(pages)
  .addIndex('isHomePage', (v => v?.toString() ?? ''))
  .build()
```

###### Build Index For Array Type

If the type of value is `string[] | number[] | boolean[]`, we can build the index key automatically too, but please use `addIndexForArray` instead:

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

#### 2. Markdown Parse


Use `splitMarkdownContent` to parse Markdown. The format of the Markdown is required to be like this(Top metadata is optional):

```markdown
---
title: hello
foo: bar
obj:
  foo: fooInObj
---

Markdown Content
```

Parse：

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

#### 3. Render

##### Render Markdown To HTML

```typescript
import { createMdParser } from 'blog-helper'


const markdownParser = createMdParser()

const html: string = await markdownParser.parse(markdown)
```

##### MDX Support (React Only)

> [!IMPORTANT]
> For Next.js users, consider using [next-mdx-remote](https://nextjs.org/docs/app/building-your-application/configuring/mdx#remote-mdx).

We also support MDX rendering; you have to install it standalone:

```shell
npm i @blog-helper/react-mdx --save
```

**This library only support React environment**

```typescript
import { createMdxParser } from '@blog-helper/react-mdx'

const mdxParser = createMdxParser({
  components: {
    /* Your custom components. */
  }
})

const reactNode: React.ReactNode = mdxParser.parse(markdown)
```

About the `components`, see [offical docs](https://mdxjs.com/guides/injecting-components/) for more details.

## Others

- [Best Practice](https://github.com/IceOfSummer/blog-helper/wiki/Best-Practice)
- [Api](https://github.com/IceOfSummer/blog-helper/wiki/Api)
- [Types](https://github.com/IceOfSummer/blog-helper/wiki/Types)