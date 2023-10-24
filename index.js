const request = require('./axios_utils');

const baseUrl = 'https://api.sharedcount.com/v1.1/';

const addHttpToUrl = url => (url.includes('http') ? url : `http://${url}`);

const makeRequest = (apiKey, baseUrl, config) => ({
  path = '', queryParams = {}, data, method = 'GET',
}) => {
  let options = {
    url: `${baseUrl}${path}`,
    method,
    responseType: 'json',
    params: { apiKey, ...queryParams },
    data,
  };
  options = Object.assign(options, config);

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
  return this.makeRequest({ path: 'status' });
};

module.exports = Sharedcount;
