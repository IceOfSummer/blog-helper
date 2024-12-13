import { visit } from 'unist-util-visit';

/**
 * 调整标题等级。若 markdown 标题包含 h1，则将所有标题等级提升，确保没有 h1 标签。
 */
function adjustToc() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return function (tree) {
        let minDepth = 999;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        visit(tree, 'heading', (node) => {
            minDepth = Math.min(minDepth, node.depth);
        });
        if (minDepth !== 1) {
            return;
        }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        visit(tree, 'heading', (node) => {
            node.depth++;
        });
    };
}

export { adjustToc as default };
