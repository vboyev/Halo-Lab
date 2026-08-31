"""Package a built Stay case for the repository's GitHub Pages subdirectory."""
import html
import hashlib
import pathlib
import posixpath
import re
import sys
from urllib.parse import urlsplit

source = pathlib.Path(sys.argv[1]).resolve()
preview_name = sys.argv[3] if len(sys.argv) > 3 else 'stay-preview'
entry = sys.argv[2] if len(sys.argv) > 2 else 'project/stay/index.html'
output = pathlib.Path(__file__).resolve().parents[1] / preview_name
prefix = f'/Halo-Lab/{preview_name}/'
pending = set()
copied = set()

def asset(value, relative_to=''):
    parsed = urlsplit(html.unescape(value))
    if parsed.scheme or parsed.netloc or not parsed.path or value.startswith('#'):
        return value
    path = parsed.path
    if path.startswith('/'):
        path = path.lstrip('/')
    elif relative_to:
        path = posixpath.normpath(posixpath.join(relative_to, path))
    else:
        path = path.removeprefix('../../').removeprefix('../')
    suffix = ('?' + parsed.query if parsed.query else '') + ('#' + parsed.fragment if parsed.fragment else '')
    if (source / path).is_file():
        pending.add(path)
        if path.endswith(('.css', '.js')):
            version = hashlib.sha256((source / path).read_bytes()).hexdigest()[:12]
            query = parsed.query + ('&' if parsed.query else '') + 'v=' + version
            suffix = '?' + query + ('#' + parsed.fragment if parsed.fragment else '')
        return prefix + path + suffix
    return 'https://www.halo-lab.com/' + path + suffix

page = (source / entry).read_text()
page = page.replace('<base href="/">', f'<base href="{prefix}">')
page = page.replace('<head>', '<head>\n  <meta name="robots" content="noindex, nofollow">', 1)
# Keep this public preview out of production analytics.
page = re.sub(r'<script[^>]+src="/js/global/gtm-country.js"[^>]*></script>', '', page)
page = re.sub(r'<noscript>\s*<iframe[^>]+googletagmanager[^>]*></iframe>\s*</noscript>', '', page)

def rewrite_tag(match):
    tag = match.group()
    if tag.startswith('<base'):
        return tag
    def rewrite_attr(match):
        name, quote, value = match.groups()
        if name == 'href' and tag.startswith('<a'):
            parsed = urlsplit(html.unescape(value))
            if parsed.scheme or parsed.netloc or value.startswith('#'):
                return match.group()
            path = parsed.path.removeprefix('../../').removeprefix('../').lstrip('/')
            path = '' if path == 'index.html' else path.removesuffix('.html')
            value = 'https://www.halo-lab.com/' + path + ('#' + parsed.fragment if parsed.fragment else '')
        elif name == 'srcset':
            value = ', '.join(' '.join([asset(part.split()[0]), *part.split()[1:]]) for part in value.split(',') if part.strip())
        else:
            value = asset(value)
        return f'{name}={quote}{value}{quote}'
    return re.sub(r'\b(src|srcset|poster|data-src|href)=([\"\x27])(.*?)\2', rewrite_attr, tag)

page = re.sub(r'<[^>]+>', rewrite_tag, page)
output.mkdir(exist_ok=True)
(output / 'index.html').write_text('\n'.join(line.rstrip() for line in page.splitlines()) + '\n')
while pending:
    path = pending.pop()
    if path in copied:
        continue
    copied.add(path)
    target = output / path
    target.parent.mkdir(parents=True, exist_ok=True)
    data = (source / path).read_bytes()
    if path == 'js/pages/detail-projects3.js':
        # The legacy authenticated sizing request must never enter a public preview.
        # Embedded players retain their original dimensions and responsive CSS.
        code = data.decode()
        start = code.index('  // aspect retio of vimeo')
        end = code.index('  // move images to blockquote', start)
        data = (code[:start] + code[end:]).encode()
    if path == 'js/templates/project.js':
        code = data.decode()
        start = code.index('      // Check if the video URL contains "vimeo.com"')
        end = code.index('      let thisMedia', start)
        data = (code[:start] + code[end:]).encode()
    if path.endswith('.css'):
        css = data.decode()
        css = re.sub(r'url\(\s*([\"\x27]?)([^)\"\x27]+)\1\s*\)',
                     lambda m: 'url("' + asset(m[2], posixpath.dirname(path)) + '")', css)
        data = css.encode()
    target.write_bytes(data)
print(f'Packaged {len(copied)} assets, {sum((output / p).stat().st_size for p in copied) / 1048576:.1f} MiB')
