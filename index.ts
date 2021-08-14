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

  /** 将指定的state同步到url */
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

  /** 同步query到state */
  useEffect(() => {
    const query = parse(
      location.search,
      parseOptionsRef.current
    ) as Partial<Query>;

    setState((pre) => toState(pre, query));
  }, [location.search, parseOptionsRef, toState]);

  /**
   * 修改state
   *
   * 这里不会写入state而是直接写入query，意在简化数据流向；并减少一次无谓的re-render
   */
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

        // return 一样的，不更新
        return pre;
      });
    },
    [syncNewStateToURL]
  );

  return [state, updateState];
}

export { ParsedQuery };

export * from "./type";
export * from "./util";
