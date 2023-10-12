# `@gw2me/client`

This is a client library to interact with the gw2.me API.

## Usage

```ts
import { Gw2MeClient } from '@gw2me/client';

const client = new Gw2MeClient({ client_id: '<client_id>' });
const url = client.getAuthorizationUrl({ /* ... */ });

// redirect user to url
```

## Installation

```
npm i @gw2me/client
```

## License

**@gw2me/client** is licensed under the [MIT License](./LICENSE).
