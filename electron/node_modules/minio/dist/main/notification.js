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

var _get = function get(_x, _x2, _x3) { var _again = true; _function: while (_again) { var object = _x, property = _x2, receiver = _x3; _again = false; if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { _x = parent; _x2 = property; _x3 = receiver; _again = true; desc = parent = undefined; continue _function; } } else if ('value' in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } } };

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj['default'] = obj; return newObj; } }

function _inherits(subClass, superClass) { if (typeof superClass !== 'function' && superClass !== null) { throw new TypeError('Super expression must either be null or a function, not ' + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var _events = require('events');

var _transformers = require('./transformers');

var transformers = _interopRequireWildcard(_transformers);

var _helpers = require('./helpers');

// Notification config - array of target configs.
// Target configs can be
// 1. Topic (simple notification service)
// 2. Queue (simple queue service)
// 3. CloudFront (lambda function)

var NotificationConfig = (function () {
  function NotificationConfig() {
    _classCallCheck(this, NotificationConfig);
  }

  // Base class for three supported configs.

  _createClass(NotificationConfig, [{
    key: 'add',
    value: function add(target) {
      var instance = '';
      if (target instanceof TopicConfig) {
        instance = 'TopicConfiguration';
      }
      if (target instanceof QueueConfig) {
        instance = 'QueueConfiguration';
      }
      if (target instanceof CloudFunctionConfig) {
        instance = 'CloudFunctionConfiguration';
      }
      if (!this[instance]) this[instance] = [];
      this[instance].push(target);
    }
  }]);

  return NotificationConfig;
})();

exports.NotificationConfig = NotificationConfig;

var TargetConfig = (function () {
  function TargetConfig() {
    _classCallCheck(this, TargetConfig);
  }

  // 1. Topic (simple notification service)

  _createClass(TargetConfig, [{
    key: 'setId',
    value: function setId(id) {
      this.Id = id;
    }
  }, {
    key: 'addEvent',
    value: function addEvent(newevent) {
      if (!this.Event) this.Event = [];
      this.Event.push(newevent);
    }
  }, {
    key: 'addFilterSuffix',
    value: function addFilterSuffix(suffix) {
      if (!this.Filter) this.Filter = { S3Key: { FilterRule: [] } };
      this.Filter.S3Key.FilterRule.push({ Name: "suffix", Value: suffix });
    }
  }, {
    key: 'addFilterPrefix',
    value: function addFilterPrefix(prefix) {
      if (!this.Filter) this.Filter = { S3Key: { FilterRule: [] } };
      this.Filter.S3Key.FilterRule.push({ Name: "prefix", Value: prefix });
    }
  }]);

  return TargetConfig;
})();

var TopicConfig = (function (_TargetConfig) {
  _inherits(TopicConfig, _TargetConfig);

  function TopicConfig(arn) {
    _classCallCheck(this, TopicConfig);

    _get(Object.getPrototypeOf(TopicConfig.prototype), 'constructor', this).call(this);
    this.Topic = arn;
  }

  // 2. Queue (simple queue service)
  return TopicConfig;
})(TargetConfig);

exports.TopicConfig = TopicConfig;

var QueueConfig = (function (_TargetConfig2) {
  _inherits(QueueConfig, _TargetConfig2);

  function QueueConfig(arn) {
    _classCallCheck(this, QueueConfig);

    _get(Object.getPrototypeOf(QueueConfig.prototype), 'constructor', this).call(this);
    this.Queue = arn;
  }

  // 3. CloudFront (lambda function)
  return QueueConfig;
})(TargetConfig);

exports.QueueConfig = QueueConfig;

var CloudFunctionConfig = (function (_TargetConfig3) {
  _inherits(CloudFunctionConfig, _TargetConfig3);

  function CloudFunctionConfig(arn) {
    _classCallCheck(this, CloudFunctionConfig);

    _get(Object.getPrototypeOf(CloudFunctionConfig.prototype), 'constructor', this).call(this);
    this.CloudFunction = arn;
  }

  return CloudFunctionConfig;
})(TargetConfig);

exports.CloudFunctionConfig = CloudFunctionConfig;
var buildARN = function buildARN(partition, service, region, accountId, resource) {
  return "arn:" + partition + ":" + service + ":" + region + ":" + accountId + ":" + resource;
};

exports.buildARN = buildARN;
var ObjectCreatedAll = "s3:ObjectCreated:*";
exports.ObjectCreatedAll = ObjectCreatedAll;
var ObjectCreatedPut = "s3:ObjectCreated:Put";
exports.ObjectCreatedPut = ObjectCreatedPut;
var ObjectCreatedPost = "s3:ObjectCreated:Post";
exports.ObjectCreatedPost = ObjectCreatedPost;
var ObjectCreatedCopy = "s3:ObjectCreated:Copy";
exports.ObjectCreatedCopy = ObjectCreatedCopy;
var ObjectCreatedCompleteMultipartUpload = "sh:ObjectCreated:CompleteMultipartUpload";
exports.ObjectCreatedCompleteMultipartUpload = ObjectCreatedCompleteMultipartUpload;
var ObjectRemovedAll = "s3:ObjectRemoved:*";
exports.ObjectRemovedAll = ObjectRemovedAll;
var ObjectRemovedDelete = "s3:ObjectRemoved:Delete";
exports.ObjectRemovedDelete = ObjectRemovedDelete;
var ObjectRemovedDeleteMarkerCreated = "s3:ObjectRemoved:DeleteMarkerCreated";
exports.ObjectRemovedDeleteMarkerCreated = ObjectRemovedDeleteMarkerCreated;
var ObjectReducedRedundancyLostObject = "s3:ReducedRedundancyLostObject";

exports.ObjectReducedRedundancyLostObject = ObjectReducedRedundancyLostObject;
// Poll for notifications, used in #listenBucketNotification.
// Listening constitutes repeatedly requesting s3 whether or not any
// changes have occurred.

var NotificationPoller = (function (_EventEmitter) {
  _inherits(NotificationPoller, _EventEmitter);

  function NotificationPoller(client, bucketName, prefix, suffix, events) {
    _classCallCheck(this, NotificationPoller);

    _get(Object.getPrototypeOf(NotificationPoller.prototype), 'constructor', this).call(this);

    this.client = client;
    this.bucketName = bucketName;
    this.prefix = prefix;
    this.suffix = suffix;
    this.events = events;

    this.ending = false;
  }

  // Starts the polling.

  _createClass(NotificationPoller, [{
    key: 'start',
    value: function start() {
      var _this = this;

      this.ending = false;

      process.nextTick(function () {
        _this.checkForChanges();
      });
    }

    // Stops the polling.
  }, {
    key: 'stop',
    value: function stop() {
      this.ending = true;
    }
  }, {
    key: 'checkForChanges',
    value: function checkForChanges() {
      var _this2 = this;

      // Don't continue if we're looping again but are cancelled.
      if (this.ending) return;

      var method = 'GET';
      var queries = [];
      if (this.prefix) {
        var prefix = (0, _helpers.uriEscape)(this.prefix);
        queries.push('prefix=' + prefix);
      }
      if (this.suffix) {
        var suffix = (0, _helpers.uriEscape)(this.suffix);
        queries.push('suffix=' + suffix);
      }
      if (this.events) {
        this.events.forEach(function (s3event) {
          return queries.push('events=' + (0, _helpers.uriEscape)(s3event));
        });
      }
      queries.sort();

      var query = '';
      if (queries.length > 0) {
        query = '' + queries.join('&');
      }
      this.client.makeRequest({ method: method, bucketName: this.bucketName, query: query }, '', 200, '', true, function (e, response) {
        if (e) return _this2.emit('error', e);

        var transformer = transformers.getNotificationTransformer();
        (0, _helpers.pipesetup)(response, transformer).on('data', function (result) {
          // Data is flushed periodically (every 5 seconds), so we should
          // handle it after flushing from the JSON parser.
          var records = result.Records;
          // If null (= no records), change to an empty array.
          if (!records) records = [];

          // Iterate over the notifications and emit them individually.
          records.forEach(function (record) {
            _this2.emit('notification', record);
          });

          // If we're done, stop.
          if (_this2.ending) response.destroy();
        }).on('error', function (e) {
          return _this2.emit('error', e);
        }).on('end', function () {
          // Do it again, if we haven't cancelled yet.
          process.nextTick(function () {
            _this2.checkForChanges();
          });
        });
      });
    }
  }]);

  return NotificationPoller;
})(_events.EventEmitter);

exports.NotificationPoller = NotificationPoller;
//# sourceMappingURL=notification.js.map
