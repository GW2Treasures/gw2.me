// type Params = Record<string, string | string[] | undefined>;

export type SearchParams = {
  [key: string]: string | string[] | undefined
};

// export interface PageProps<P extends Params = {}> {
//   params: Promise<P>,
//   searchParams: Promise<SearchParams>,
// }

// export interface LayoutProps<P extends Params = {}> {
//   params: Promise<P>,
//   children: ReactNode,
// }

// export interface RouteProps<P extends Params = {}> {
//   params: Promise<P>
// }

// export type RouteHandler<P extends Params = {}> = (request: NextRequest, context: RouteProps<P>) => Promise<Response>;

export function nextSearchParamsToURLSearchParams(searchParams: SearchParams): URLSearchParams {
  const params = new URLSearchParams();

  for(const param in searchParams) {
    if(Array.isArray(searchParams[param])) {
      for(const value of searchParams[param]) {
        params.append(param, value);
      }
    } else if(searchParams[param]) {
      params.append(param, searchParams[param]);
    }
  }

  return params;
}
