import { visit } from 'unist-util-visit'

const HEADING_MAP = {
  h1: 1,
  h2: 2,
  h3: 3,
  h4: 4,
  h5: 5,
}
function generateHeadingId() {
  return function (tree) {
    visit(tree, 'element', (node) => {
      const level = HEADING_MAP[node.tagName]
      if (!level) {
        return
      }
      const idBuilder = []
      for (const child of node.children) {
        if (child.type === 'text') {
          idBuilder.push(child.value)
        }
      }
      Object.assign(node.properties, { id: idBuilder.join('-').replaceAll(' ', '-') })
    })
  }
}

export { generateHeadingId as default }
