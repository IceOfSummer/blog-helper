import { expect, test } from '@jest/globals'
import { searchPages } from '../src/uti/search'


test('Test page list', async () => {
  const pages = searchPages({
    pageDirectory: '__tests__/__source__/basic/',
    nestedHomePageDirectory: '__tests__/__source__/basic/cn',
  })

  expect(pages.find(v => (v.metadata.visitPath[0] === 'world'))).not.toBeFalsy()
  expect(pages.find(v => (v.metadata.visitPath[0] === 'hello'))).not.toBeFalsy()
  const home = pages.find(v => (v.metadata.visitPath[0] === 'nihao'))
  expect(home).not.toBeFalsy()
  expect(home!.metadata.isHomePage).toBeTruthy()

  const resources = searchPages({
    pageDirectory: '__tests__/__source__/basic/',
    searchPattern: 'static/**/*'
  })
  expect(resources.length).toBe(1)
  expect(resources[0].metadata.visitPath).toStrictEqual(['static', 'hello'])
})

