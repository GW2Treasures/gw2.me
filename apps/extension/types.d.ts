/// <reference types="@gw2treasures/ui/types" />

declare module '*.module.css' {
  const classes: { readonly [key: string]: string };
  export default classes;
}

declare module '*.svg' {
  const asset = { src: string };
  export default asset;
}
