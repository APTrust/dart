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

const minimalVisitor = {
  BinaryExpression: {
    exit(path) {
      const {
        scope
      } = path;
      const {
        node
      } = path;
      const {
        operator,
        left
      } = node;
      let {
        right
      } = node;
      if (operator !== "|>") return;
      let optimizeArrow = _core().types.isArrowFunctionExpression(right) && _core().types.isExpression(right.body) && !right.async && !right.generator;
      let param;

      if (optimizeArrow) {
        const {
          params
        } = right;

        if (params.length === 1 && _core().types.isIdentifier(params[0])) {
          param = params[0];
        } else if (params.length > 0) {
          optimizeArrow = false;
        }
      } else if (_core().types.isIdentifier(right, {
        name: "eval"
      })) {
        right = _core().types.sequenceExpression([_core().types.numericLiteral(0), right]);
      }

      if (optimizeArrow && !param) {
        path.replaceWith(_core().types.sequenceExpression([left, right.body]));
        return;
      }

      const placeholder = scope.generateUidIdentifierBasedOnNode(param || left);
      scope.push({
        id: placeholder
      });

      if (param) {
        path.get("right").scope.rename(param.name, placeholder.name);
      }

      const call = optimizeArrow ? right.body : _core().types.callExpression(right, [_core().types.cloneNode(placeholder)]);
      path.replaceWith(_core().types.sequenceExpression([_core().types.assignmentExpression("=", _core().types.cloneNode(placeholder), left), call]));
    }

  }
};
var _default = minimalVisitor;
exports.default = _default;