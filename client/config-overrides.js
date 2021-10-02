const {
  removeModuleScopePlugin,
  override,
  babelInclude,
  addWebpackAlias,
} = require('customize-cra')
const path = require('path')

function myOverrides(config) {
  config.module.exprContextCritical = false
  return config
}

module.exports = override(
  myOverrides,
  removeModuleScopePlugin(),
  addWebpackAlias({
    types: path.resolve(__dirname, '../types'),
  }),
  babelInclude([path.resolve('src'), path.resolve('../types')])
)
