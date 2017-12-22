/*
 * Minio Javascript Library for Amazon S3 Compatible Cloud Storage, (C) 2015 Minio, Inc.
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

var _get = function get(_x, _x2, _x3) { var _again = true; _function: while (_again) { var object = _x, property = _x2, receiver = _x3; _again = false; if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { _x = parent; _x2 = property; _x3 = receiver; _again = true; desc = parent = undefined; continue _function; } } else if ('value' in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } } };

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

function _inherits(subClass, superClass) { if (typeof superClass !== 'function' && superClass !== null) { throw new TypeError('Super expression must either be null or a function, not ' + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var _es6Error = require('es6-error');

var _es6Error2 = _interopRequireDefault(_es6Error);

// AnonymousRequestError is generated for anonymous keys on specific
// APIs. NOTE: PresignedURL generation always requires access keys.

var AnonymousRequestError = (function (_ExtendableError) {
  _inherits(AnonymousRequestError, _ExtendableError);

  function AnonymousRequestError(message) {
    _classCallCheck(this, AnonymousRequestError);

    _get(Object.getPrototypeOf(AnonymousRequestError.prototype), 'constructor', this).call(this, message);
  }

  // InvalidArgumentError is generated for all invalid arguments.
  return AnonymousRequestError;
})(_es6Error2['default']);

exports.AnonymousRequestError = AnonymousRequestError;

var InvalidArgumentError = (function (_ExtendableError2) {
  _inherits(InvalidArgumentError, _ExtendableError2);

  function InvalidArgumentError(message) {
    _classCallCheck(this, InvalidArgumentError);

    _get(Object.getPrototypeOf(InvalidArgumentError.prototype), 'constructor', this).call(this, message);
  }

  // InvalidPortError is generated when a non integer value is provided
  // for ports.
  return InvalidArgumentError;
})(_es6Error2['default']);

exports.InvalidArgumentError = InvalidArgumentError;

var InvalidPortError = (function (_ExtendableError3) {
  _inherits(InvalidPortError, _ExtendableError3);

  function InvalidPortError(message) {
    _classCallCheck(this, InvalidPortError);

    _get(Object.getPrototypeOf(InvalidPortError.prototype), 'constructor', this).call(this, message);
  }

  // InvalidEndpointError is generated when an invalid end point value is
  // provided which does not follow domain standards.
  return InvalidPortError;
})(_es6Error2['default']);

exports.InvalidPortError = InvalidPortError;

var InvalidEndpointError = (function (_ExtendableError4) {
  _inherits(InvalidEndpointError, _ExtendableError4);

  function InvalidEndpointError(message) {
    _classCallCheck(this, InvalidEndpointError);

    _get(Object.getPrototypeOf(InvalidEndpointError.prototype), 'constructor', this).call(this, message);
  }

  // InvalidBucketNameError is generated when an invalid bucket name is
  // provided which does not follow AWS S3 specifications.
  // http://docs.aws.amazon.com/AmazonS3/latest/dev/BucketRestrictions.html
  return InvalidEndpointError;
})(_es6Error2['default']);

exports.InvalidEndpointError = InvalidEndpointError;

var InvalidBucketNameError = (function (_ExtendableError5) {
  _inherits(InvalidBucketNameError, _ExtendableError5);

  function InvalidBucketNameError(message) {
    _classCallCheck(this, InvalidBucketNameError);

    _get(Object.getPrototypeOf(InvalidBucketNameError.prototype), 'constructor', this).call(this, message);
  }

  // InvalidObjectNameError is generated when an invalid object name is
  // provided which does not follow AWS S3 specifications.
  // http://docs.aws.amazon.com/AmazonS3/latest/dev/UsingMetadata.html
  return InvalidBucketNameError;
})(_es6Error2['default']);

exports.InvalidBucketNameError = InvalidBucketNameError;

var InvalidObjectNameError = (function (_ExtendableError6) {
  _inherits(InvalidObjectNameError, _ExtendableError6);

  function InvalidObjectNameError(message) {
    _classCallCheck(this, InvalidObjectNameError);

    _get(Object.getPrototypeOf(InvalidObjectNameError.prototype), 'constructor', this).call(this, message);
  }

  // AccessKeyRequiredError generated by signature methods when access
  // key is not found.
  return InvalidObjectNameError;
})(_es6Error2['default']);

exports.InvalidObjectNameError = InvalidObjectNameError;

var AccessKeyRequiredError = (function (_ExtendableError7) {
  _inherits(AccessKeyRequiredError, _ExtendableError7);

  function AccessKeyRequiredError(message) {
    _classCallCheck(this, AccessKeyRequiredError);

    _get(Object.getPrototypeOf(AccessKeyRequiredError.prototype), 'constructor', this).call(this, message);
  }

  // SecretKeyRequiredError generated by signature methods when secret
  // key is not found.
  return AccessKeyRequiredError;
})(_es6Error2['default']);

exports.AccessKeyRequiredError = AccessKeyRequiredError;

var SecretKeyRequiredError = (function (_ExtendableError8) {
  _inherits(SecretKeyRequiredError, _ExtendableError8);

  function SecretKeyRequiredError(message) {
    _classCallCheck(this, SecretKeyRequiredError);

    _get(Object.getPrototypeOf(SecretKeyRequiredError.prototype), 'constructor', this).call(this, message);
  }

  // ExpiresParamError generated when expires parameter value is not
  // well within stipulated limits.
  return SecretKeyRequiredError;
})(_es6Error2['default']);

exports.SecretKeyRequiredError = SecretKeyRequiredError;

var ExpiresParamError = (function (_ExtendableError9) {
  _inherits(ExpiresParamError, _ExtendableError9);

  function ExpiresParamError(message) {
    _classCallCheck(this, ExpiresParamError);

    _get(Object.getPrototypeOf(ExpiresParamError.prototype), 'constructor', this).call(this, message);
  }

  // InvalidDateError generated when invalid date is found.
  return ExpiresParamError;
})(_es6Error2['default']);

exports.ExpiresParamError = ExpiresParamError;

var InvalidDateError = (function (_ExtendableError10) {
  _inherits(InvalidDateError, _ExtendableError10);

  function InvalidDateError(message) {
    _classCallCheck(this, InvalidDateError);

    _get(Object.getPrototypeOf(InvalidDateError.prototype), 'constructor', this).call(this, message);
  }

  // InvalidPrefixError generated when object prefix provided is invalid
  // or does not conform to AWS S3 object key restrictions.
  return InvalidDateError;
})(_es6Error2['default']);

exports.InvalidDateError = InvalidDateError;

var InvalidPrefixError = (function (_ExtendableError11) {
  _inherits(InvalidPrefixError, _ExtendableError11);

  function InvalidPrefixError(message) {
    _classCallCheck(this, InvalidPrefixError);

    _get(Object.getPrototypeOf(InvalidPrefixError.prototype), 'constructor', this).call(this, message);
  }

  // InvalidBucketPolicyError generated when the given bucket policy is invalid.
  return InvalidPrefixError;
})(_es6Error2['default']);

exports.InvalidPrefixError = InvalidPrefixError;

var InvalidBucketPolicyError = (function (_ExtendableError12) {
  _inherits(InvalidBucketPolicyError, _ExtendableError12);

  function InvalidBucketPolicyError(message) {
    _classCallCheck(this, InvalidBucketPolicyError);

    _get(Object.getPrototypeOf(InvalidBucketPolicyError.prototype), 'constructor', this).call(this, message);
  }

  // IncorrectSizeError generated when total data read mismatches with
  // the input size.
  return InvalidBucketPolicyError;
})(_es6Error2['default']);

exports.InvalidBucketPolicyError = InvalidBucketPolicyError;

var IncorrectSizeError = (function (_ExtendableError13) {
  _inherits(IncorrectSizeError, _ExtendableError13);

  function IncorrectSizeError(message) {
    _classCallCheck(this, IncorrectSizeError);

    _get(Object.getPrototypeOf(IncorrectSizeError.prototype), 'constructor', this).call(this, message);
  }

  // InvalidXMLError generated when an unknown XML is found.
  return IncorrectSizeError;
})(_es6Error2['default']);

exports.IncorrectSizeError = IncorrectSizeError;

var InvalidXMLError = (function (_ExtendableError14) {
  _inherits(InvalidXMLError, _ExtendableError14);

  function InvalidXMLError(message) {
    _classCallCheck(this, InvalidXMLError);

    _get(Object.getPrototypeOf(InvalidXMLError.prototype), 'constructor', this).call(this, message);
  }

  // S3Error is generated for errors returned from S3 server.
  // see getErrorTransformer for details
  return InvalidXMLError;
})(_es6Error2['default']);

exports.InvalidXMLError = InvalidXMLError;

var S3Error = (function (_ExtendableError15) {
  _inherits(S3Error, _ExtendableError15);

  function S3Error(message) {
    _classCallCheck(this, S3Error);

    _get(Object.getPrototypeOf(S3Error.prototype), 'constructor', this).call(this, message);
  }

  return S3Error;
})(_es6Error2['default']);

exports.S3Error = S3Error;
//# sourceMappingURL=errors.js.map
