import QuickLRU from 'quick-lru'

type CachedValue = {
  isPromise: boolean
  data: unknown
}

function isPromise(val: unknown): val is Promise<unknown> {
  return (
    val !== null &&
    typeof val === 'object' &&
    typeof (val as Promise<unknown>).then === 'function' &&
    typeof (val as Promise<unknown>).catch === 'function'
  )
}

export type CacheConfig = {
  /**
   * 该如何构建缓存的键
   * @param args 方法入参
   */
  cacheKeyBuilder?: (...args: unknown[]) => string
  /**
   * 最大容量
   */
  maxSize?: number
  /**
   * 该方法是否仅会返回一个相同的值. 通常用于加载配置，而配置在构建过程中不会发生改变。
   */
  onlySingleValue?: boolean
}

type CacheHolderLike = {
  get(key: string): CachedValue | undefined
  set(key: string, value: CachedValue): void
}

const createSingleValueHolder = (): CacheHolderLike=> {
  let val: CachedValue | undefined
  return {
    get(_: string): CachedValue | undefined {
      return val
    },
    set(_: string, value: CachedValue) {
      val = value
    }
  }
}

/**
 * 缓存某个类中方法的返回值.
 */
export function cached({ cacheKeyBuilder, maxSize = 1000, onlySingleValue }: CacheConfig = {}) {
  return function(_: unknown, __: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value


    if (process.env.NODE_ENV === 'development') {
      // no cache in development.
      return
    }
    let cache: CacheHolderLike
    if (onlySingleValue) {
      cache = createSingleValueHolder()
    } else {
      cache = new QuickLRU<string, CachedValue>({
        maxSize,
      })
    }

    descriptor.value = function (...args: unknown[]) {
      const cacheKey = cacheKeyBuilder ? cacheKeyBuilder(args) : JSON.stringify(args)
      const cachedValue = cache.get(cacheKey)
      if (cachedValue) {
        return cachedValue.isPromise ? Promise.resolve(cachedValue.data) : cachedValue.data
      }

      const result = originalMethod.apply(this, args)
      if (isPromise(result)) {
        return result.then(r => {
          cache.set(cacheKey, {
            isPromise: true,
            data: r
          })
          return r
        }).catch((e: unknown) => {
          return Promise.reject(e)
        })
      } else {
        cache.set(cacheKey, {
          isPromise: false,
          data: result
        })
        return result
      }

    }
  }
}
