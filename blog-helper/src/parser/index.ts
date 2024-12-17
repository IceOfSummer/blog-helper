import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkGfm from 'remark-gfm'
import adjustToc from './toc-adjust-plugin'
import remarkRehype from 'remark-rehype'
import rehypeStringify from 'rehype-stringify'
import generateHeadingId from "./generate-heading-id-plugin";


export function createMdParser() {

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

  return {
    async parse(markdown: string): Promise<string> {
      return markdownToHtml(markdown)
    }
  }
}

