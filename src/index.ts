import type { ParsedQuery } from "query-string";
import { parse, stringify } from "query-string";
import { useCallback, useEffect, useRef, useState } from "react";
import { useLocation, useHistory } from "react-router-dom";
import {
  mapToState,
  mapToQuery,
  Config,
  UseQueryReturn,
  DispatchQuery,
  LocationSyncMethod,
} from "./type";
import {
  useSyncRef,
  useStaticFunc,
  getDefaultParseOptions,
  getDefaultStringifyOptions,
} from "./util";

/** 默认映射函数，保证返回的是可取值的避免取值报错 */
const defaultMapFunc = (i: any) => i ?? {};

/** 管理url上的search参数 */
export function useQuery<
  Query extends ParsedQuery<string | number | boolean>,
  State extends { [key: string]: unknown } = Query
>(
  INIT: State | (() => State),
  config?: Config<Query, State>
): UseQueryReturn<State> {
  const {
    syncMethod = LocationSyncMethod.REPLACE,
    parseOptions = getDefaultParseOptions(),
    stringifyOptions = getDefaultStringifyOptions(),
    mapToState = defaultMapFunc,
    mapToQuery = defaultMapFunc,
  } = config ?? {};
  const history = useHistory();
  const location = useLocation();

  /** 标记此次search是我们内部触发的，内部触发的不需要再次从search解析同步回state */
  const changeByUsRef = useRef(false);
  /** 静态化的mapToState */
  const toState = useStaticFunc<mapToState<Query, State>>(mapToState);
  /** 静态化的mapToQuery */
  const toQuery = useStaticFunc<mapToQuery<Query, State>>(mapToQuery);

  const parseOptionsRef = useSyncRef(parseOptions);
  const stringifyOptionsRef = useSyncRef(stringifyOptions);

  // 通过useState实现初始化参数的传入，减少自造轮子
  const [initState] = useState(INIT);

  const [state, setState] = useState<State>(() =>
    toState(
      parse(location.search, parseOptionsRef.current) as Partial<Query>,
      initState
    )
  );
  /** 当前query的ref */
  const queryRef = useRef<Partial<Query>>({});

  /** 使用指定 syncMethod 将新的 state 同步到url并更新 queryRef */
  const syncNewStateToURL = useCallback(
    (nextState: State, nextSyncMethod: LocationSyncMethod) => {
      const nextQuery = toQuery(nextState, queryRef.current);
      const nextQueryString = stringify(nextQuery, stringifyOptionsRef.current);
      const nextLocation = {
        pathname: location.pathname,
        state: location.state,
        hash: location.hash,
        search: nextQueryString,
      };

      switch (nextSyncMethod) {
        case LocationSyncMethod.PUSH: {
          history.push(nextLocation);
          break;
        }
        case LocationSyncMethod.REPLACE: {
          history.replace(nextLocation);
          break;
        }
        default: {
          break;
        }
      }

      queryRef.current = nextQuery;
    },
    [
      history,
      location.hash,
      location.pathname,
      location.state,
      stringifyOptionsRef,
      toQuery,
    ]
  );

  /** 监听 query 并同步 query 到 state */
  useEffect(() => {
    /** 如果这次改变是我们触发的，那么state和query已经同步，不需要再同步一次 */
    if (changeByUsRef.current) {
      changeByUsRef.current = false;
      return;
    }

    const query = parse(
      location.search,
      parseOptionsRef.current
    ) as Partial<Query>;

    setState((pre) => toState(query, pre));
  }, [location.search, parseOptionsRef, toState]);

  /** 修改state */
  const updateState: DispatchQuery<State> = useCallback(
    (action, nextSyncMethod = syncMethod) => {
      setState((pre) => {
        let nextState = pre;
        if (typeof action === "function") {
          nextState = action(pre);
        } else {
          nextState = action;
        }

        // 把更新操作重定向到url上
        syncNewStateToURL(nextState, nextSyncMethod);

        changeByUsRef.current = true;

        return nextState;
      });
    },
    [syncMethod, syncNewStateToURL]
  );

  return [state, updateState];
}

export { ParsedQuery };

export * from "./type";
export * from "./util";
