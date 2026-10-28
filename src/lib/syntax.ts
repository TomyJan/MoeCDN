// 预览识别与高亮共用此表，避免有语言映射却无法进入文本预览。
const extensions: Record<string, string[]> = {
  javascript: ['js', 'mjs', 'cjs', 'jsx'],
  typescript: ['ts', 'mts', 'cts', 'tsx'],
  css: ['css', 'pcss', 'postcss'],
  less: ['less'],
  scss: ['scss', 'sass'],
  xml: [
    'xml',
    'html',
    'htm',
    'xhtml',
    'xht',
    'xsd',
    'xsl',
    'xslt',
    'rss',
    'atom',
    'vue',
    'svelte',
  ],
  markdown: ['md', 'markdown', 'mdown', 'mkd', 'mdx'],
  json: ['json', 'jsonc', 'json5', 'map', 'geojson', 'ipynb', 'webmanifest'],
  yaml: ['yaml', 'yml'],
  ini: ['ini', 'conf', 'cfg', 'cnf', 'toml'],
  bash: ['sh', 'bash', 'zsh', 'ksh'],
  shell: ['shell'],
  powershell: ['ps1', 'psm1', 'psd1'],
  dos: ['bat', 'cmd'],
  python: ['py', 'pyw', 'pyi', 'python'],
  php: ['php', 'php3', 'php4', 'php5', 'php7', 'php8', 'phtml'],
  sql: ['sql'],
  c: ['c', 'h'],
  cpp: ['cc', 'cpp', 'cxx', 'c++', 'hh', 'hpp', 'hxx', 'ino'],
  csharp: ['cs', 'csx'],
  java: ['java'],
  kotlin: ['kt', 'kts'],
  go: ['go'],
  rust: ['rs'],
  ruby: ['rb', 'rake', 'gemspec'],
  perl: ['pl', 'pm', 'perl'],
  lua: ['lua'],
  r: ['r'],
  swift: ['swift'],
  objectivec: ['m', 'mm'],
  graphql: ['graphql', 'gql'],
  diff: ['diff', 'patch'],
  makefile: ['mk', 'mak', 'makefile'],
  cmake: ['cmake'],
  dockerfile: ['dockerfile', 'containerfile'],
  properties: ['properties'],
  nginx: ['nginx'],
  apache: ['htaccess'],
  groovy: ['groovy', 'gradle'],
  dart: ['dart'],
  scala: ['scala', 'sc'],
  elixir: ['ex', 'exs'],
  erlang: ['erl', 'hrl'],
  haskell: ['hs', 'lhs'],
  clojure: ['clj', 'cljs', 'cljc', 'edn'],
  latex: ['tex', 'latex', 'sty', 'cls'],
  wasm: ['wat', 'wast'],
};
const languages = new Map(
  Object.entries(extensions).flatMap(([language, suffixes]) =>
    suffixes.map((suffix) => [suffix, language] as const),
  ),
);
const plainExtensions = new Set([
  'txt',
  'text',
  'log',
  'csv',
  'tsv',
  'lrc',
  'srt',
  'vtt',
  'po',
  'pot',
  'ftl',
  'ejs',
  'hbs',
  'mustache',
  'njk',
  'twig',
  'liquid',
  'lock',
  'env',
  'gitignore',
  'gitattributes',
  'editorconfig',
  'npmrc',
  'nvmrc',
  'browserslistrc',
]);

export function syntaxLanguage(extension: string) {
  return languages.get(extension.trim().replace(/^\./, '').toLowerCase());
}

export function sourceFormat(name: string) {
  const lower = name.toLowerCase();
  const extension = lower.split('.').pop() || '';
  let language = syntaxLanguage(extension);
  if (/^(?:dockerfile|containerfile)(?:\..+)?$/.test(lower))
    language = 'dockerfile';
  else if (/^(?:gnu)?makefile$/.test(lower)) language = 'makefile';
  else if (lower === 'cmakelists.txt') language = 'cmake';
  else if (/^(?:gemfile|rakefile)$/.test(lower)) language = 'ruby';
  else if (lower === 'jenkinsfile') language = 'groovy';
  else if (
    /^\.(?:bash|zsh|ksh)(?:rc|_profile|_login)$/.test(lower) ||
    lower === '.profile'
  )
    language = 'bash';
  else if (/^\.env(?:\..+)?$/.test(lower) || lower === '.gitconfig')
    language = 'ini';
  const text =
    Boolean(language) ||
    plainExtensions.has(extension) ||
    /^(?:license|licence|copying|notice|authors|contributors|changelog|changes|version)(?:[._-].+)?$/.test(
      lower,
    );
  const document = /^(?:html?|xhtml|xht)$/.test(extension)
    ? 'html'
    : /^(?:md|markdown|mdown|mkd)$/.test(extension)
      ? 'markdown'
      : undefined;
  return { text, language, document };
}
