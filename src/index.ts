import type { ParsedQuery } from "query-string";
import { parse, stringify } from "query-string";
import {
  useCallback,
  useEffect,
  Dispatch,
  SetStateAction,
  useRef,
  useState,
} from "react";
import { useLocation, useHistory } from "react-router-dom";
import type { mapToState, mapToQuery, Config, UseQueryReturn } from "./type";
import {
  useSyncRef,
  useStaticFunc,
  defaultParseOptions,
  defaultStringifyOptions,
} from "./util";

/** 默认映射函数，保证返回的是可取值的避免取值报错 */
const defaultMapFunc = (i: any) => i ?? {};

/** 管理url上的search参数 */
export function useQuery<
  Query extends ParsedQuery<string | number | boolean>,
  State extends { [key: string]: unknown } = Query
>(
  /** 处理url上的query参数为完整的State，比如合并本地的form等 */
  mapToState: mapToState<Query, State> = defaultMapFunc,
  /** 处理url上的query参数为完整的State，比如合并本地的form等 */
  mapToQuery: mapToQuery<Query, State> = defaultMapFunc,
  /** 序列化相关配置 */
  config?: Config
): UseQueryReturn<State> {
  const {
    syncMethod = "REPLACE",
    parseOptions = defaultParseOptions,
    stringifyOptions = defaultStringifyOptions,
  } = config ?? {};
  const history = useHistory();
  const location = useLocation();

  /** 标记此次search是我们内部触发的，内部触发的不需要再次从search解析同步回state */
  const changeByUsRef = useRef(false);
  /** 静态化的mapToState */
  const toState = useStaticFunc(mapToState);
  /** 静态化的mapToQuery */
  const toQuery = useStaticFunc(mapToQuery);

  const parseOptionsRef = useSyncRef(parseOptions);
  const stringifyOptionsRef = useSyncRef(stringifyOptions);

  const [state, setState] = useState<State>(() =>
    toState(
      undefined,
      parse(location.search, parseOptionsRef.current) as Partial<Query>
    )
  );
  /** 当前query的ref */
  const queryRef = useRef<Partial<Query>>();

  /** 使用指定 syncMethod 将新的 state 同步到url并更新 queryRef */
  const syncNewStateToURL = useCallback(
    (nextState: State) => {
      const nextQuery = toQuery(queryRef.current, nextState);
      const nextQueryString = stringify(nextQuery, stringifyOptionsRef.current);
      const nextLocation = {
        pathname: location.pathname,
        state: location.state,
        hash: location.hash,
        search: nextQueryString,
      };

      switch (syncMethod) {
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

      queryRef.current = nextQuery;
    },
    [
      history,
      location.hash,
      location.pathname,
      location.state,
      stringifyOptionsRef,
      syncMethod,
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

    setState((pre) => toState(pre, query));
  }, [location.search, parseOptionsRef, toState]);

  /** 修改state */
  const updateState: Dispatch<SetStateAction<State>> = useCallback(
    (action) => {
      setState((pre) => {
        let nextState = pre;
        if (typeof action === "function") {
          nextState = action(pre);
        } else {
          nextState = action;
        }

        // 把更新操作重定向到url上
        syncNewStateToURL(nextState);

        changeByUsRef.current = true;

        return nextState;
      });
    },
    [syncNewStateToURL]
  );

  return [state, updateState];
}

export { ParsedQuery };

export * from "./type";
export * from "./util";
