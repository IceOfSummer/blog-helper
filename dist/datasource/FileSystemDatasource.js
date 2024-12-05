import path from 'node:path';
import { globSync } from 'glob';
import fs from 'node:fs';

class FileSystemDatasource {
    config;
    idToFileIndex = {};
    constructor(conf) {
        this.config = {
            pageSearchPattern: './**/*.{md,mdx}',
            pageCreatedCallback: [],
            disableContentParse: false,
            // @ts-ignore. anyone can help me here?
            userDataInitialValue: {},
            ...conf,
        };
    }
    saveToIndex(items) {
        items.forEach(item => {
            this.idToFileIndex[item.id] = item;
        });
    }
    /**
     * 为所有页面构造索引
     */
    init() {
        const pageDirectories = Array.isArray(this.config.pageDirectory) ? this.config.pageDirectory : [this.config.pageDirectory];
        for (let pageDirectory of pageDirectories) {
            const pages = this.listPages(pageDirectory);
            this.saveToIndex(pages);
        }
    }
    listPages(rootPath) {
        const searchGlob = path.join(rootPath, this.config.pageSearchPattern).replaceAll('\\', '/');
        return globSync(searchGlob, { cwd: process.env.BLOG_PATH }).map(v => (this.parseFile(rootPath, v)));
    }
    parseFile(root, relative) {
        let visitPath = relative.split(path.sep);
        const ext = path.extname(path.sep);
        if (ext) {
            const t = visitPath[visitPath.length - 1];
            visitPath[visitPath.length - 1] = t.substring(0, t.length - ext.length);
        }
        const page = {
            id: relative,
            type: ext ? ext.substring(1) : ext,
            visitPath: visitPath,
            filepath: path.join(root, relative),
            metadata: this.config.userDataInitialValue
        };
        for (let cb of this.config.pageCreatedCallback) {
            cb(page);
        }
        return page;
    }
    getPage(id) {
        const page = this.idToFileIndex[id];
        if (!page) {
            return Promise.resolve(undefined);
        }
        const filepath = path.resolve(page.filepath);
        if (!fs.existsSync(filepath)) {
            throw new Error('Could not find page with item ' + filepath);
        }
        return Promise.resolve(fs.readFileSync(filepath, { encoding: 'utf-8' }));
    }
    getAllPages() {
        return Promise.resolve(Object.values(this.idToFileIndex));
    }
}

export { FileSystemDatasource };
