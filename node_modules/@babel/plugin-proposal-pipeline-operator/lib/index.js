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

function _pluginSyntaxPipelineOperator() {
  const data = _interopRequireDefault(require("@babel/plugin-syntax-pipeline-operator"));

  _pluginSyntaxPipelineOperator = function () {
    return data;
  };

  return data;
}

var _minimalVisitor = _interopRequireDefault(require("./minimalVisitor"));

var _smartVisitor = _interopRequireDefault(require("./smartVisitor"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const visitorsPerProposal = {
  minimal: _minimalVisitor.default,
  smart: _smartVisitor.default
};

var _default = (0, _helperPluginUtils().declare)((api, options) => {
  api.assertVersion(7);
  return {
    name: "proposal-pipeline-operator",
    inherits: _pluginSyntaxPipelineOperator().default,
    visitor: visitorsPerProposal[options.proposal]
  };
});

exports.default = _default;