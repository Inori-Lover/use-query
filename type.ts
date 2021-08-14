import type { ParseOptions, StringifyOptions } from "query-string";
import type { Dispatch, SetStateAction } from "react";

/** 转换state到query，主要用于处理一些特殊结构或者隐藏参数，如Date对象转换为时间戳 */
export interface mapToState<Query, State> {
  (prevState: State | undefined, query: Partial<Query>): State;
}
/** 转换query到state，主要用于转换类型，如时间戳转换为Date对象; 或者作参数校验/补全 */
export interface mapToQuery<Query, State> {
  (prevQuery: Partial<Query> | undefined, state: State): Query;
}

export interface Config {
  parseOptions?: ParseOptions;
  stringifyOptions?: StringifyOptions;
  syncMethod?: "PUSH" | "REPLACE";
}

export type UseQueryReturn<State> = [State, Dispatch<SetStateAction<State>>];
