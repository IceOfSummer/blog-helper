import QuickLRU from 'quick-lru'

function isPromise(val) {
  return (val !== null &&
        typeof val === 'object' &&
        typeof val.then === 'function' &&
        typeof val.catch === 'function')
}
const createSingleValueHolder = () => {
  let val
  return {
    get(_) {
      return val
    },
    set(_, value) {
      val = value
    }
  }
}
/**
 * 缓存某个类中方法的返回值.
 */
function cached({ cacheKeyBuilder, maxSize = 1000, onlySingleValue } = {}) {
  return function (_, __, descriptor) {
    const originalMethod = descriptor.value
    if (process.env.NODE_ENV === 'development') {
      // no cache in development.
      return
    }
    let cache
    if (onlySingleValue) {
      cache = createSingleValueHolder()
    }
    else {
      cache = new QuickLRU({
        maxSize,
      })
    }
    descriptor.value = function (...args) {
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
        }).catch((e) => {
          return Promise.reject(e)
        })
      }
      else {
        cache.set(cacheKey, {
          isPromise: false,
          data: result
        })
        return result
      }
    }
  }
}

export { cached }
