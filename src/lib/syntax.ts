const languages: Record<string, string> = {
  js: 'javascript',
  mjs: 'javascript',
  cjs: 'javascript',
  jsx: 'javascript',
  ts: 'typescript',
  tsx: 'typescript',
  html: 'xml',
  htm: 'xml',
  vue: 'xml',
  svelte: 'xml',
  md: 'markdown',
  yml: 'yaml',
  sh: 'bash',
  py: 'python',
  conf: 'ini',
  toml: 'ini',
  map: 'json',
  css: 'css',
  json: 'json',
  xml: 'xml',
  yaml: 'yaml',
  ini: 'ini',
  php: 'php',
  sql: 'sql',
};

export function syntaxLanguage(extension: string) {
  return languages[extension];
}
