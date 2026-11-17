#!/usr/bin/env python3
# 由 index.html 机械生成归档页，禁止手写归档内容（手写 42KB 极易漂移、漏标签）。
# 用法：python3 tools/make_archive.py index.html 2026-11-17
# 输出：archive/2026-11-17.html
# 规则：仅两处改动 —— ①<head> 后插 <base href='../'>；②<title> 改为归档标题。其余字符一个不动。
import os
import re
import sys

BASE_TAG = "<base href='../'>"


def build(index_path, date_str, out_path=None):
    raw = open(index_path, encoding='utf-8').read()
    # 1 head 后插 base（仅在缺失时）
    if BASE_TAG not in raw:
        m = re.search(r'<head[^>]*>', raw, re.I)
        if not m:
            raise SystemExit('index.html 找不到 <head>，拒绝生成')
        raw = raw[:m.end()] + '\n' + BASE_TAG + raw[m.end():]
    # 2 title
    new_title = '%s 归档 · 体育与运动品牌动态' % date_str
    raw, n = re.subn(r'<title>[^<]*</title>', '<title>%s</title>' % new_title, raw, count=1)
    if n != 1:
        raise SystemExit('index.html 找不到 <title>，拒绝生成')
    # 3 相对路径自检：归档页 base 为 ../，故 history.js 必须不带 ../ 前缀
    if "src='../history.js'" in raw:
        raw = raw.replace("src='../history.js'", "src='history.js'")
    if out_path is None:
        out_path = os.path.join('archive', date_str + '.html')
    os.makedirs(os.path.dirname(out_path) or '.', exist_ok=True)
    open(out_path, 'w', encoding='utf-8').write(raw)
    print('WROTE %s  %d chars' % (out_path, len(raw)))
    return out_path


if __name__ == '__main__':
    if len(sys.argv) < 3:
        raise SystemExit('用法：python3 tools/make_archive.py index.html YYYY-MM-DD')
    build(sys.argv[1], sys.argv[2], sys.argv[3] if len(sys.argv) > 3 else None)
