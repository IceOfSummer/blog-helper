import type { MarkdownParser, ParsedMarkdown } from '../../types'
import type React from 'react'
import reactParse, {DOMNode, Element, HTMLReactParserOptions} from 'html-react-parser'
import { unified, Plugin } from 'unified'
import remarkParse from 'remark-parse'
import remarkGfm from 'remark-gfm'
import adjustToc from '../../common/toc-adjust-plugin'
import remarkRehype from 'remark-rehype'
import rehypeStringify from 'rehype-stringify'
import generateHeadingId from "../../common/generate-heading-id-plugin";




type MdParserConfig = {
  components?: Record<string, ((node: DOMNode) => ReturnType<Required<HTMLReactParserOptions>['replace']>)>
}

function createMdParser(config: MdParserConfig): MarkdownParser {

  const markdownToHtml = async (markdownContent: string): Promise<string> => {
    const parsed = await unified()
      .use(remarkParse)
      .use(remarkGfm)
      .use(adjustToc)
      .use(remarkRehype, { allowDangerousHtml: true })
      .use(generateHeadingId)
      .use(rehypeStringify, { allowDangerousHtml: true })
      .process(markdownContent)
    return String(parsed)
  }

  function processPostContent(html: string): React.ReactNode {
    return reactParse(html, {

      replace: config.components ? (domNode) => {
        if (!(domNode instanceof Element)) {
          return
        }
        const convert = config.components![domNode.tagName]
        return convert?.(domNode)
      } : undefined

    })
  }

  return {
    async parse(markdown: string): Promise<ParsedMarkdown> {
      const html = await markdownToHtml(markdown)
      const node = processPostContent(html)
      return Promise.resolve(node)
    }
  }
}

export default createMdParser