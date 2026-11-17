#!/usr/bin/env python3
# 体育日报 HTML 结构闸门：解析真实 DOM 校验层级，防止塌栏/结构损坏页面被推上线。
# 用法：python3 tools/gate.py index.html archive/YYYY-MM-DD.html
# 退出码 0 = 全部通过；1 = 有文件不达标，禁止 push。
import sys
import html5lib
from html5lib import treebuilders


def load(path):
    raw = open(path, encoding='utf-8').read()
    parser = html5lib.HTMLParser(tree=treebuilders.getTreeBuilder('etree'),
                                namespaceHTMLElements=False)
    return raw, parser.parse(raw)


def cls(el):
    return (el.get('class') or '').split()


def kids(el):
    return [c for c in list(el) if isinstance(c.tag, str)]


def find(root, tag=None, klass=None):
    out = []
    for el in root.iter():
        if not isinstance(el.tag, str):
            continue
        if tag and el.tag != tag:
            continue
        if klass and klass not in cls(el):
            continue
        out.append(el)
    return out


def check(path):
    raw, doc = load(path)
    body = find(doc, tag='body')[0]
    err = []

    # 1 顶层不得出现裸 main/article/prose/dash（容器提前闭合的症状）
    for el in kids(body):
        if el.tag in ('main', 'article') or 'prose' in cls(el) or 'dash' in cls(el):
            err.append('顶层出现裸 %s.%s（.shell 提前闭合，网格失效）' % (el.tag, '.'.join(cls(el))))

    shell = find(body, klass='shell')
    if len(shell) != 1:
        err.append('.shell 数量=%d，应为1' % len(shell))
        return err, raw
    sk = kids(shell[0])
    main = next((c for c in sk if c.tag == 'main'), None)
    aside = next((c for c in sk if c.tag == 'aside'), None)
    if main is None:
        err.append('.shell 直接子节点无 <main>（侧栏抢占了正文列）')
    if aside is None:
        err.append('.shell 直接子节点无 <aside>')

    if main is not None:
        arts = [c for c in kids(main) if c.tag == 'article']
        if len(arts) != 1:
            err.append('main 内 article=%d，应为1' % len(arts))
        else:
            art = arts[0]
            if not any('dash' in cls(c) for c in kids(art)):
                err.append('article 内缺 .dash')
            if not any('prose' in cls(c) for c in kids(art)):
                err.append('article 内缺 .prose（正文被吞进窄板）')
            dash = next((c for c in kids(art) if 'dash' in cls(c)), None)
            if dash is not None:
                boards = [c for c in kids(dash) if 'board' in cls(c)]
                if len(boards) != 2:
                    err.append('.dash 直接子 .board=%d，应为2' % len(boards))
                for b in boards:
                    for c in kids(b):
                        if 'prose' in cls(c):
                            err.append('.prose 落进了 .board（正文被压窄）')

    if aside is not None:
        have = set()
        for el in aside.iter():
            if not isinstance(el.tag, str):
                continue
            if 'rpt-card' in cls(el):
                have.add('rpt-card')
            if el.get('id') == 'stk-lining':
                have.add('stk-lining')
            if el.get('id') == 'mat-cost':
                have.add('mat-cost')
        for need in ('rpt-card', 'stk-lining', 'mat-cost'):
            if need not in have:
                err.append('aside 内缺 %s（侧栏组件被阔出 aside）' % need)

    items = find(body, klass='item')
    if len(items) < 20:
        err.append('.item=%d，应>=20' % len(items))
    for k in ('qbody', 'sb', 'pm'):
        if not find(body, klass=k):
            err.append('缺 .%s' % k)

    text = ''.join(el for el in body.itertext())
    if '公告要点' in text:
        for k in ('市场影响', '业绩看点', '后续关注'):
            if k not in text:
                err.append('公告四行结构缺「%s」' % k)

    pms = find(body, klass='pm')
    if pms:
        lis = [c for c in pms[0].iter() if isinstance(c.tag, str) and c.tag == 'li']
        linked = [li for li in lis
                  if any(isinstance(a.tag, str) and a.tag == 'a' and 't' in cls(a)
                         and a.get('href') and a.get('title') for a in li.iter())]
        if len(linked) != len(lis):
            err.append('日历 li=%d，带链接 title 的=%d' % (len(lis), len(linked)))

    if 'gtimg.cn' in raw or 'hq.sinajs.cn' in raw:
        err.append('含浏览器端跨域行情源')
    if '行情加载中' in raw:
        err.append('含「行情加载中…」占位')
    if chr(34) in raw:
        err.append('含 ASCII 双引号 %d 个' % raw.count(chr(34)))

    return err, raw


if __name__ == '__main__':
    bad = 0
    for f in sys.argv[1:]:
        err, raw = check(f)
        if err:
            bad += 1
            print('FAIL %s' % f)
            for e in err:
                print('  - %s' % e)
        else:
            print('PASS %s  %d chars  item=%d' % (f, len(raw), len(find_items(raw))))
    sys.exit(1 if bad else 0)
