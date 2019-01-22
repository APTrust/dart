"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

function _core() {
  const data = require("@babel/core");

  _core = function () {
    return data;
  };

  return data;
}

var _minimalVisitor = _interopRequireDefault(require("./minimalVisitor"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const updateTopicReferenceVisitor = {
  PipelinePrimaryTopicReference(path) {
    path.replaceWith(this.topicId);
  },

  AwaitExpression(path) {
    throw path.buildCodeFrameError("await is not supported inside pipeline expressions yet");
  },

  YieldExpression(path) {
    throw path.buildCodeFrameError("yield is not supported inside pipeline expressions yet");
  },

  PipelineTopicExpression(path) {
    path.skip();
  }

};
const smartVisitor = Object.assign({}, _minimalVisitor.default, {
  PipelineTopicExpression(path) {
    const topicId = path.scope.generateUidIdentifier("topic");
    path.traverse(updateTopicReferenceVisitor, {
      topicId
    });

    const arrowFunctionExpression = _core().types.arrowFunctionExpression([topicId], path.node.expression);

    path.replaceWith(arrowFunctionExpression);
  },

  PipelineBareFunction(path) {
    path.replaceWith(path.node.callee);
  }

});
var _default = smartVisitor;
exports.default = _default;