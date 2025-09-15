export type SearchParams = {
  [key: string]: string | string[] | undefined,
};

/** Convert Next.js searchParams to URLSearchParams */
export function searchParamsToURLSearchParams(params: SearchParams): URLSearchParams {
  const entries: string[][] = [];

  for(const [key, value] of Object.entries(params)) {
    if(value === undefined) {
      continue;
    }

    if(Array.isArray(value)) {
      for(const v of value) {
        entries.push([key, v]);
      }
    } else {
      entries.push([key, value]);
    }
  }

  return new URLSearchParams(entries);
}
