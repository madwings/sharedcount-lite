# SharedCount Lite

[![CI](https://github.com/madwings/sharedcount-lite/actions/workflows/ci.yml/badge.svg?branch=master)](https://github.com/madwings/sharedcount-lite/actions/workflows/ci.yml)
[![NPM version](https://img.shields.io/npm/v/sharedcount-lite.svg)](https://www.npmjs.org/package/sharedcount-lite)

A lightweight [SharedCount](https://sharedcount.com) API wrapper for Node.js 20 or newer.
See the [SharedCount API documentation](https://www.sharedcount.com/api-docs/getting-started)
and the MIT license in `LICENSE`.

## Installation

```shell
npm install sharedcount-lite
```

Or use `yarn add sharedcount-lite`.

## Example

Set `SHAREDCOUNT_API_KEY` in your server-side environment, then run:

```javascript
const SharedCount = require('sharedcount-lite');
const sc = new SharedCount();

sc.url('https://www.example.com/')
  .then((result) => console.log(result))
  .catch((error) => {
    const reason = error.response?.data?.Type ?? error.code ?? 'unknown error';
    console.error('SharedCount request failed:', reason);
    process.exitCode = 1;
  });
```

## Configuration

```javascript
const SharedCount = require('sharedcount-lite');
const sc = new SharedCount({
  apiKey: process.env.SHAREDCOUNT_API_KEY,
  baseUrl: 'https://api.sharedcount.com/v1.1/',
  config: { timeout: 30000 },
});
```

All options are optional. `apiKey` defaults to `SHAREDCOUNT_API_KEY`, and
`baseUrl` defaults to `SHAREDCOUNT_BASE_URL` or the official API URL. A custom
base URL must end in `/`. `config` accepts Axios request options and can
override request defaults, including query parameters; the default timeout is
101 seconds. Keep API keys private and out of logs, including Axios request
configurations, which can contain the key.

The methods return the API response body without changing its fields. A failed
request rejects with an Axios error; when the API returns an error response,
its JSON body is available as `error.response.data`.

### url(url)

Return share counts for a non-empty URL string. An `http://` scheme is added if
none is present, and query parameters are encoded automatically. Invalid
arguments throw a `TypeError`. SharedCount may return `null` when a network
does not report a count, and responses may be cached for up to one hour.

```javascript
const counts = await sc.url('sharedcount.com');
```

### bulkPost(urls)

Queue a non-empty array of non-empty URL strings and return the API's `count`
and `bulk_id`. URLs are encoded automatically; do not percent-encode the entire
URL before passing it. Percent-encoded characters within a URL are preserved.
This endpoint requires a paid plan and each completed URL counts against the
daily quota. SharedCount may ignore invalid URLs, so compare `count` with the
number submitted. Invalid arguments throw a `TypeError`.

```javascript
const { bulk_id: bulkId } = await sc.bulkPost([
  'https://example.com/',
  'https://example.org/?category=technology&sort=newest',
]);
```

### bulkGet(bulkId, options)

Retrieve a bulk job's results. Pass `{ force: true }` to request partial
results before completion. Check `_meta.completed` and, if polling, follow
SharedCount's recommendation to wait 30-60 seconds between requests; the
wrapper does not poll automatically. `bulkId` must be a non-empty string, and
`force` must be a boolean; invalid arguments throw a `TypeError`.

```javascript
const result = await sc.bulkGet(bulkId, { force: true });
```

### quota()

Return information about the day's quota allocation.

```javascript
const quota = await sc.quota();
```

### usage()

Return historical quota usage information.

```javascript
const usage = await sc.usage();
```

### domainWhitelist()

Return the domain whitelist and whether it is currently enforced.

```javascript
const whitelist = await sc.domainWhitelist();
```

### status()

Check whether the SharedCount API is up. This public endpoint does not require
an API key, and the wrapper does not add one automatically.

```javascript
const status = await sc.status();
```
