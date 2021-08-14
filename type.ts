import type { ParseOptions, StringifyOptions } from "query-string";

/** 合并query与业务的外部参数 */
export interface MergeFunc<State> {
  (
    prevQuery: Partial<State> | undefined,
    query: Partial<State>,
    prevState: State | undefined
  ): State;
}

export interface SetState<State> {
  (reducer: (prevState: State) => State): void;
}

export interface Config {
  parseOptions?: ParseOptions;
  stringifyOptions?: StringifyOptions;
  syncAction?: "PUSH" | "REPLACE";
}

export type UseQueryReturn<State> = [State, SetState<State>];
