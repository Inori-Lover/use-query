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
import type { MergeFunc, Config, UseQueryReturn } from "./type";
import {
  useSyncRef,
  useStaticFunc,
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
  const { syncMethod = "REPLACE" } = config;
  const history = useHistory();
  const location = useLocation();

  /** 静态化的mergeFunc */
  const merge = useStaticFunc(mergeFunc);

  const parseOptionsRef = useSyncRef(
    config.parseOptions ?? defaultParseOptions
  );
  const stringifyOptionsRef = useSyncRef(
    config.stringifyOptions ?? defaultStringifyOptions
  );

  const [state, setState] = useState<State>(() =>
    merge(
      defaultQuery,
      parse(location.search, parseOptionsRef.current) as Partial<State>
    )
  );
  /** 当前query的ref */
  const queryRef = useRef<Partial<State>>(defaultQuery);

  /** 将指定的state同步到url */
  const syncNewStateToURL = useCallback(
    (nextState: State) => {
      const nextQueryString = stringify(nextState, stringifyOptionsRef.current);
      const nextLocation = {
        pathname: location.pathname,
        state: location.state,
        hash: location.hash,
        search: nextQueryString,
        key: undefined,
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

      queryRef.current = nextState;
    },
    [
      history,
      location.hash,
      location.pathname,
      location.state,
      stringifyOptionsRef,
      syncMethod,
    ]
  );

  /** 修改state */
  const update: Dispatch<SetStateAction<State>> = useCallback(
    (action) => {
      setState((pre) => {
        let nextState = pre;
        if (typeof action === "function") {
          nextState = action(pre);
        } else {
          nextState = action;
        }

        syncNewStateToURL(nextState);

        return nextState;
      });
    },
    [syncNewStateToURL]
  );

  /** 同步search到state */
  useEffect(() => {
    const query = parse(
      location.search,
      parseOptionsRef.current
    ) as Partial<State>;

    update(merge(queryRef.current, query));
  }, [location.search, merge, parseOptionsRef, update]);

  return [state, update];
}

export { ParsedQuery };

export * from "./type";
export * from "./util";
