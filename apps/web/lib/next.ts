/* eslint-disable @typescript-eslint/no-empty-object-type */
import type { ReactNode } from 'react';
import type { NextRequest } from 'next/server';

type Params = Record<string, string | string[] | undefined>;

export type SearchParams = {
  [key: string]: string | string[] | undefined
};

export interface PageProps<P extends Params = {}> {
  params: Promise<P>,
  searchParams: Promise<SearchParams>,
}

export interface LayoutProps<P extends Params = {}> {
  params: Promise<P>,
  children: ReactNode,
}

export interface RouteProps<P extends Params = {}> {
  params: Promise<P>
}

export type RouteHandler<P extends Params = {}> = (request: NextRequest, context: RouteProps<P>) => Promise<Response>;

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
