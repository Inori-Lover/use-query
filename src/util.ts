import { SetStateAction, useCallback, useRef } from "react";
import type { ParseOptions, StringifyOptions } from "query-string";

/** 将某个值同步设置到一个ref中 */
export function useSyncRef<Value>(val: Value) {
  const ref = useRef(val);
  ref.current = val;
  return ref;
}

/** 将某个值同步设置到一个ref中 */
export function useStaticFunc<Func extends (...args: any[]) => any>(
  func: Func
) {
  const ref = useRef(func);
  ref.current = func;

  return useCallback((...args: Parameters<Func>) => {
    const { current } = ref;
    return current(...args);
  }, []);
}

let defaultParseOptions: ParseOptions = {
  /** 保证长度为1的数组能保留 */
  arrayFormat: "index",
  /** 支持更多数据结构 */
  parseBooleans: true,
  /** 防止数字失真 */
  parseNumbers: false,
};

/** 获取 use-query 默认反序列化配置 */
export const getDefaultParseOptions = () => defaultParseOptions;

/** 更新 use-query 默认反序列化配置 */
export const setDefaultParseOptions = (
  next: SetStateAction<ParseOptions>
): void => {
  if (typeof next === "function") {
    defaultParseOptions = next(defaultParseOptions);
  } else {
    defaultParseOptions = next;
  }
};

let defaultStringifyOptions: StringifyOptions = {
  /** 保证长度为1的数组能保留 */
  arrayFormat: "index",
};

/** 获取 use-query 默认序列化配置 */
export const getDefaultStringifyOptions = () => defaultStringifyOptions;

/** 更新 use-query 默认序列化配置 */
export const setDefaultStringifyOptions = (
  next: SetStateAction<StringifyOptions>
): void => {
  if (typeof next === "function") {
    defaultStringifyOptions = next(defaultStringifyOptions);
  } else {
    defaultStringifyOptions = next;
  }
};
