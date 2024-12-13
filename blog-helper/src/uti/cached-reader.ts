import QuickLRU from 'quick-lru';
import fs from "node:fs";

type CachedReadConfig<T> = {
  lru: ConstructorParameters<typeof QuickLRU>[0]
  defaultParseCallback: (content: string, path: string) => T
}

class CachedReader<T> {

  private lru:QuickLRU<string, T>

  constructor(private config: CachedReadConfig<T>) {
    this.lru = new QuickLRU<string, T>(config.lru)
  }

  readFile(path: string): T {
    const cached = this.lru.get(path)
    if (cached) {
      return cached
    }
    const file = fs.readFileSync(path, 'utf8')
    const parsed = this.config.defaultParseCallback(file, path)
    this.lru.set(path, parsed)
    return parsed
  }



}