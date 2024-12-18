export type ValueCastFunction<T> = (val: T) => string


export type ValueHashFunction<T> = {
  key: string
  castFunc: ValueCastFunction<T>
}

/**
 * 用于 number、string 和 boolean 的 hash 方法
 */
export const genericValueHashFunction: ValueCastFunction<string|number|boolean> = val => val.toString()

export const genericArrayHashFunction: ValueCastFunction<string[]|number[]|boolean[]> = val => val.join('.')

export const createArrayHashFunctionAdapter =
  <T>(elementHashFunc: ValueCastFunction<T>): ValueCastFunction<T[]> => {
    return val => {
      const v: string[] = []
      for (const t of val) {
        v.push(elementHashFunc(t))
      }
      return v.join('.')
    }
  }
