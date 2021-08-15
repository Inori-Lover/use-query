import { useCallback, useRef } from "react";
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

export const defaultParseOptions: ParseOptions = {
  /** 保证长度为1的数组能保留 */
  arrayFormat: "index",
  /** 支持更多数据结构 */
  parseBooleans: true,
  /** 防止数字失真 */
  parseNumbers: false,
};

export const defaultStringifyOptions: StringifyOptions = {
  /** 保证长度为1的数组能保留 */
  arrayFormat: "index",
};
