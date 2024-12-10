import {FileSystemDatasource} from "../../src";
import fs from "node:fs";
import {expect, test} from '@jest/globals';


test('Test page list', async () => {
  const filesystemDatasource = new FileSystemDatasource({
    pageDirectory: '__tests__/__source__/basic/'
  })

  filesystemDatasource.init()

  const pages = await filesystemDatasource.getAllPages()

  expect(pages.find(v => (v.visitPath[0] === 'world'))).not.toBeNull()
  expect(pages.find(v => (v.visitPath[0] === 'hello'))).not.toBeNull()
  expect(pages.find(v => (v.visitPath[0] === 'cn' && v.visitPath[1] === 'nihao'))).not.toBeNull()
})

test('Test callback', async () => {
  type Metadata = {
    homePage?: boolean
  }
  const filesystemDatasource = new FileSystemDatasource<Metadata>({
    pageDirectory: '__tests__/__source__/basic/',
    pageCreatedCallback: [
      (page) => {
        if (page.visitPath[0] === 'cn') {
          page.metadata.homePage = true
          page.visitPath = page.visitPath.slice(1)
        }
      }
    ]
  })

  filesystemDatasource.init()
  const pages = await filesystemDatasource.getAllPages()
  const homePage = pages.find(v => (v.visitPath[0] === 'nihao'))
  expect(homePage).not.toBeNull()
  expect(homePage!!.metadata.homePage).toBeTruthy()
})

test('Test get page', async () => {
  const filesystemDatasource = new FileSystemDatasource({
    pageDirectory: '__tests__/__source__/basic/'
  })

  filesystemDatasource.init()

  const pages = await filesystemDatasource.getAllPages()

  const page = pages.find(v => (v.visitPath[0] === 'cn' && v.visitPath[1] === 'nihao'))

  expect(page).not.toBeFalsy()
  expect(await filesystemDatasource.getPage(page!!.id)).toBe(fs.readFileSync('__tests__/__source__/basic/cn/nihao.md', {encoding: 'utf-8'}))
})