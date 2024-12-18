import os from 'node:os'
import yaml, { YAMLParseError } from 'yaml'

const YAML_INDEX_SPACES_FILL = (new Array(2)).map(() => ' ').join('')
/**
 * 将 `\t` 替换为 `两个空格`.<p>
 * 用于处理 yaml 中使用了 `\t` 作为缩进的问题
 * @param str
 */
const replacePrefixIndent = (str) => {
  let i = 0
  while (i < str.length && str.charAt(i) === '\t') {
    i++
  }
  if (i === str.length) {
    return ''
  }
  if (i === 0) {
    return str
  }
  const spaces = []
  for (let j = 0; j < i; j++) {
    spaces.push(YAML_INDEX_SPACES_FILL)
  }
  return spaces.join('') + str.substring(i)
}
var CollectStatus;
(function (CollectStatus) {
  CollectStatus[CollectStatus['EXPECT_START'] = 0] = 'EXPECT_START'
  CollectStatus[CollectStatus['EXPECT_END'] = 1] = 'EXPECT_END'
  CollectStatus[CollectStatus['DONE'] = 2] = 'DONE'
})(CollectStatus || (CollectStatus = {}))
const REPLACE_REGX = /^\t+/g
/**
 * 创建一个错误，指出哪里使用了 TAB
 */
function indicateWhereContainsTab(yamlLines, filePath) {
  const msg = [`Failed to parse YAML in the markdown file '${filePath}'. The lines below start with a TAB (TABs are replaced by a '→'):`]
  for (let i = 0; i < yamlLines.length; i++) {
    const line = yamlLines[i]
    if (line.startsWith('\t')) {
      msg.push(`\tLine ${i + 1}, content: ${line.replaceAll(REPLACE_REGX, '→')}`)
    }
  }
  msg.push('\nYou can either replace them with spaces or modify the environment variable \'YAML_INDENT_SPACE_COUNT\' to fix it automatically.')
  return new Error(msg.join('\n'))
}
/**
 * 解析 Markdown 文本内容
 * @param content Markdown内容，提供一个以换行符分割的数组或者整个字符串，后者将会被转化为前者
 * @param filepath 文件路径，当解析 markdown 错误时，将会带上文件路径以便于排查
 */
const splitMarkdownContent = (content, filepath = '<Unknown>') => {
  const metadataStrArr = []
  let metadataCollectStatus = CollectStatus.EXPECT_START
  const contentArr = Array.isArray(content) ? content : content.split(os.EOL)
  for (const line of contentArr) {
    if (metadataCollectStatus == CollectStatus.DONE) {
      break
    }
    switch (metadataCollectStatus) {
    case CollectStatus.EXPECT_START: {
      if (line.startsWith('---')) {
        metadataCollectStatus = CollectStatus.EXPECT_END
      }
      break
    }
    case CollectStatus.EXPECT_END: {
      if (line.startsWith('---')) {
        metadataCollectStatus = CollectStatus.DONE
        break
      }
      metadataStrArr.push(line)
      break
    }
    default:
      throw new Error('Unreachable branch!')
    }
  }
  if (metadataCollectStatus !== CollectStatus.DONE) {
    return {
      content: Array.isArray(content) ? content.join(os.EOL) : content,
      metadata: {}
    }
  }
  let metadata
  try {
    metadata = yaml.parse(metadataStrArr.join('\n'))
  }
  catch (e) {
    if (e instanceof YAMLParseError && e.code === 'TAB_AS_INDENT') {
      const str = metadataStrArr.map(replacePrefixIndent).join('\n')
      try {
        metadata = yaml.parse(str)
      }
      catch (_) {
        throw indicateWhereContainsTab(metadataStrArr, filepath)
      }
    }
    else {
      throw new Error(`Parse yaml file '${filepath}' failed, content:\n${metadataStrArr.join(os.EOL)}`, { cause: e })
    }
  }
  return {
    content: contentArr.slice(metadataStrArr.length + 2).join(os.EOL),
    metadata,
  }
}

export { splitMarkdownContent }
