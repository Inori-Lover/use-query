import type { ParsedQuery } from "query-string";
import { parse, stringify } from "query-string";
import { useCallback, useEffect, useMemo, useRef } from "react";
import { useLocation, useHistory } from "react-router-dom";
import type { MergeFunc, SetState, Config, UseQueryReturn } from "./type";
import {
  useSyncRef,
  defaultParseOptions,
  defaultStringifyOptions,
} from "./util";

const defaultQuery = {};
/** 管理url上的search参数 */
export function useQuery<State extends ParsedQuery<string | number | boolean>>(
  /** 处理url上的query参数为完整的State，比如合并本地的form等; 注意memo化 */
  mergeFunc: MergeFunc<State>,
  /** 序列化相关配置 */
  config: Config
): UseQueryReturn<State> {
  const { syncAction = "REPLACE" } = config;
  const history = useHistory();
  const location = useLocation();

  const parseOptionsRef = useSyncRef(
    config.parseOptions ?? defaultParseOptions
  );
  const stringifyOptionsRef = useSyncRef(
    config.stringifyOptions ?? defaultStringifyOptions
  );

  /** 初始state */
  const defaultState = useMemo(
    () =>
      merge(
        defaultQuery,
        parse(location.search, parseOptionsRef.current) as Partial<State>,
        undefined
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  /** 当前state的ref */
  const stateRef = useRef<State>(defaultState);
  /** 当前query的ref */
  const queryRef = useRef<Partial<State>>(defaultQuery);
  /** 静态化的mergeFunc */
  const merge = useSyncRef<MergeFunc<State>>(mergeFunc).current;

  /** 将指定的state同步到url */
  const sync = useCallback(
    (nextState: State) => {
      const nextQueryString = stringify(nextState, stringifyOptionsRef.current);
      const nextLocation = {
        pathname: location.pathname,
        state: location.state,
        hash: location.hash,
        search: nextQueryString,
        key: undefined,
      };

      switch (syncAction) {
        case "PUSH": {
          history.push(nextLocation);
          break;
        }
        case "REPLACE": {
          history.replace(nextLocation);
          break;
        }
        default: {
          break;
        }
      }

      queryRef.current = nextState;
      stateRef.current = nextState;
    },
    [
      history,
      location.hash,
      location.pathname,
      location.state,
      stringifyOptionsRef,
      syncAction,
    ]
  );

  /** 监听search变化并同步到state */
  useEffect(() => {
    // 为了减少理解难度，这里不做优化；不优化的后果就是多调用一次merge而已，多次sync不会导致search多次变化
    // // 如果state和query已经同步，代表本次search变化是内部触发的；跳过
    // if (stateRef.current === queryRef.current) {
    //   return;
    // }

    const query = parse(
      location.search,
      parseOptionsRef.current
    ) as Partial<State>;

    sync(merge(queryRef.current, query, stateRef.current));
  }, [location.search, merge, parseOptionsRef, sync]);

  /** 修改query */
  const setState: SetState<State> = useCallback(
    (reducer: (prevState: State) => State) => {
      const nextState = reducer(stateRef.current);
      sync(nextState);
    },
    [sync]
  );

  return [stateRef.current, setState];
}

export { ParsedQuery };

export * from "./type";
export * from "./util";
