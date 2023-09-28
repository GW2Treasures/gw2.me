/// <reference types="@gw2treasures/ui/types" />

// TODO: this should not be necessary, because this is already defined in the above reference of @gw2treasures/ui/types
declare module '*.svg?svgr' {
  import React from 'react';
  const SVG: React.VFC<React.SVGProps<SVGSVGElement>>;
  export default SVG;
}

declare module 'react-dom' {
  export function experimental_useFormState<State, Payload>(
    action: (state: State, payload: Payload) => State | Promise<State>,
    initialState: State,
    permalink?: string,
  ): [state: State, dispatch: (payload: Payload) => void]
}
