import type { ParseOptions, StringifyOptions } from "query-string";
import type { SetStateAction } from "react";

/** 转换state到query，主要用于处理一些特殊结构或者隐藏参数，如Date对象转换为时间戳 */
export interface mapToState<Query, State> {
  (query: Partial<Query>, prevState: State): State;
}
/** 转换query到state，主要用于转换类型，如时间戳转换为Date对象; 或者作参数校验/补全 */
export interface mapToQuery<Query, State> {
  (state: State, prevQuery: Partial<Query>): Query;
}

/** 更新query到URL的方法 */
export enum LocationSyncMethod {
  PUSH = "PUSH",
  REPLACE = "REPLACE",
}

export interface Config<Query, State> {
  /** 映射query为state的转换函数；默认为原样输出，在反序列化query为state时会调用 */
  mapToState?: mapToState<Query, State>;
  /** 映射state为query的转换函数；默认为原样输出，在序列化state为query时会调用 */
  mapToQuery?: mapToQuery<Query, State>;
  /** 反序列化选项 */
  parseOptions?: ParseOptions;
  /** 序列化选项 */
  stringifyOptions?: StringifyOptions;
  /** 同步到url时使用的方法，默认为 REPLACE */
  syncMethod?: LocationSyncMethod;
}

export interface DispatchQuery<State> {
  (
    /** state */
    value: SetStateAction<State>,
    /** 更新本次state到url时使用的方法，不传则使用默认值 */
    syncMethod?: LocationSyncMethod
  ): void;
}

export type UseQueryReturn<State> = [State, DispatchQuery<State>];
