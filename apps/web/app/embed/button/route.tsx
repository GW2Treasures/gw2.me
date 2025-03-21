import { getUrlFromRequest } from '@/lib/url';
import { Gw2MeClient, Scope } from '@gw2me/client';
import { NextResponse, type NextRequest } from 'next/server';
import { ReactNode } from 'react';

export async function GET(request: NextRequest) {
  const currentUrl = getUrlFromRequest(request);
  const clientId = request.nextUrl.searchParams.get('client_id');
  const redirectUri = request.nextUrl.searchParams.get('redirect_uri');
  const scopes = request.nextUrl.searchParams.get('scopes');
  const code_challenge = request.nextUrl.searchParams.get('code_challenge');
  const code_challenge_method = request.nextUrl.searchParams.get('code_challenge_method');
  const state = request.nextUrl.searchParams.get('state');

  if(!clientId || !redirectUri || !scopes) {
    return new NextResponse(null, { status: 400 });
  }

  const fedCmConfigUrl = new URL('/fed-cm/config.json', currentUrl);

  const fedCmConfig = {
    configURL: fedCmConfigUrl.toString(),
    clientId,
  };

  const authorizationUrl = new URL(new Gw2MeClient({ client_id: clientId }, { url: new URL('/', currentUrl).toString() }).getAuthorizationUrl({
    redirect_uri: redirectUri,
    scopes: scopes.split(' ') as Scope[],
    state: state ?? undefined,
  }));

  const fedCmRedirectUrl = new URL(redirectUri);
  fedCmRedirectUrl.searchParams.set('iss', currentUrl.origin);
  if(state) {
    fedCmRedirectUrl.searchParams.set('state', state);
  }

  const html = await renderToHTML(
    <html lang="en">
      <head>
        <meta charSet="utf-8"/>
        <meta name="viewport" content="width=device-width, initial-scale=1"/>
        <meta name="color-scheme" content="light dark"/>
        <meta name="robots" content="noindex"/>
        <style type="text/css">
          {css`
            html, body {
              background: none transparent;
              margin: 0;
              padding: 0;
              overflow: hidden;
            }
            #b {
              position: absolute;
              top: 0; bottom: 0;
              left: 0; right: 0;
              background-color: #b7000d;
              border: none;
              padding: 0 12px;
              margin: 0;
              border-radius: 2px;
              font-family: -apple-system, BlinkMacSystemFont, avenir next, avenir, segoe ui, helvetica neue, Cantarell, Ubuntu, roboto, noto, helvetica, arial, sans-serif;
              font-size: 16px;
              font-weight: 500;
              display: flex;
              gap: 12px;
              align-items: center;
              justify-content: center;
              cursor: pointer;
              outline: none;
            }
            #b:hover {
              background-color:hsl(356, 100.00%, 40%);
            }
            #b:focus-visible {
              text-decoration: 2px underline;
              text-underline-offset: 2px;
            }
            #t {
              white-space: nowrap;
              overflow: hidden;
              text-overflow: ellipsis;
            }
          `}
        </style>
      </head>
      <body>
        <form id="f" method="GET" action={new URL(authorizationUrl.pathname, authorizationUrl).toString()} target="_top">
          {Array.from(authorizationUrl.searchParams.entries()).map(([key, value]) => <input key={key} type="hidden" name={key} value={value}/>)}
          <button id="b" type="submit">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 16 16" style={{ flexShrink: 0 }}>
              <path stroke="#fff" strokeLinecap="round" d="M4.5 6.5V4a3.5 3.5 0 0 1 6.663-1.5"/>
              <path fill="#fff" fillRule="evenodd" d="M4.5 6a.5.5 0 0 0-.416.223l-2 3a.5.5 0 0 0 .062.63l5.5 5.5a.5.5 0 0 0 .708 0l5.5-5.5a.5.5 0 0 0 .062-.63l-2-3A.5.5 0 0 0 11.5 6h-7ZM8 11a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" clipRule="evenodd"/>
            </svg>
            <span id="t">Sign in with gw2.me</span>
          </button>
        </form>
        <script>
          {`${minifiedJs};run(${JSON.stringify(fedCmConfig)},${JSON.stringify(scopes)},${JSON.stringify(code_challenge)},${JSON.stringify(code_challenge_method)},${JSON.stringify(fedCmRedirectUrl)})`}
        </script>
      </body>
    </html>
  );

  return new Response(html, {
    headers: {
      'content-type': 'text/html; charset=utf-8',
    },
  });
}

// TODO: replace with `react-markup` package once that becomes available (see https://github.com/reactjs/react.dev/pull/7107)
async function renderToHTML(element: ReactNode) {
  const { renderToStaticMarkup } = await import('react-dom/server');
  return renderToStaticMarkup(element);
}

// naively minify css
// (taken from https://github.com/vercel/next.js/blob/fc03ca7dbf588a72753e37e81d6065bb6e97b8c5/packages/next/src/client/components/react-dev-overlay/utils/css.ts)
export function css(
  strings: TemplateStringsArray,
  ...keys: readonly string[]
): string {
  const lastIndex = strings.length - 1;
  const str =
    // Convert template literal into a single line string
    strings.slice(0, lastIndex).reduce((p, s, i) => p + s + keys[i], '') +
    strings[lastIndex];

  return (
    str
      // Remove comments
      .replace(/\/\*[\s\S]*?\*\//g, '')
      // Remove whitespace, tabs, and newlines
      .replace(/\s+/g, ' ')
      // Remove spaces before and after semicolons, and spaces after commas
      .replace(/\s*([:;,{}])\s*/g, '$1')
      // Remove extra semicolons
      .replace(/;+}/g, '}')
      // Trim leading and trailing whitespaces
      .trim()
  );
}

/** This is manully minified code of [run.ts](./run.ts) */
const minifiedJs = 'function run(e,t,n,i,o){if(!("IdentityCredential"in window))return;let r=!1;try{navigator.credentials.get({identity:Object.defineProperty({},"mode",{get(){r=!0}})}).catch(()=>{})}catch(e){}let d=document.getElementById("f");function a(o){return navigator.credentials.get({mediation:"optional",identity:{providers:[{...e,nonce:`${i}:${n}`,fields:[t.includes("indentify")&&"name",t.includes("email")&&"email"].filter(Boolean),params:{scope:t,code_challenge:n,code_challenge_method:i}}],mode:o}})}IdentityProvider.getUserInfo(e).then(e=>{e&&e.length>0&&(document.getElementById("t").innerText="Sign in as "+e[0].name)}),d.addEventListener("submit",e=>{if(r){e.preventDefault();try{a("active").then(e=>{e&&"token"in e&&open(o.toString()+"&code="+e.token,"_top")})}catch(e){d.submit()}}}),a("passive").then(e=>{e&&"token"in e&&open(o.toString()+"&code="+e.token,"_top")})}';
