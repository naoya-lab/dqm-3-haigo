"""Collect currently listed DQM4 monsters and available factual fields."""
import argparse
import hashlib
import json
import re
from datetime import datetime, timezone
from pathlib import Path
from urllib.request import Request, urlopen
from lxml import html
from js_literal import Parser

ROOT = Path(__file__).resolve().parents[1]
URL = 'https://gamewith.jp/monsters4/563338'

def text(fragment):
    return html.fragment_fromstring(fragment, create_parent='div').text_content().strip()

def collect(page):
    doc = html.fromstring(page)
    heading = next(h for h in doc.xpath('//h3') if h.text_content().strip() == '内定モンスター')
    names = []
    for cell in heading.getnext().xpath('.//td'):
        name = cell.text_content().strip()
        if not name:
            continue
        tribe = cell.xpath('.//img/@alt')[-1]
        names.append((name, tribe if tribe.endswith('系') else tribe + '系'))
    declared = re.search(r'内定モンスター一覧（(\d+)体判明）', doc.text_content())
    if not declared or len(names) != int(declared[1]) or len(set(n for n, _ in names)) != len(names):
        raise ValueError('Listed monster count mismatch; page format may have changed')
    script = next(s.text for s in doc.xpath('//script') if 'window.wmt.monsterDatas=' in (s.text or ''))
    embedded = {m[1]: Parser(script[m.end():]).val() for m in re.finditer(r'window.wmt.(\w+)=', script)}
    details = {m['n']: m for m in embedded['monsterDatas']}
    if not set(details).issubset(n for n, _ in names):
        raise ValueError('Detail names not found in list')
    traits = {a['id']: a for a in embedded['abilityDatas']}
    skills = {s['id']: s for s in embedded['skillDatas']}
    moves = {s['id']: s for s in embedded['tokugiDatas']}
    old_path = ROOT / 'monsters.source.json'
    old = {m['name']: m for m in json.loads(old_path.read_text())['monsters']} if old_path.exists() else {}
    monsters = []
    for index, (name, family) in enumerate(names):
        raw = details.get(name)
        monster = {'id': old.get(name, {}).get('id', 'listed-' + hashlib.sha256(name.encode()).hexdigest()[:12]), 'name': name,
                   'no': None, 'rank': '', 'family': family, 'recipes': [], 'locations': [],
                   'talents': [], 'traits': {'S': [], 'L': []}, 'eggs': [], 'sourceUrl': URL,
                   'dataStatus': 'details' if raw else 'announced',
                   'nameStatus': '仮称・正式名称未確認' if '亜種' in name or name == 'コガラッサ' else ''}
        if raw:
            monster['sourceUrl'] = 'https://gamewith.jp/monsters4/' + raw['aid']
            monster['no'] = int(raw['no']) if str(raw.get('no', '')).isdigit() else None
            monster['rank'] = raw.get('r', '')
            monster['family'] = raw['fm'] + '系'
            monster['talents'] = [{'name': skills[k]['n'], 'primary': i == 0} for i, k in enumerate(raw.get('sk', [])) if k in skills]
            for size, key in [('S', 'ab'), ('L', 'abl')]:
                # The listing specifies names and sizes, not acquisition levels.
                monster['traits'][size] = [{'name': traits[k]['n'], 'level': None} for k in raw.get(key, []) if k in traits]
            for block in raw.get('b', []):
                for fragment in block.get('t', []):
                    plain = text(fragment)
                    if block['l'] == 'スカ':
                        monster['locations'].extend({'name': text(line), 'sourceUrl': monster['sourceUrl']} for line in re.split(r'<br\s*/?>', fragment) if text(line))
                    elif block['l'] in ('特殊', '配合'):
                        node = html.fragment_fromstring(fragment, create_parent='div')
                        parents = [a.text_content().strip() for a in node.xpath('.//a')]
                        if len(parents) not in (2, 4):
                            raise ValueError(f'Unsupported recipe for {name}: {plain}')
                        monster['recipes'].append({'type': '特殊配合' if block['l'] == '特殊' else '通常配合',
                                                   'parents': parents, 'note': plain, 'sourceUrl': monster['sourceUrl']})
        monsters.append(monster)
    known = {m['name'] for m in monsters}
    for m in monsters:
        for r in m['recipes']:
            if any(p not in known and not p.endswith('系') for p in r['parents']):
                raise ValueError(f'Unknown recipe parent: {r}')
    skill_entries = []
    for raw in embedded['skillDatas']:
        abilities = []
        for ability in raw.get('tgs', []):
            name = ability.get('n') or moves.get(ability.get('id'), {}).get('n')
            if not name:
                raise ValueError('Unknown move reference')
            abilities.append({'name': name, 'points': ability['sp']})
        skill_entries.append({'name': raw['n'], 'abilities': abilities, 'maxPoints': max((a['points'] for a in abilities), default=0),
                              'recipes': [], 'evolvesTo': [], 'sourceUrl': 'https://gamewith.jp/monsters4/' + raw['aid']})
    stamp = datetime.now(timezone.utc).date().isoformat()
    return ({'game': 'DQM4', 'status': '公開一覧の全モンスター・未公開項目は確認待ち', 'checkedAt': stamp,
             'sourceUrl': URL, 'listedCount': len(monsters), 'detailCount': len(details), 'monsters': monsters},
            {'game': 'DQM4', 'checkedAt': stamp, 'sourceUrl': URL, 'skills': skill_entries})

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--html', type=Path, help='Use a downloaded page for verification')
    args = parser.parse_args()
    if args.html:
        page = args.html.read_text(encoding='utf-8')
    else:
        with urlopen(Request(URL, headers={'User-Agent': 'DQM4-Database-Updater/1.0'}), timeout=40) as response:
            page = response.read().decode('utf-8')
    monster_db, skill_db = collect(page)
    # Validate both before replacing either output.
    for filename, data in [('monsters.source.json', monster_db), ('skills.json', skill_db)]:
        (ROOT / filename).write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    print(f"Listed {monster_db['listedCount']}; details {monster_db['detailCount']}; skills {len(skill_db['skills'])}")

if __name__ == '__main__':
    main()
