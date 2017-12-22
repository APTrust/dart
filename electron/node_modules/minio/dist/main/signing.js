/*
 * Minio Javascript Library for Amazon S3 Compatible Cloud Storage, (C) 2016 Minio, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});
exports.postPresignSignatureV4 = postPresignSignatureV4;
exports.signV4 = signV4;
exports.presignSignatureV4 = presignSignatureV4;

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj['default'] = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _crypto = require('crypto');

var _crypto2 = _interopRequireDefault(_crypto);

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _helpersJs = require('./helpers.js');

var _errorsJs = require('./errors.js');

var errors = _interopRequireWildcard(_errorsJs);

var signV4Algorithm = 'AWS4-HMAC-SHA256';

// getCanonicalRequest generate a canonical request of style.
//
// canonicalRequest =
//  <HTTPMethod>\n
//  <CanonicalURI>\n
//  <CanonicalQueryString>\n
//  <CanonicalHeaders>\n
//  <SignedHeaders>\n
//  <HashedPayload>
//
function getCanonicalRequest(method, path, headers, signedHeaders, hashedPayload) {
  if (!(0, _helpersJs.isString)(method)) {
    throw new TypeError('method should be of type "string"');
  }
  if (!(0, _helpersJs.isString)(path)) {
    throw new TypeError('path should be of type "string"');
  }
  if (!(0, _helpersJs.isObject)(headers)) {
    throw new TypeError('headers should be of type "object"');
  }
  if (!(0, _helpersJs.isArray)(signedHeaders)) {
    throw new TypeError('signedHeaders should be of type "array"');
  }
  if (!(0, _helpersJs.isString)(hashedPayload)) {
    throw new TypeError('hashedPayload should be of type "string"');
  }
  var headersArray = signedHeaders.reduce(function (acc, i) {
    acc.push(i.toLowerCase() + ':' + headers[i]);
    return acc;
  }, []);

  var requestResource = path.split('?')[0];
  var requestQuery = path.split('?')[1];
  if (!requestQuery) requestQuery = '';

  if (requestQuery) {
    requestQuery = requestQuery.split('&').sort().map(function (element) {
      return element.indexOf('=') === -1 ? element + '=' : element;
    }).join('&');
  }

  var canonical = [];
  canonical.push(method.toUpperCase());
  canonical.push(requestResource);
  canonical.push(requestQuery);
  canonical.push(headersArray.join('\n') + '\n');
  canonical.push(signedHeaders.join(';').toLowerCase());
  canonical.push(hashedPayload);
  return canonical.join('\n');
}

// generate a credential string
function getCredential(accessKey, region, requestDate) {
  if (!(0, _helpersJs.isString)(accessKey)) {
    throw new TypeError('accessKey should be of type "string"');
  }
  if (!(0, _helpersJs.isString)(region)) {
    throw new TypeError('region should be of type "string"');
  }
  if (!(0, _helpersJs.isObject)(requestDate)) {
    throw new TypeError('requestDate should be of type "object"');
  }
  return accessKey + '/' + (0, _helpersJs.getScope)(region, requestDate);
}

// Returns signed headers array - alphabetically sorted
function getSignedHeaders(headers) {
  if (!(0, _helpersJs.isObject)(headers)) {
    throw new TypeError('request should be of type "object"');
  }
  // Excerpts from @lsegal - https://github.com/aws/aws-sdk-js/issues/659#issuecomment-120477258
  //
  //  User-Agent:
  //
  //      This is ignored from signing because signing this causes problems with generating pre-signed URLs
  //      (that are executed by other agents) or when customers pass requests through proxies, which may
  //      modify the user-agent.
  //
  //  Content-Length:
  //
  //      This is ignored from signing because generating a pre-signed URL should not provide a content-length
  //      constraint, specifically when vending a S3 pre-signed PUT URL. The corollary to this is that when
  //      sending regular requests (non-pre-signed), the signature contains a checksum of the body, which
  //      implicitly validates the payload length (since changing the number of bytes would change the checksum)
  //      and therefore this header is not valuable in the signature.
  //
  //  Content-Type:
  //
  //      Signing this header causes quite a number of problems in browser environments, where browsers
  //      like to modify and normalize the content-type header in different ways. There is more information
  //      on this in https://github.com/aws/aws-sdk-js/issues/244. Avoiding this field simplifies logic
  //      and reduces the possibility of future bugs
  //
  //  Authorization:
  //
  //      Is skipped for obvious reasons

  var ignoredHeaders = ['authorization', 'content-length', 'content-type', 'user-agent'];
  return _lodash2['default'].map(headers, function (v, header) {
    return header;
  }).filter(function (header) {
    return ignoredHeaders.indexOf(header) === -1;
  }).sort();
}

// returns the key used for calculating signature
function getSigningKey(date, region, secretKey) {
  if (!(0, _helpersJs.isObject)(date)) {
    throw new TypeError('date should be of type "object"');
  }
  if (!(0, _helpersJs.isString)(region)) {
    throw new TypeError('region should be of type "string"');
  }
  if (!(0, _helpersJs.isString)(secretKey)) {
    throw new TypeError('secretKey should be of type "string"');
  }
  var dateLine = (0, _helpersJs.makeDateShort)(date),
      hmac1 = _crypto2['default'].createHmac('sha256', 'AWS4' + secretKey).update(dateLine).digest(),
      hmac2 = _crypto2['default'].createHmac('sha256', hmac1).update(region).digest(),
      hmac3 = _crypto2['default'].createHmac('sha256', hmac2).update('s3').digest();
  return _crypto2['default'].createHmac('sha256', hmac3).update('aws4_request').digest();
}

// returns the string that needs to be signed
function getStringToSign(canonicalRequest, requestDate, region) {
  if (!(0, _helpersJs.isString)(canonicalRequest)) {
    throw new TypeError('canonicalRequest should be of type "string"');
  }
  if (!(0, _helpersJs.isObject)(requestDate)) {
    throw new TypeError('requestDate should be of type "object"');
  }
  if (!(0, _helpersJs.isString)(region)) {
    throw new TypeError('region should be of type "string"');
  }
  var hash = _crypto2['default'].createHash('sha256').update(canonicalRequest).digest('hex');
  var scope = (0, _helpersJs.getScope)(region, requestDate);
  var stringToSign = [];
  stringToSign.push(signV4Algorithm);
  stringToSign.push((0, _helpersJs.makeDateLong)(requestDate));
  stringToSign.push(scope);
  stringToSign.push(hash);
  return stringToSign.join('\n');
}

// calculate the signature of the POST policy

function postPresignSignatureV4(region, date, secretKey, policyBase64) {
  if (!(0, _helpersJs.isString)(region)) {
    throw new TypeError('region should be of type "string"');
  }
  if (!(0, _helpersJs.isObject)(date)) {
    throw new TypeError('date should be of type "object"');
  }
  if (!(0, _helpersJs.isString)(secretKey)) {
    throw new TypeError('secretKey should be of type "string"');
  }
  if (!(0, _helpersJs.isString)(policyBase64)) {
    throw new TypeError('policyBase64 should be of type "string"');
  }
  var signingKey = getSigningKey(date, region, secretKey);
  return _crypto2['default'].createHmac('sha256', signingKey).update(policyBase64).digest('hex').toLowerCase();
}

// Returns the authorization header

function signV4(request, accessKey, secretKey, region, requestDate) {
  if (!(0, _helpersJs.isObject)(request)) {
    throw new TypeError('request should be of type "object"');
  }
  if (!(0, _helpersJs.isString)(accessKey)) {
    throw new TypeError('accessKey should be of type "string"');
  }
  if (!(0, _helpersJs.isString)(secretKey)) {
    throw new TypeError('secretKey should be of type "string"');
  }
  if (!(0, _helpersJs.isString)(region)) {
    throw new TypeError('region should be of type "string"');
  }

  if (!accessKey) {
    throw new errors.AccessKeyRequiredError('accessKey is required for signing');
  }
  if (!secretKey) {
    throw new errors.SecretKeyRequiredError('secretKey is required for signing');
  }

  var sha256sum = request.headers['x-amz-content-sha256'];

  var signedHeaders = getSignedHeaders(request.headers);
  var canonicalRequest = getCanonicalRequest(request.method, request.path, request.headers, signedHeaders, sha256sum);
  var stringToSign = getStringToSign(canonicalRequest, requestDate, region);
  var signingKey = getSigningKey(requestDate, region, secretKey);
  var credential = getCredential(accessKey, region, requestDate);
  var signature = _crypto2['default'].createHmac('sha256', signingKey).update(stringToSign).digest('hex').toLowerCase();

  return signV4Algorithm + ' Credential=' + credential + ', SignedHeaders=' + signedHeaders.join(';').toLowerCase() + ', Signature=' + signature;
}

// returns a presigned URL string

function presignSignatureV4(request, accessKey, secretKey, region, requestDate, expires) {
  if (!(0, _helpersJs.isObject)(request)) {
    throw new TypeError('request should be of type "object"');
  }
  if (!(0, _helpersJs.isString)(accessKey)) {
    throw new TypeError('accessKey should be of type "string"');
  }
  if (!(0, _helpersJs.isString)(secretKey)) {
    throw new TypeError('secretKey should be of type "string"');
  }
  if (!(0, _helpersJs.isString)(region)) {
    throw new TypeError('region should be of type "string"');
  }

  if (!accessKey) {
    throw new errors.AccessKeyRequiredError('accessKey is required for presigning');
  }
  if (!secretKey) {
    throw new errors.SecretKeyRequiredError('secretKey is required for presigning');
  }

  if (!(0, _helpersJs.isNumber)(expires)) {
    throw new TypeError('expires should be of type "number"');
  }
  if (expires < 1) {
    throw new errors.ExpiresParamError('expires param cannot be less than 1 seconds');
  }
  if (expires > 604800) {
    throw new errors.ExpiresParamError('expires param cannot be alrger than 7 days');
  }

  var iso8601Date = (0, _helpersJs.makeDateLong)(requestDate);
  var signedHeaders = getSignedHeaders(request.headers);
  var credential = getCredential(accessKey, region, requestDate);
  var hashedPayload = 'UNSIGNED-PAYLOAD';

  var requestQuery = [];
  requestQuery.push('X-Amz-Algorithm=' + signV4Algorithm);
  requestQuery.push('X-Amz-Credential=' + (0, _helpersJs.uriEscape)(credential));
  requestQuery.push('X-Amz-Date=' + iso8601Date);
  requestQuery.push('X-Amz-Expires=' + expires);
  requestQuery.push('X-Amz-SignedHeaders=' + (0, _helpersJs.uriEscape)(signedHeaders.join(';').toLowerCase()));

  var resource = request.path.split('?')[0];
  var query = request.path.split('?')[1];
  if (query) {
    query = query + '&' + requestQuery.join('&');
  } else {
    query = requestQuery.join('&');
  }

  var path = resource + '?' + query;

  var canonicalRequest = getCanonicalRequest(request.method, path, request.headers, signedHeaders, hashedPayload);

  var stringToSign = getStringToSign(canonicalRequest, requestDate, region);
  var signingKey = getSigningKey(requestDate, region, secretKey);
  var signature = _crypto2['default'].createHmac('sha256', signingKey).update(stringToSign).digest('hex').toLowerCase();
  var presignedUrl = request.protocol + '//' + request.headers.host + path + ('&X-Amz-Signature=' + signature);
  return presignedUrl;
}
//# sourceMappingURL=signing.js.map
