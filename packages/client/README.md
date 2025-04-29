# `@gw2me/client`

This is a client library to interact with the gw2.me API.

## Installation

```
npm i @gw2me/client
```

## API

This section shows basic examples and concepts on how to use the different functions provided by this library. For all parameters, please check the typescript types.

### `Gw2MeClient`

The `Gw2MeClient` class is the main entry point into using this library. You can pass your client id and, for confidential clients, the optional client secret. The second optional parameter takes an options object, which currently can be used to override the `url` of gw2.me, for example when developing against a local instance.

All these functions are usually also provided by default OAuth2 libraries. If you just care about accessing the gw2.me specific APIs, you can skip this section and continue to [`Gw2MeApi`](#gw2meapi).


```ts
const client = new Gw2MeClient(client: { clientId: string, clientSecret?: string }, options?: Partial<{ url: string }>)
```

#### `getAuthorizationUrl`

`client.getAuthorizationUrl` can be used to create a authorization url. You can read more about the available parameters on https://gw2.me/dev/docs/access-tokens.

```ts
// create auth url
const authUrl = client.getAuthorizationUrl({
  redirect_uri: 'https://example.com/auth/callback',
  scopes: [Scope.Identify],
  // ...additional properties here
});

// redirect the user to the auth url
location.href = authUrl;
```

#### `pushAuthorizationRequest`

`client.pushAuthorizationRequest` can be used for Pushed Authorization Requests (PAR). Read more about PAR on https://gw2.me/dev/docs/access-tokens#par.

```ts
// create pushed authorization request
const pushedRequest = await client.pushAuthorizationRequest({
  redirect_uri: 'https://example.com/auth/callback',
  scopes: [Scope.Identify],
  // ...additional properties here
});

// get url for the pushed authorization request
const authUrl = client.getAuthorizationUrl(pushedRequest);

// redirect the user to the auth url
location.href = authUrl;
```

#### `parseAuthorizationResponseSearchParams`

`client.parseAuthorizationResponseSearchParams` parses search url parameters to extract the code or error.

```ts
const searchParams = new URLSearchParams(location.search);
const { code } = client.parseAuthorizationResponseSearchParams(searchParams);
```


#### `getAccessToken`

`client.getAccessToken` exchanges an authorization token for an access token, which can be used to call the gw2.me API.

```ts
const accessToken = await client.getAccessToken({ code });
```

#### `refreshToken`

`client.refreshToken` uses a refresh token to receive a new access token. See https://gw2.me/dev/docs/refresh-tokens for more information on refreshing tokens.

```ts
const accessToken = await client.refreshToken({ refresh_token });
```

#### `revokeToken`

`client.revokeToken` can be used to revoke a (access or refresh) token that is no longer needed.

```ts
await client.revokeToken({ token });
```

#### `introspectToken`

`client.introspectToken` returns information about an access or refresh token.

```ts
const info = await client.introspectToken({ token });
```

### `Gw2MeApi`

The `Gw2MeApi` class provides access to the gw2.me API. This can be useful even if using a standard OAuth2 library for the initial OAuth2 flow instead of the functions described above.

```ts
const api = client.api(accessToken);
```

#### `user`

`api.user` returns the current user. See https://gw2.me/dev/docs/users for more information.

```ts
const user = await api.user();
```

#### `saveSettings`

`api.saveSettings` stores settings for the current user. See https://gw2.me/dev/docs/users for more information.

```ts
await api.saveSettings({ foo: 'bar' });
```

#### `accounts`

`api.accounts` gets all the authorized Guild Wars 2 accounts for the current user. See https://gw2.me/dev/docs/gw2-api#accounts for more information.

```ts
const accounts = await api.accounts();
```

#### `subtoken`

`api.subtoken` requests a subtoken for the given account of the user. The subtoken can be used to make authenticated requests against the official Guild Wars 2 API. See https://gw2.me/dev/docs/gw2-api#subtoken for more information.

```ts
const subtoken = await api.subtoken(accountId);

// you can also request a limited set of permissions
const subtoken = await api.subtoken(accountId, { permissions: ['account'] });
```

### FedCM

FedCM is a browser API for privacy-preserving federated authentication without the need for third-party cookies and redirects. It is described in more detail on https://gw2.me/dev/docs/fed-cm.

```ts
// check if FedCM is supported in the current browser
const isSupported = client.fedCM.isSupported();

// initiate a FedCM request
const { token: code } = await client.fedCM.request({
  scopes: [Scope.Identify],
  // ...additional properties here
});

// The received code can now be exchanged for an access token using the regular client functions
const accessToken = await client.getAccessToken({ code });
```

### PCKE

Proof Key for Code Exchange (PKCE) is a method to prevent code interception attacks. You can read more about it on https://gw2.me/dev/docs/access-tokens#pkce. It is highly recommended you use PKCE.

This library provides a helper functions to generate code challenges.

```ts
import { generatePKCEPair } from '@gw2me/client/pkce';

const { code_verifier, challenge } = await generatePKCEPair();

// pass the generated challenge when creating the authorization url
const authUrl = client.getAuthorizationUrl({
  redirect_uri: 'https://example.com/auth/callback',
  scopes: [Scope.Identify],
  ...challenge,
  // ...additional properties here
});  

// ...

// later use the verifier when exchanging the code for the access token
const accessToken = await client.getAccessToken({ code, code_verifier });
```

### DPoP

DPoP is a method to prevent replay attacks by binding the access token to the client. You can read more about DPoP on https://gw2.me/dev/docs/access-tokens#dpop.

All client functions that can use DPoP take a `dpop` callback as parameter, which should return the DPoP proof. This library exports some basic functions to get you started with using DPoP.

```ts
import { generateDPoPKeyPair, createDPoPJwt, jwkThumbprint } from '@gw2me/client/dpop';

// create a DPoP key pair
const dpop = await generateDPoPKeyPair();
// TODO: store the dpop keys securely, as dpop bound tokens can only be used in combination with these keys

// create a DPoP bound authorization url by passing the thumbprint of the public key
const authUrl = client.getAuthorizationUrl({
  // ...
  dpop_jkt: await jwkThumbprint(dpop.publicKey)
});

// ...

// later exchange code for access token
const accessToken = await client.getAccessToken({
  code,
  dpop: (params) => createDPoPJwt(params, dpop),
});
```

## License

**@gw2me/client** is licensed under the [MIT License](./LICENSE).
