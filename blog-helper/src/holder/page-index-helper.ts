import { BaseDatasourceMetadata, DatasourceItem } from "../type";
import {createArrayHashFunctionAdapter, genericArrayHashFunction, genericValueHashFunction} from "./util";

type Keys = string | number | symbol
const createPageIndexHelper =
  <T extends BaseDatasourceMetadata> (
    items: DatasourceItem<T>[],
    indexHolder: Record<Keys, Record<Keys, DatasourceItem<T>[]>>,
    hashFunctions: Record<Keys, ValueCastFunction<unknown>>
  ): PageHelperWithIndex<T> => {

  // id 索引
  const idIndex = new Map<string, DatasourceItem<T>>()
  for (let item of items) {
    idIndex.set(item.id, item)
  }

  return {
    getById(id): DatasourceItem<T> | undefined {
      return idIndex.get(id);
    },
    listAll() {
      return items
    },
    getByIndex(index, key): DatasourceItem<T>[] {
      const hashFunc = hashFunctions[index]
      if (!hashFunc) {
        throw new Error(`No index has been build for ${String(index)}`)
      }
      const hashKey = hashFunc(key)
      // @ts-ignore
      return indexHolder[index]?.[hashKey] ?? []
    }
  }
}



export type PageHelperWithIndex<T extends BaseDatasourceMetadata> = {
  getById: (id: DatasourceItem<T>['id']) => DatasourceItem<T> | undefined
  /**
   * 根据索引寻找对应的元素
   * @param index 索引名称
   * @param key 索引值
   * @return {} 找到的元素, 如果没找到，返回空数组
   */
  getByIndex: <Key extends keyof T>(index: keyof T, key: T[Key]) => DatasourceItem<T>[]
  listAll: () => DatasourceItem<T>[]
}

type ValueCastFunction<T> = (val: T) => string

type AddIndexArgs<T extends BaseDatasourceMetadata, Key extends keyof T> =
  string extends T[Key]
  ? [key: Key]
  : boolean extends T[Key]
    ? [key: Key]
    : number extends T[Key]
      ? [key: Key]
      : [key: Key, valueToString: ValueCastFunction<T[Key]>]

type AddIndexFunction<T extends BaseDatasourceMetadata> = <Key extends keyof T> (...args: AddIndexArgs<T, Key>) => PageWithIndexBuilder<T>

const ERR_MSG = "Only array type can be used on this method!"

type AddIndexForArrayArgs<T extends BaseDatasourceMetadata, Key extends keyof T, Element> =
   Required<T>[Key] extends ArrayLike<infer Element>
    ? string extends Element
      ? [key: Key, valueToString?: ValueCastFunction<Element>]
      : number extends Element
        ? [key: Key, valueToString?: ValueCastFunction<Element>]
        : boolean extends Element
          ? [key: Key, valueToString?: ValueCastFunction<Element>]
          : [key: Key, valueToString: ValueCastFunction<Element>]
    : [typeof ERR_MSG]


type AddIndexForArrayFunction<T extends BaseDatasourceMetadata> = <Key extends keyof T, Element> (
  ...args: AddIndexForArrayArgs<T, Key, Element>
) => PageWithIndexBuilder<T>

type PageWithIndexBuilder<T extends BaseDatasourceMetadata> = {
  addIndex: AddIndexFunction<T>
  addIndexForArray: AddIndexForArrayFunction<T>
  build: () => PageHelperWithIndex<T>
}

type ValidKeys = string | number | symbol

export const createPageWithIndexBuilder =
  <T extends BaseDatasourceMetadata> (items: DatasourceItem<T>[]): PageWithIndexBuilder<T> => {

  const indexHolder: Record<ValidKeys, Record<string, DatasourceItem<T>[]>> = {}
  const hashFunctions: Record<Keys, ValueCastFunction<unknown>> = {}

  function addIndex0( _key: unknown, castFunc?: ValueCastFunction<any>, arrayFlag: boolean = false) {
    // 声明一时爽，'代码'火葬场...
    if (_key === ERR_MSG) {
      throw Error('Only array type can be applied to this method.')
    }
    const key = _key as keyof T
    let target: Record<string, DatasourceItem<T>[]> | undefined = indexHolder[key]
    if (!target) {
      target = {}
      indexHolder[key] = target
    }
    let hashFunction: ValueCastFunction<unknown>

    if (arrayFlag) {
      // @ts-ignore
      hashFunction = castFunc ? createArrayHashFunctionAdapter(castFunc) : genericArrayHashFunction
    } else {
      // @ts-ignore
      hashFunction = castFunc ?? genericValueHashFunction
    }
    hashFunctions[key] = hashFunction

    for (let item of items) {
      const metadataValue = item.metadata[key]
      if (metadataValue === undefined) {
        continue
      }
      let hashKey: string = hashFunction(metadataValue)
      let holder = target[hashKey]
      if (!holder) {
        holder = []
        target[hashKey] = holder
      }
      holder.push(item)
    }
  }

  return {
    addIndex (key, castFunc?): PageWithIndexBuilder<T> {
      addIndex0(key, castFunc)
      return this
    },
    addIndexForArray<Key extends keyof T, Element>(key: Key | string, valueToString?: ValueCastFunction<Element>): PageWithIndexBuilder<T> {
      addIndex0(key, valueToString, true)
      return this
    },
    build() {
      return createPageIndexHelper(items, indexHolder, hashFunctions)
    }
  }

}




