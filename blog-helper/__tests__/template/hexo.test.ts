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


  const urls = await hexo.getAllPagesUrl()
  expect(urls.length).toBe(2)
  expect(urls.find(url => url.metadata.visitPath[0] === 'hello')).not.toBeFalsy()
  expect(urls.find(url => url.metadata.visitPath[0] === 'world')).not.toBeFalsy()

  const home = await hexo.pageHomePosts(0, 999)
  expect(home.length).toBe(1)
  expect(home[0].metadata.visitPath[0]).toBe('world')

  const config = await hexo.getConfig<MyConfig>()
  expect(config.title).toBe('Hello')
})

