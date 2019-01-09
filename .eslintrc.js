module.exports = {
  extends: "eslint:recommended",
  parserOptions: {
    ecmaVerion: 2017
  },
  env: {
    browser: true,
    node: true,
    es6: true
  },
  parser: 'babel-eslint',
  rules: {
    'no-console': 'off'
  }
}