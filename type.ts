import type { ParseOptions, StringifyOptions } from "query-string";
import type { Dispatch, SetStateAction } from "react";

/** 合并query与业务的外部参数 */
export interface MergeFunc<State> {
  (prevQuery: Partial<State> | undefined, query: Partial<State>): State;
}

export interface Config {
  parseOptions?: ParseOptions;
  stringifyOptions?: StringifyOptions;
  syncMethod?: "PUSH" | "REPLACE";
}

export type UseQueryReturn<State> = [State, Dispatch<SetStateAction<State>>];
