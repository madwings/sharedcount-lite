const nock = require('nock');
const Sharedcount = require('./index');

nock.disableNetConnect();

const baseUrl = 'https://api.sharedcount.com';
const apiKey = 'TEST_API_KEY';
const expectedResult = { result: 'ok' };

describe('Sharedcount unit tests', () => {
  const sc = new Sharedcount({ apiKey });

  afterEach(() => {
    nock.cleanAll();
  });

  it('url', async () => {
    const url = 'http://domain.com';
    nock(baseUrl)
      .get('/v1.0/')
      .query({ apiKey, url })
      .reply(200, expectedResult);
    const result = await sc.url(url);
    expect(result.data).toEqual(expectedResult);
  });

  it('url (without http prefix)', async () => {
    const domain = 'domain.com';
    nock(baseUrl)
      .get('/v1.0/')
      .query({ apiKey, url: `http://${domain}` })
      .reply(200, expectedResult);
    const result = await sc.url(domain);
    expect(result.data).toEqual(expectedResult);
  });

  it('domain whitelist', async () => {
    nock(baseUrl)
      .get('/v1.0/domain_whitelist')
      .query({ apiKey })
      .reply(200, expectedResult);

    const result = await sc.domainWhitelist();
    expect(result.data).toEqual(expectedResult);
  });

  it('usage', async () => {
    nock(baseUrl)
      .get('/v1.0/usage')
      .query({ apiKey })
      .reply(200, expectedResult);

    const result = await sc.usage();
    expect(result.data).toEqual(expectedResult);
  });

  it('quota', async () => {
    nock(baseUrl)
      .get('/v1.0/quota')
      .query({ apiKey })
      .reply(200, expectedResult);

    const result = await sc.quota();
    expect(result.data).toEqual(expectedResult);
  });

  it('status', async () => {
    nock(baseUrl)
      .get('/v1.0/status')
      .query({ apiKey })
      .reply(200, expectedResult);

    const result = await sc.status();
    expect(result.data).toEqual(expectedResult);
  });
});
