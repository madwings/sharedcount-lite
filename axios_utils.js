const axios = require('axios');

const instance = axios.create();
// Add a request interceptor
instance.interceptors.request.use((settings) => {
// Do something before request is sent
  if (!settings.timeout) {
    settings.timeout = 101000; // Set default timeout of 101 seconds, Cloudflare default is 100
  }

  return settings;
}, (error) => {
  // Do something with request error
  return Promise.reject(error);
});
// Add a response interceptor
instance.interceptors.response.use((response) => {
  // Any status code that lie within the range of 2xx cause this function to trigger
  // Do something with response data
  response.statusCode = response.status;
  response.statusMessage = response.statusText;

  return response;
}, (error) => {
  // Any status codes that falls outside the range of 2xx cause this function to trigger
  // Do something with response error
  if (error.response) {
    error.response.statusCode = error.response.status;
    error.response.statusMessage = error.response.statusText;
  }

  return Promise.reject(error);
});

module.exports = instance;
