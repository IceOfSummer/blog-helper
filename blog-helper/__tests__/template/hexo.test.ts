import { expect, test } from '@jest/globals'
import { HexoDatasource } from '../../src/template/hexo'


type MyConfig = {
  title: string
}
test('Test hexo datasource', async () => {
  const hexo = new HexoDatasource({
    rootDirectory: '__tests__/__source__/hexo',
    homePageDirectory: 'source/_posts',
    pageDirectory: 'source',
    staticResourceDirectory: 'source/static'
  })


  const urls = hexo.getAllPages()
  expect(urls.find(url => url.metadata.visitPath[0] === 'hello')).not.toBeFalsy()
  expect(urls.find(url => url.metadata.visitPath[0] === 'world')).not.toBeFalsy()

  let home = hexo.pageHomePosts(0, 2)
  const result: string[] = []

  expect(home.length).toBe(2)
  result.push(...home.map(v => v.metadata.visitPath[0]))

  home = hexo.pageHomePosts(1, 2)
  expect(home.length).toBe(1)
  result.push(...home.map(v => v.metadata.visitPath[0]))

  result.sort()
  expect(result).toStrictEqual(['world', 'world2', 'world3'])

  const config = hexo.getConfig<MyConfig>()
  expect(config.title).toBe('Hello')
})

