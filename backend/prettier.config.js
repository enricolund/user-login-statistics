module.exports = {
  // DEFAULT CONFIGURATIONS
  parser: "typescript",
  printWidth: 100,
  semi: true,
  tabWidth: 2,
  trailingComma: "all",
  singleQuote: true,

  // PLUG-IN CONFIGURATIONS
  plugins: ["@trivago/prettier-plugin-sort-imports"],
  importOrder: [
    "<THIRD_PARTY_MODULES>",
    "^@ORGANIZATION/PROJECT-api(.*)$",
    "^[./]",
  ],
  importOrderSeparation: true,
  importOrderSortSpecifiers: true,
  importOrderParserPlugins: ["decorators-legacy", "typescript"],
};
