export type SearchParams = {
  [key: string]: string | string[] | undefined,
};

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
