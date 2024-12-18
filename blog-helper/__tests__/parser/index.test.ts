import { expect, test } from '@jest/globals'
import { createMdParser } from '../../src/parser'
import fs from 'node:fs'


test('Test markdown render', async () => {
  const parser = createMdParser()
  const result = await parser.parse(fs.readFileSync('__tests__/__source__/markdown/hello.md', { encoding: 'utf-8' }))
  expect(result).toMatchSnapshot()
})