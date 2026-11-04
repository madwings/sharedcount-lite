const request = require('./axios_utils');

const baseUrl = 'https://api.sharedcount.com/v1.1/';

const addHttpToUrl = (url) => {
  if (typeof url !== 'string' || url.trim() === '') {
    throw new TypeError('url must be a non-empty string');
  }
  return /^https?:\/\//i.test(url) ? url : `http://${url}`;
};

const makeRequest = (apiKey, requestBaseUrl, config) => ({
  path = '', queryParams = {}, data, method = 'GET', headers, authenticated = true,
}) => {
  const options = {
    url: `${requestBaseUrl}${path}`,
    method,
    responseType: 'json',
    params: { ...(authenticated ? { apikey: apiKey } : {}), ...queryParams },
    data,
    ...config,
  };
  if (headers) {
    options.headers = { ...headers, ...options.headers };
  }

  return request(options).then((response) => response.data);
};

const Sharedcount = function Sharedcount(options = {}) {
  this.apiKey = options.apiKey || process.env.SHAREDCOUNT_API_KEY;
  this.baseUrl = options.baseUrl || process.env.SHAREDCOUNT_BASE_URL || baseUrl;
  this.config = options.config || {};
  this.makeRequest = makeRequest(this.apiKey, this.baseUrl, this.config);

  return this;
};

Sharedcount.prototype.url = function urlInfo(url) {
  return this.makeRequest({ queryParams: { url: addHttpToUrl(url) } });
};

Sharedcount.prototype.bulkPost = function bulkPost(urls) {
  if (!Array.isArray(urls) || urls.length === 0) {
    throw new TypeError('urls must be a non-empty array');
  }

  const encodedUrls = Array.from(urls, (url) => encodeURIComponent(addHttpToUrl(url)));
  return this.makeRequest({
    path: 'bulk',
    method: 'POST',
    data: `${encodedUrls.join('\n')}\n`,
    headers: { 'Content-Type': 'text/plain' },
  });
};

Sharedcount.prototype.bulkGet = function bulkGet(bulkId, { force = false } = {}) {
  if (typeof bulkId !== 'string' || bulkId.trim() === '') {
    throw new TypeError('bulkId must be a non-empty string');
  }
  if (typeof force !== 'boolean') {
    throw new TypeError('force must be a boolean');
  }

  const queryParams = { bulk_id: bulkId };
  if (force) {
    queryParams.force = 1;
  }
  return this.makeRequest({ path: 'bulk', queryParams });
};

Sharedcount.prototype.domainWhitelist = function status() {
  return this.makeRequest({ path: 'domain_whitelist' });
};

Sharedcount.prototype.usage = function usage() {
  return this.makeRequest({ path: 'usage' });
};

Sharedcount.prototype.quota = function usage() {
  return this.makeRequest({ path: 'quota' });
};

Sharedcount.prototype.status = function status() {
  return this.makeRequest({ path: 'status', authenticated: false });
};

module.exports = Sharedcount;
