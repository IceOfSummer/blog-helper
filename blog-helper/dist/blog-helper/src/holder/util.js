/**
 * 用于 number、string 和 boolean 的 hash 方法
 */
const genericValueHashFunction = val => val.toString()
const genericArrayHashFunction = val => val.join('.')
const createArrayHashFunctionAdapter = (elementHashFunc) => {
  return val => {
    const v = []
    for (let t of val) {
      v.push(elementHashFunc(t))
    }
    return v.join('.')
  }
}

export { createArrayHashFunctionAdapter, genericArrayHashFunction, genericValueHashFunction }
