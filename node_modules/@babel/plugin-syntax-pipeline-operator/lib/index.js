"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = exports.proposals = void 0;

function _helperPluginUtils() {
  const data = require("@babel/helper-plugin-utils");

  _helperPluginUtils = function () {
    return data;
  };

  return data;
}

const proposals = ["minimal", "smart"];
exports.proposals = proposals;

var _default = (0, _helperPluginUtils().declare)((api, {
  proposal
}) => {
  api.assertVersion(7);

  if (typeof proposal !== "string" || !proposals.includes(proposal)) {
    throw new Error("The pipeline operator plugin requires a 'proposal' option." + "'proposal' must be one of: " + proposals.join(", ") + ". More details: https://babeljs.io/docs/en/next/babel-plugin-proposal-pipeline-operator");
  }

  return {
    name: "syntax-pipeline-operator",

    manipulateOptions(opts, parserOpts) {
      parserOpts.plugins.push(["pipelineOperator", {
        proposal
      }]);
    }

  };
});

exports.default = _default;