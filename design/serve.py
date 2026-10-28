"""运行最终设计原型；只使用 Python 标准库和本地 Git 对象。"""

import argparse
from contextlib import ExitStack
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
import json
from pathlib import Path
import subprocess
import tempfile
from urllib.parse import quote, unquote, urlparse
from zipfile import ZipFile


DESIGN = Path(__file__).resolve().parent
PROTOTYPE = DESIGN / 'prototype'
REPOSITORY = DESIGN.parent


def export_resources(destination):
    snapshot = json.loads((PROTOTYPE / 'snapshot.json').read_text(encoding='utf-8'))
    revision = snapshot['resourceRevision']
    archive = destination / 'resources.zip'
    print(f'正在导出原型资源：{revision[:8]}…', flush=True)
    try:
        subprocess.run(
            ['git', 'archive', '--format=zip', f'--output={archive}', revision, '--',
             'lib', 'web-static', 'errpage', 'README.md', 'LICENSE', 'test.css',
             'favicon.ico', '404.html', 'updatelog.md'],
            cwd=REPOSITORY, check=True, capture_output=True,
        )
    except (subprocess.CalledProcessError, FileNotFoundError) as error:
        raise RuntimeError(
            '无法读取固定的旧版提交。请安装 Git 并执行 git fetch origin legacy，'
            '或通过 --resources 指定旧版资源目录。'
        ) from error
    resources = destination / 'resources'
    resources.mkdir()
    with ZipFile(archive) as bundle:
        for entry in bundle.infolist():
            target = (resources / entry.filename).resolve()
            if not target.is_relative_to(resources.resolve()):
                raise RuntimeError('归档中存在无效路径。')
        bundle.extractall(resources)
    archive.unlink()
    return resources.resolve()


def handler_for(resources):
    class Handler(SimpleHTTPRequestHandler):
        def __init__(self, *args, **kwargs):
            super().__init__(*args, directory=str(PROTOTYPE), **kwargs)

        def translate_path(self, path):
            clean = unquote(urlparse(path).path)
            if clean.startswith('/_moecdn/'):
                candidate = (PROTOTYPE / clean[len('/_moecdn/'):]).resolve()
                if candidate.is_relative_to(PROTOTYPE) and candidate.is_file():
                    return str(candidate)
            else:
                candidate = (resources / clean.lstrip('/')).resolve()
                if candidate.is_relative_to(resources) and '.git' not in candidate.parts:
                    if candidate.is_file():
                        return str(candidate)
                    if candidate.is_dir():
                        return str(PROTOTYPE / 'index.html')
            return str(PROTOTYPE / '__not_found__')

        def send_head(self):
            parsed = urlparse(self.path)
            clean = unquote(parsed.path)
            candidate = (resources / clean.lstrip('/')).resolve()
            if (not clean.startswith('/_moecdn/')
                    and candidate.is_relative_to(resources)
                    and '.git' not in candidate.parts
                    and candidate.is_dir() and not clean.endswith('/')):
                self.send_response(308)
                self.send_header('Location', quote(clean, safe='/') + '/'
                                 + ('?' + parsed.query if parsed.query else ''))
                self.end_headers()
                return None
            return super().send_head()

        def end_headers(self):
            self.send_header('Cache-Control', 'no-store')
            if 'download=1' in self.path:
                self.send_header('Content-Disposition', 'attachment')
            super().end_headers()

        def log_message(self, *_args):
            pass

    return Handler


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--port', type=int, default=4178, help='本地端口，默认 4178')
    parser.add_argument('--resources', type=Path, help='使用现成的旧版资源目录')
    args = parser.parse_args()
    with ExitStack() as stack:
        if args.resources:
            resources = args.resources.resolve()
            if not resources.is_dir():
                parser.error('--resources 必须是已存在的目录')
        else:
            temporary = stack.enter_context(tempfile.TemporaryDirectory(prefix='moecdn-design-'))
            try:
                resources = export_resources(Path(temporary))
            except RuntimeError as error:
                parser.error(str(error))
        server = stack.enter_context(ThreadingHTTPServer(('127.0.0.1', args.port), handler_for(resources)))
        print(f'http://127.0.0.1:{args.port}/', flush=True)
        try:
            server.serve_forever()
        except KeyboardInterrupt:
            pass


if __name__ == '__main__':
    main()
