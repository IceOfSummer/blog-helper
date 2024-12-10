import type { MarkdownParser, ParsedMarkdown } from '../../types'
import type {ReactNode} from 'react'
import { compile, run } from '@mdx-js/mdx'
import * as runtime from 'react/jsx-runtime'
import * as os from "node:os";
import createCommonHeadingWithId from './CommonHeadingWithId'
import adjustToc from '../../common/toc-adjust-plugin'
import remarkGfm from 'remark-gfm'

const components = {
  h1: createCommonHeadingWithId('h1'),
  h2: createCommonHeadingWithId('h2'),
  h3: createCommonHeadingWithId('h3'),
  h4: createCommonHeadingWithId('h4'),
  h5: createCommonHeadingWithId('h5'),
}


async function parseMarkdownContent0(content: string): Promise<ReactNode> {
  const code = String(await compile(content, { outputFormat: 'function-body', remarkPlugins: [adjustToc, remarkGfm] }))

  const { default: MDXContent } = await run(code, {
    ...runtime,
    // @ts-ignore
    baseUrl: import.meta.url,
  })

  // Render the MDX content, supplying the ClientComponent as a component
  return <MDXContent components={components} />
}

type ParseError = Error & {
  line: number
  name: string
  column: number
  place: {
    line: number
    column: number
    offset: number
  }
}

function isParseAeeror(err: unknown): err is ParseError {
  if (!err || !(typeof err === 'object')) {
    return false
  }
  const errObj = err as Partial<ParseError>
  return !!errObj.column && !!errObj.line && !!errObj.name && !!errObj.place
}

function takeAboveLines(self: string[], lines: string[], startLine: number, lineCnt: number) {
  const cnt = Math.min(startLine, lineCnt - 1)

  for (let i = startLine - cnt; i <= startLine; i++) {
    self.push(` ${i.toString(10).padStart(4, ' ')} | ${lines[i]}`)
  }
}

/**
 * 处理 html 博客内容
 */
async function parseMarkdownContent(content: string): Promise<React.ReactNode> {
  try {
    return await parseMarkdownContent0(content)
  } catch (e) {
    if (!isParseAeeror(e)) {
      return Promise.reject(e)
    }
    // indicate where is wrong.
    const lines = content.split(os.EOL)
    const message = ['Failed to parse markdown content:']
    const programLine = e.line - 1

    message.push('')
    takeAboveLines(message, lines, programLine, 4)

    message.push('        ' + (new Array(e.column - 1).join(' ')) + '^')
    message.push('\t' + e.message)


    return Promise.reject(new Error(message.join(os.EOL)))
  }
}


const mdxParser: MarkdownParser = {
  async parse(markdown: string): Promise<ParsedMarkdown> {

    return await parseMarkdownContent(markdown)
  }
}

export default mdxParser
