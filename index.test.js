const nock = require('nock');
const Sharedcount = require('./index');

nock.disableNetConnect();

const baseUrl = 'https://api.sharedcount.com/v1.1';
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
      .get('/')
      .query({ apiKey, url })
      .reply(200, expectedResult);
    const result = await sc.url(url);
    expect(result).toEqual(expectedResult);
  });

  it('url (without http prefix)', async () => {
    const domain = 'domain.com';
    nock(baseUrl)
      .get('/')
      .query({ apiKey, url: `http://${domain}` })
      .reply(200, expectedResult);
    const result = await sc.url(domain);
    expect(result).toEqual(expectedResult);
  });

  it('domain whitelist', async () => {
    nock(baseUrl)
      .get('/domain_whitelist')
      .query({ apiKey })
      .reply(200, expectedResult);

    const result = await sc.domainWhitelist();
    expect(result).toEqual(expectedResult);
  });

  it('usage', async () => {
    nock(baseUrl)
      .get('/usage')
      .query({ apiKey })
      .reply(200, expectedResult);

    const result = await sc.usage();
    expect(result).toEqual(expectedResult);
  });

  it('quota', async () => {
    nock(baseUrl)
      .get('/quota')
      .query({ apiKey })
      .reply(200, expectedResult);

    const result = await sc.quota();
    expect(result).toEqual(expectedResult);
  });

  it('status', async () => {
    nock(baseUrl)
      .get('/status')
      .query({ apiKey })
      .reply(200, expectedResult);

    const result = await sc.status();
    expect(result).toEqual(expectedResult);
  });
});
