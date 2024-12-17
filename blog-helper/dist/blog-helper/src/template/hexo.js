import { __decorate } from '../../../node_modules/.pnpm/@rollup_plugin-typescript@12.1.1_rollup@4.28.1_tslib@2.8.1_typescript@5.7.2/node_modules/tslib/tslib.es6.js';
import { splitMarkdownContent } from '../uti/spliter.js';
import fs from 'node:fs';
import path from 'node:path';
import yaml from 'yaml';
import { createPageWithIndexBuilder } from '../holder/page-index-helper.js';
import { searchPages } from '../uti/search.js';
import { cached } from '../uti/cached.js';
import mime from 'mime';

/**
 * - PageMetadata: markdown 顶部使用三个 `-` 包裹起来的 yaml 数据
 * - Metadata: 为防止文章太多而爆内存，从 `PageMetadata` 提取部分字段用于构建索引
 */
class HexoDatasource {
    config;
    pageWithIndex;
    staticResourceIndex;
    constructor(config) {
        this.config = {
            // TODO
            configFileName: '_config.yml',
            ...config,
        };
        const pages = searchPages({
            pageDirectory: path.join(this.config.rootDirectory, this.config.pageDirectory),
            nestedHomePageDirectory: path.join(this.config.rootDirectory, config.homePageDirectory)
        });
        this.parseAllPages(pages);
        const resources = searchPages({
            pageDirectory: path.join(this.config.rootDirectory, this.config.staticResourceDirectory),
            searchPattern: './**/*'
        });
        for (let resource of resources) {
            resource.metadata.contentType = mime.getType(resource.filepath) ?? '';
        }
        this.staticResourceIndex = createPageWithIndexBuilder(resources)
            .addIndexForArray('visitPath')
            .build();
        this.pageWithIndex = createPageWithIndexBuilder(pages)
            .addIndex('isHomePage')
            // no need for this
            // .addIndexForArray('tags')
            // .addIndexForArray('categories')
            .addIndexForArray('visitPath')
            .build();
    }
    getPageByWebVisitPath(url) {
        const holder = this.pageWithIndex.getByIndex('visitPath', url);
        return holder.length ? holder[0] : undefined;
    }
    /**
     * 解析所有页面，并添加元数据到 {@link DatasourceItem} 上
     * @private
     */
    parseAllPages(items) {
        function asArray(item) {
            if (Array.isArray(item)) {
                return item;
            }
            if (typeof item === 'string') {
                return [item];
            }
            return [];
        }
        for (let item of items) {
            const markdown = this.readPageContent(item.filepath);
            item.metadata.tags = asArray(markdown.metadata.tags);
            item.metadata.categories = asArray(markdown.metadata.categories);
        }
    }
    readPageContent(path) {
        const content = fs.readFileSync(path, 'utf8');
        return splitMarkdownContent(content, path);
    }
    getConfig() {
        let configFile;
        if (!fs.existsSync((configFile = path.resolve(this.config.rootDirectory, '_config.yml')))
            && !fs.existsSync((configFile = path.resolve(this.config.rootDirectory, '_config.yaml')))) {
            throw new Error('Could not find config file from both _config.yml and _config.yaml');
        }
        const parsed = yaml.parse(fs.readFileSync(configFile, { encoding: 'utf8' }));
        return Promise.resolve(parsed);
    }
    pageHomePosts(page = 0, size = 8) {
        const pages = this.pageWithIndex.getByIndex('isHomePage', true);
        const start = page * size;
        return Promise.resolve(pages.slice(start, start + size));
    }
    homePostSize() {
        return Promise.resolve(this.pageWithIndex.getByIndex('isHomePage', true).length);
    }
    getAllPagesUrl() {
        return Promise.resolve(this.pageWithIndex.listAll());
    }
    async getAllStaticResource() {
        return this.staticResourceIndex.listAll();
    }
    readContent(url) {
        const items = this.pageWithIndex.getByIndex('visitPath', url);
        if (items.length === 0) {
            return Promise.resolve(undefined);
        }
        const target = items[0];
        return Promise.resolve(this.readPageContent(target.filepath));
    }
    getStaticResourceByWebUrl(url) {
        const items = this.staticResourceIndex.getByIndex('visitPath', url);
        if (items.length === 0) {
            return Promise.resolve(undefined);
        }
        const target = items[0];
        return Promise.resolve({
            base64: fs.readFileSync(target.filepath, { encoding: 'base64' }),
            contentType: target.metadata.contentType
        });
    }
    async getTagMapping() {
        const pages = this.pageWithIndex.listAll();
        const r = new Map();
        for (const page of pages) {
            for (const category of page.metadata.tags) {
                let o = r.get(category);
                if (!o) {
                    o = [];
                    r.set(category, o);
                }
                o.push(page);
            }
        }
        return r;
    }
    async getCategoriesMapping() {
        const pages = this.pageWithIndex.listAll();
        const r = new Map();
        for (const page of pages) {
            for (const category of page.metadata.categories) {
                let o = r.get(category);
                if (!o) {
                    o = [];
                    r.set(category, o);
                }
                o.push(page);
            }
        }
        return r;
    }
}
__decorate([
    cached()
], HexoDatasource.prototype, "readPageContent", null);
__decorate([
    cached({ onlySingleValue: true })
], HexoDatasource.prototype, "getConfig", null);
__decorate([
    cached({ onlySingleValue: true })
], HexoDatasource.prototype, "getTagMapping", null);
__decorate([
    cached({ onlySingleValue: true })
], HexoDatasource.prototype, "getCategoriesMapping", null);

export { HexoDatasource };
