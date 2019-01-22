"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

function _helperPluginUtils() {
  const data = require("@babel/helper-plugin-utils");

  _helperPluginUtils = function () {
    return data;
  };

  return data;
}

function _pluginSyntaxLogicalAssignmentOperators() {
  const data = _interopRequireDefault(require("@babel/plugin-syntax-logical-assignment-operators"));

  _pluginSyntaxLogicalAssignmentOperators = function () {
    return data;
  };

  return data;
}

function _core() {
  const data = require("@babel/core");

  _core = function () {
    return data;
  };

  return data;
}

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var _default = (0, _helperPluginUtils().declare)(api => {
  api.assertVersion(7);
  return {
    name: "proposal-logical-assignment-operators",
    inherits: _pluginSyntaxLogicalAssignmentOperators().default,
    visitor: {
      AssignmentExpression(path) {
        const {
          node,
          scope
        } = path;
        const {
          operator,
          left,
          right
        } = node;

        if (operator !== "||=" && operator !== "&&=" && operator !== "??=") {
          return;
        }

        const lhs = _core().types.cloneNode(left);

        if (_core().types.isMemberExpression(left)) {
          const {
            object,
            property,
            computed
          } = left;
          const memo = scope.maybeGenerateMemoised(object);

          if (memo) {
            left.object = memo;
            lhs.object = _core().types.assignmentExpression("=", _core().types.cloneNode(memo), object);
          }

          if (computed) {
            const memo = scope.maybeGenerateMemoised(property);

            if (memo) {
              left.property = memo;
              lhs.property = _core().types.assignmentExpression("=", _core().types.cloneNode(memo), property);
            }
          }
        }

        path.replaceWith(_core().types.logicalExpression(operator.slice(0, -1), lhs, _core().types.assignmentExpression("=", left, right)));
      }

    }
  };
});

exports.default = _default;