import {expect, test} from '@jest/globals';
import searchPages from "../../src/uti/search";
import createPageWithIndexBuilder from "../../src/holder/page-index-helper";
import {BaseDatasourceMetadata} from "../../src/type";


test('Test index build', () => {
  const pages = searchPages({
    pageDirectory: '__tests__/__source__/basic/',
    nestedHomePageDirectory: 'cn',
  })

  const pgaeWithIndex = createPageWithIndexBuilder(pages)
    .addIndex('isHomePage')
    .build()
  const homePages = pgaeWithIndex.getByIndex('isHomePage', true)
  expect(homePages).toBeTruthy()
  expect(homePages!.length).toBe(1)
  expect(homePages![0].metadata.visitPath).toStrictEqual(['nihao'])
})

test('Build index with custom metadata', () => {
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

  const pageWithIndex = createPageWithIndexBuilder(pages)
    .addIndexForArray('tag')
    .build()

  expect(pages[0]).toStrictEqual(pageWithIndex.getByIndex('tag', ['one', 'hello'])[0])
  expect(pages[1]).toStrictEqual(pageWithIndex.getByIndex('tag', ['two'])[0])
})