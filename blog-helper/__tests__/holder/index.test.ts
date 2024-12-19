import { expect, test } from '@jest/globals'
import { searchPages } from '../../src/uti/search'
import { createPageSourceBuilder } from '../../src/holder/page-index-helper'
import type { BaseDatasourceMetadata } from '../../src/type'


test('Test index build', () => {
  const pages = searchPages({
    pageDirectory: '__tests__/__source__/basic/',
    nestedHomePageDirectory: '__tests__/__source__/basic/cn',
  })

  const pgaeWithIndex = createPageSourceBuilder(pages)
    .addIndex('isHomePage', (v => v?.toString() ?? 'empty'))
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
    nestedHomePageDirectory: '__tests__/__source__/basic/cn',
  })
  expect(pages.length).toBe(3)
  pages[0].metadata.tag = ['one', 'hello']
  pages[1].metadata.tag = ['two']

  const pageWithIndex = createPageSourceBuilder(pages)
    .addIndexForArray('tag')
    .build()

  expect(pages[0]).toStrictEqual(pageWithIndex.getByIndex('tag', ['one', 'hello'])[0])
  expect(pages[1]).toStrictEqual(pageWithIndex.getByIndex('tag', ['two'])[0])
})