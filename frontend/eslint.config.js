import react from "eslint-plugin-react";
import jsxA11Y from "eslint-plugin-jsx-a11y";
import js from "@eslint/js";
import globals from "globals";
import noCommentedCode from "eslint-plugin-no-commented-code";

export default [
  js.configs.recommended,
  react.configs.flat.recommended,
  jsxA11Y.flatConfigs.recommended,

  {
    files: [ "**/*.jsx", "**/*.js" ],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",

      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },

      globals: {
        ...globals.node,
        ...globals.mocha,
        ...globals.browser,
      },
    },

    settings: {
      react: {
        version: "detect",
      },
    },

    plugins: {
      react,
      "no-commented-code": noCommentedCode,
    },

    rules: {
      "indent": [
        "error",
        2,
        {
          "MemberExpression": 1,
          "SwitchCase": 1
        }
      ],

      "linebreak-style": [
        "error",
        "unix"
      ],

      "quotes": [
        "error", "double", {
          "avoidEscape": true,
          "allowTemplateLiterals": true
        }
      ],

      "semi": [
        "error",
        "always"
      ],

      "space-before-blocks": [
        "error",
        "always"
      ],

      "comma-spacing": [
        "error",
        { "before": false, "after": true }
      ],

      "comma-style": [
        "error", "last"
      ],

      "comma-dangle": "off",

      "key-spacing": [
        "error", {
          "afterColon": true,
          "mode": "strict",
        }
      ],

      "prefer-const": [
        "off",
      ],

      "no-var": "error",
      "prefer-arrow-callback": "error",

      "arrow-spacing": [
        "error",
        { "before": true, "after": true }
      ],

      "space-infix-ops": [
        "error"
      ],

      "keyword-spacing": [
        "error", {
          "after": true
        }
      ],

      "semi-spacing": [
        "error",
        {
          "after": true
        }
      ],

      "object-shorthand": [ "error", "properties" ],
      "eqeqeq": [ "error", "always" ],
      "no-trailing-spaces": [ "error" ],
      "eol-last": [ "error", "always" ],
      "no-case-declarations": [ "off" ],
      "object-curly-spacing": [ "error", "always" ],

      "array-bracket-spacing": [ "error", "always", {
        "objectsInArrays": false,
        "arraysInArrays": false
      }],

      "space-in-parens": [ "error" ],

      "no-multiple-empty-lines": [ "error", {
        "max": 1,
        "maxBOF": 1
      }],

      "newline-per-chained-call": "off",
      "brace-style": [ 2 ],

      "space-before-function-paren": [ "error", {
        "named": "never",
        "anonymous": "never",
        "asyncArrow": "always"
      }],

      "react/display-name": 0,
      "react/prop-types": 0,
      "react/jsx-filename-extension": [ "error" ],

      "no-commented-code/no-commented-code": "error",
    },
  }
];