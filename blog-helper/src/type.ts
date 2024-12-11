/**
 * html 富文本字符串
 */
type HTML = string

export interface MarkdownParser {
  /**
   * 解析markdown
   */
  parse(markdown: string): Promise<HTML>
}