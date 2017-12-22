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
exports.parseBucketPolicy = parseBucketPolicy;
exports.generateBucketPolicy = generateBucketPolicy;
exports.isValidBucketPolicy = isValidBucketPolicy;

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj['default'] = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _errors = require('./errors');

var errors = _interopRequireWildcard(_errors);

var _helpers = require('./helpers');

var Policy = {
  NONE: 'none',
  READONLY: 'readonly',
  WRITEONLY: 'writeonly',
  READWRITE: 'readwrite'
};

exports.Policy = Policy;
var resourcePrefix = 'arn:aws:s3:::';

var readActions = {
  bucket: ['s3:GetBucketLocation'],
  object: ['s3:GetObject']
};

var writeActions = {
  bucket: ['s3:GetBucketLocation', 's3:ListBucketMultipartUploads'],
  object: ['s3:AbortMultipartUpload', 's3:DeleteObject', 's3:ListMultipartUploadParts', 's3:PutObject']
};

// Returns the string version of the bucket policy.

function parseBucketPolicy(policy, bucketName, objectPrefix) {
  var statements = policy.Statement;

  // If there are no statements, it's none.
  if (statements.length === 0) return Policy.NONE;

  var bucketResource = '' + resourcePrefix + bucketName;
  var objectResource = '' + resourcePrefix + bucketName + '/' + objectPrefix;

  var actions = {
    bucket: [],
    object: []
  };

  // Loop through the statements and aggregate actions which are allowed.
  for (var i = 0; i < statements.length; i++) {
    var statement = statements[i];

    // Normalize the statement, as AWS will drop arrays with length 1.
    statement = normalizeStatement(statement);

    // Verify the statement before we union-ize the actions.
    if (!_lodash2['default'].some(statement.Principal.AWS, function (value) {
      return value == '*';
    })) continue;
    if (statement.Effect != 'Allow') continue;

    // Check for object actions or bucket actions, depending on the resource.
    if (pertainsTo(statement, objectResource)) {
      actions.object = _lodash2['default'].union(actions.object, statement.Action);
    } else if (pertainsTo(statement, bucketResource)) {
      actions.bucket = _lodash2['default'].union(actions.bucket, statement.Action);
    }
  }

  // Check for permissions.
  var canRead = false;
  var canWrite = false;

  // If it has a subarray inside, there are full permissions to either
  // read, write, or both.
  if (isSubArrayOf(actions.bucket, writeActions.bucket) && isSubArrayOf(actions.object, writeActions.object)) {
    canWrite = true;
  }

  if (isSubArrayOf(actions.bucket, readActions.bucket) && isSubArrayOf(actions.object, readActions.object)) {
    canRead = true;
  }

  if (canRead && canWrite) return Policy.READWRITE;else if (canRead) return Policy.READONLY;else if (canWrite) return Policy.WRITEONLY;else return Policy.NONE;
}

// Generate a statement payload to submit to S3 based on the given policy.

function generateBucketPolicy(policy, bucketName, objectPrefix) {
  if (!(0, _helpers.isValidBucketName)(bucketName)) {
    throw new errors.InvalidBucketNameError('Invalid bucket name: ' + bucketName);
  }
  if (!isValidBucketPolicy(policy)) {
    throw new errors.InvalidBucketPolicyError('Invalid bucket policy: ' + policy + '(must be \'none\', \'readonly\', \'writeonly\', or \'readwrite\')');
  }

  // Merge the actions together based on the given policy.
  var actions = {
    bucket: [],
    object: []
  };

  if (policy == Policy.READONLY || policy == Policy.READWRITE) {
    // Do read statements.
    actions.bucket = _lodash2['default'].concat(actions.bucket, readActions.bucket);
    actions.object = _lodash2['default'].concat(actions.object, readActions.object);
  }

  if (policy == Policy.WRITEONLY || policy == Policy.READWRITE) {
    // Do write statements.
    actions.bucket = _lodash2['default'].concat(actions.bucket, writeActions.bucket);
    actions.object = _lodash2['default'].concat(actions.object, writeActions.object);
  }

  // Drop any duplicated actions.
  actions.bucket = _lodash2['default'].uniq(actions.bucket);
  actions.object = _lodash2['default'].uniq(actions.object);

  // Form statements from the actions. We'll create three statements:
  // one for basic bucket permissions, one for basic object permissions,
  // and finally a special statement for ListBucket, which should be
  // handled separately.
  var statements = [];

  if (actions.bucket.length > 0) {
    statements.push(createStatement(actions.bucket, '' + resourcePrefix + bucketName));
  }

  if (actions.object.length > 0) {
    statements.push(createStatement(actions.object, '' + resourcePrefix + bucketName + '/' + objectPrefix + '*'));
  }

  // If reading permission is on, add ListBucket.
  if (policy == Policy.READONLY || policy == Policy.READWRITE) {
    var listBucketStatement = createStatement(['s3:ListBucket'], '' + resourcePrefix + bucketName);

    // It has a condition on it if there is a prefix, thus we do it separately.
    if (objectPrefix !== '') {
      listBucketStatement.Condition = { StringEquals: { 's3:prefix': objectPrefix } };
    }

    statements.push(listBucketStatement);
  }

  // s3 requires a wrapper around the statements.
  return {
    'Version': '2012-10-17',
    'Statement': statements
  };
}

function isValidBucketPolicy(policy) {
  return policy == Policy.NONE || policy == Policy.READONLY || policy == Policy.WRITEONLY || policy == Policy.READWRITE;
}

// Checks to see if the parent array has all the values in the child array.
// Take the intersection for both. If the lengths are the same, the contents
// of the child are inside the parent.
function isSubArrayOf(parent, child) {
  return _lodash2['default'].intersection(parent, child).length == child.length;
}

// Checks if the statement pertains to the given resource. Returns a boolean.
function pertainsTo(statement, resource) {
  var resources = statement.Resource;

  for (var i = 0; i < resources.length; i++) {
    if (_lodash2['default'].startsWith(resources[i], resource)) return true;
  }

  return false;
}

// Create an s3 Allow Statement.
function createStatement(action, resource) {
  return {
    Sid: '',
    Effect: 'Allow',
    Principal: { 'AWS': ['*'] },
    Action: action,
    Resource: [resource]
  };
}

// AWS will sometimes drop arrays of length 1 for their values, so normalize
// these back to arrays with length 1.
function normalizeStatement(statement) {
  if (typeof statement.Principal.AWS === 'string') statement.Principal.AWS = [statement.Principal.AWS];

  if (typeof statement.Action === 'string') statement.Action = [statement.Action];

  if (typeof statement.Resource === 'string') statement.Resource = [statement.Resource];

  return statement;
}
//# sourceMappingURL=bucket-policy.js.map
