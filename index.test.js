const nock = require('nock');
const Sharedcount = require('./index');

nock.disableNetConnect();

const baseUrl = 'https://api.sharedcount.com/v1.1';
const apiKey = 'TEST_API_KEY';
const engagement = {
  Pinterest: null,
  Facebook: {
    total_count: 168,
    comment_count: 53,
    reaction_count: 14,
    share_count: 101,
    comment_plugin_count: 0,
  },
};

describe('Sharedcount unit tests', () => {
  const sc = new Sharedcount({ apiKey });

  afterEach(() => {
    const pendingMocks = nock.pendingMocks();
    nock.cleanAll();
    expect(pendingMocks).toEqual([]);
  });

  afterAll(() => {
    nock.enableNetConnect();
  });

  it('retrieves share counts and encodes the complete URL', async () => {
    const url = 'https://example.com/?q=hello%20world&sort=newest#news';
    nock(baseUrl)
      .get('/')
      .query({ apikey: apiKey, url })
      .reply(200, engagement);

    const result = await sc.url(url);
    expect(result).toEqual(engagement);
  });

  it('adds an HTTP scheme to a domain without one', async () => {
    const domain = 'myhttpdomain.com';
    nock(baseUrl)
      .get('/')
      .query({ apikey: apiKey, url: `http://${domain}` })
      .reply(200, engagement);

    const result = await sc.url(domain);
    expect(result).toEqual(engagement);
  });

  it('preserves an existing HTTP scheme regardless of case', async () => {
    const url = 'HTTPS://example.com/';
    nock(baseUrl)
      .get('/')
      .query({ apikey: apiKey, url })
      .reply(200, engagement);

    await expect(sc.url(url)).resolves.toEqual(engagement);
  });

  it('preserves an existing HTTP scheme', async () => {
    const url = 'http://example.com/';
    nock(baseUrl)
      .get('/')
      .query({ apikey: apiKey, url })
      .reply(200, engagement);

    await expect(sc.url(url)).resolves.toEqual(engagement);
  });

  it('throws for invalid URL arguments', () => {
    expect(() => sc.url(null)).toThrow(TypeError);
    expect(() => sc.url(123)).toThrow(TypeError);
    expect(() => sc.url('   ')).toThrow(TypeError);
  });

  it('domain whitelist', async () => {
    const expectedResult = { domains: ['example.com'], whitelist_domains_enabled: true };
    nock(baseUrl)
      .get('/domain_whitelist')
      .query({ apikey: apiKey })
      .reply(200, expectedResult);

    const result = await sc.domainWhitelist();
    expect(result).toEqual(expectedResult);
  });

  it('usage', async () => {
    const expectedResult = {
      '2026-11-04': { date: '2026-11-04', queries: 320, quota: 10000 },
    };
    nock(baseUrl)
      .get('/usage')
      .query({ apikey: apiKey })
      .reply(200, expectedResult);

    const result = await sc.usage();
    expect(result).toEqual(expectedResult);
  });

  it('quota', async () => {
    const expectedResult = {
      quota_used_today: 812,
      plan: 'personal',
      quota_remaining_today: 9188,
      quota_allocated_today: 10000,
    };
    nock(baseUrl)
      .get('/quota')
      .query({ apikey: apiKey })
      .reply(200, expectedResult);

    const result = await sc.quota();
    expect(result).toEqual(expectedResult);
  });

  it('supports a custom API base URL', async () => {
    const customBaseUrl = 'https://sharedcount.example/v1.1';
    const client = new Sharedcount({ apiKey, baseUrl: `${customBaseUrl}/` });
    const expectedResult = { quota_remaining_today: 100 };
    nock(customBaseUrl)
      .get('/quota')
      .query({ apikey: apiKey })
      .reply(200, expectedResult);

    await expect(client.quota()).resolves.toEqual(expectedResult);
  });

  it('uses the API key and base URL from the environment', async () => {
    const previousApiKey = process.env.SHAREDCOUNT_API_KEY;
    const previousBaseUrl = process.env.SHAREDCOUNT_BASE_URL;
    process.env.SHAREDCOUNT_API_KEY = 'ENV_TEST_KEY';
    process.env.SHAREDCOUNT_BASE_URL = 'https://environment.example/v1.1/';

    try {
      const expectedResult = { quota_remaining_today: 100 };
      nock('https://environment.example/v1.1')
        .get('/quota')
        .query({ apikey: 'ENV_TEST_KEY' })
        .reply(200, expectedResult);

      await expect(new Sharedcount().quota()).resolves.toEqual(expectedResult);
    } finally {
      if (previousApiKey === undefined) {
        delete process.env.SHAREDCOUNT_API_KEY;
      } else {
        process.env.SHAREDCOUNT_API_KEY = previousApiKey;
      }
      if (previousBaseUrl === undefined) {
        delete process.env.SHAREDCOUNT_BASE_URL;
      } else {
        process.env.SHAREDCOUNT_BASE_URL = previousBaseUrl;
      }
    }
  });

  it('checks status without sending the API key', async () => {
    const expectedResult = { status: 'up' };
    nock(baseUrl)
      .get('/status')
      .reply(200, expectedResult);

    const result = await sc.status();
    expect(result).toEqual(expectedResult);
  });

  it('exposes API error responses', async () => {
    const url = 'https://example.com/';
    const error = { Error: 'Not a valid URL.', Type: 'invalid_url' };
    nock(baseUrl)
      .get('/')
      .query({ apikey: apiKey, url })
      .reply(400, error);

    await expect(sc.url(url)).rejects.toMatchObject({
      response: { status: 400, statusCode: 400, data: error },
    });
  });

  it('submits encoded bulk URLs as newline-terminated plain text', async () => {
    const client = new Sharedcount({
      apiKey,
      config: { headers: { 'X-Client': 'test-client' } },
    });
    const urls = [
      'https://example.com/?q=hello%20world&sort=newest#news',
      'myhttpdomain.com/path?x=1&y=two',
    ];
    const body = [
      'https%3A%2F%2Fexample.com%2F%3Fq%3Dhello%2520world%26sort%3Dnewest%23news',
      'http%3A%2F%2Fmyhttpdomain.com%2Fpath%3Fx%3D1%26y%3Dtwo',
      '',
    ].join('\n');
    const expectedResult = { count: 2, bulk_id: 'bulk-123' };
    nock(baseUrl)
      .post('/bulk', body)
      .query({ apikey: apiKey })
      .matchHeader('Content-Type', 'text/plain')
      .matchHeader('X-Client', 'test-client')
      .reply(200, expectedResult);

    await expect(client.bulkPost(urls)).resolves.toEqual(expectedResult);
  });

  it('throws for invalid bulk URL lists', () => {
    const sparseUrls = ['https://example.com/'];
    sparseUrls.length = 2;

    expect(() => sc.bulkPost([])).toThrow(TypeError);
    expect(() => sc.bulkPost([''])).toThrow(TypeError);
    expect(() => sc.bulkPost(['https://example.com/', null])).toThrow(TypeError);
    expect(() => sc.bulkPost(sparseUrls)).toThrow(TypeError);
    expect(() => sc.bulkPost('https://example.com/')).toThrow(TypeError);
  });

  it('retrieves the status of a bulk job', async () => {
    const expectedResult = {
      data: [],
      _meta: {
        urls_completed: 1,
        bulk_id: 'bulk-123',
        completed: false,
        urls_queued: 2,
      },
    };
    nock(baseUrl)
      .get('/bulk')
      .query({ apikey: apiKey, bulk_id: 'bulk-123' })
      .reply(200, expectedResult);

    await expect(sc.bulkGet('bulk-123')).resolves.toEqual(expectedResult);
  });

  it('requests partial bulk results when force is enabled', async () => {
    const expectedResult = {
      data: { 'https://example.com/': engagement },
      _meta: {
        urls_completed: 1,
        bulk_id: 'bulk-123',
        completed: false,
        urls_queued: 2,
      },
    };
    nock(baseUrl)
      .get('/bulk')
      .query({ apikey: apiKey, bulk_id: 'bulk-123', force: '1' })
      .reply(200, expectedResult);

    await expect(sc.bulkGet('bulk-123', { force: true })).resolves.toEqual(expectedResult);
  });

  it('throws for invalid bulk job arguments', () => {
    expect(() => sc.bulkGet('')).toThrow(TypeError);
    expect(() => sc.bulkGet(null)).toThrow(TypeError);
    expect(() => sc.bulkGet('bulk-123', { force: 'yes' })).toThrow(TypeError);
  });
});
