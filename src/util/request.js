import _ from 'lodash';
import * as queryString from 'query-string';

const requestHeaders = {
  'Accept': 'application/json',
  'Content-Type': 'application/json'
};

/**
 * package a set of functions for network requests
 * */
let request = {};

/**
 * @param {string} url
 * @param {object} [data]
 * @param {object} [headers]
 * @returns {Promise<any>}
 */
request.get = function (url, data, headers) {

  // fetch url
  data && (url += '?' + queryString.stringify(data));

  // fetch options
  let options = _.merge(
    {method: 'GET'},
    {headers: requestHeaders},
    headers ? {headers} : {}
  );

  if (__DEV__) {
    console.log('request (get):', url)
  }

  return fetch(url, options)
    .catch(e => {
      console.log('get error');
      console.log(e);
    })
    .then(res => res.json())
    .catch(e => {
      console.log('get error');
      console.log(e);
      return null;
    });
};

/**
 * @param {string} url
 * @param {object} [data]
 * @param {object} [headers]
 * @returns {Promise<any>}
 */
request.post = function (url, data, headers) {

  // fetch options
  let options = _.merge(
    {method: 'POST'},
    {headers: requestHeaders},
    data ? {body: JSON.stringify(data)} : {},
    headers ? {headers} : {}
  );

  if (__DEV__) {
    console.log('request (post):', url + '\nbody: ' + JSON.stringify(data))
  }

  return fetch(url, options)
    .catch(e => {
      console.log('post error');
      console.log(e);
    })
    .then(res => res.json())
    .catch(e => {
      console.log('post error');
      console.log(e);
      return null;
    })
};

request.postFormBody = function (url, data, headers) {
  const formBody = Object.keys(data).map(key =>
    encodeURIComponent(key) + '=' + encodeURIComponent(data[key])).join('&');

  let options = _.merge(
    {method: 'POST'},
    {headers: {'Content-Type': 'application/x-www-form-urlencoded'}},
    data ? {body: formBody} : {},
    headers ? {headers} : {}
  );

  return fetch(url, options)
    .catch(e => {
      console.log('postFormBody error');
      console.log(e);
    })
    .then(res => res.json())
    .catch(e => {
      console.log('postFormBody error');
      console.log(e);
      return null;
    })
};

/**
 * @param {string} url
 * @param {object} data
 * @param headers
 * @returns {Promise<any>}
 */
request.postFormData = function (url, data, headers) {

  // fetch options
  let options = _.merge(
    {method: 'POST'},
    {headers: {'Content-Type': 'multipart/form-data'}},
    data ? {body: constructFormData(data)} : {},
    headers ? {headers} : {}
  );

  if (__DEV__) {
    console.log('request (postFormData):', url + '\nheader: ' + JSON.stringify(headers) +
      '\nbody: ' + JSON.stringify(data))
  }

  return fetch(url, options)
    .catch(e => {
      console.log('postFormData error');
      console.log(e);
    })
    .then(res => res.json())
    .catch(e => {
      console.log('postFormData error');
      console.log(e);
      return null;
    })
};

/**
 * {
 *   uri,
 *   name: `recording.${fileType}`,
 *   type: `audio/x-${fileType}`,
 * }
 * */
function constructFormData(data) {
  if (typeof data === 'object') {
    let formData = new FormData();
    Object.keys(data).forEach(key => {
      formData.append(key, data[key]);
    });
    return formData;
  }
  else {
    return {};
  }
}

export default request;