import path from 'node:path';
import { globSync } from 'glob';

const searchPages = (config) => {
    let nested;
    if (config.nestedHomePageDirectory) {
        const relative = path.relative(config.pageDirectory, config.nestedHomePageDirectory);
        if (relative.startsWith('..')) {
            throw Error('nestedHomePageDirectory must be nested in pageDirectory!');
        }
        nested = path.normalize(relative).split(path.sep);
    }
    // const nested = config.nestedHomePageDirectory ? config.nestedHomePageDirectory.split('/') : undefined
    const root = path.resolve(config.pageDirectory);
    const items = globSync(config.searchPattern ?? './**/*.{md,mdx}', { cwd: root });
    return items.map(relative => {
        const visitPath = relative.split(path.sep);
        const ext = path.extname(relative);
        if (ext) {
            const t = visitPath[visitPath.length - 1];
            visitPath[visitPath.length - 1] = t.substring(0, t.length - ext.length);
        }
        const base = {
            filepath: path.join(root, relative),
            type: ext,
            id: relative,
            // @ts-ignore
            metadata: {
                isHomePage: false,
                visitPath,
            }
        };
        if (nested && visitPath.length > nested.length) {
            let match = true;
            for (let i = 0; i < nested.length; i++) {
                if (visitPath[i] != nested[i]) {
                    match = false;
                    break;
                }
            }
            if (match) {
                base.metadata.visitPath = base.metadata.visitPath.slice(nested.length);
                base.metadata.isHomePage = true;
            }
        }
        return base;
    });
};

export { searchPages };
