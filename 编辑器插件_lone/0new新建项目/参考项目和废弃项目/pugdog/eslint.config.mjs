import coffeePlugin from "eslint-plugin-coffee";

export default [
  {
    files: ["**/*.coffee"],
    languageOptions: {
      parser: "coffeescript",
    },
    plugins: {
      coffee: coffeePlugin,
    },
    rules: {
      "coffee/no-debugger": "error",
      "coffee/no-unused-vars": "warn",
      "coffee/indent": ["error", 2],
    },
  },
];