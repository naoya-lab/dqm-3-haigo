"""Build DQM4 reverse recipes from curated source. Run from any directory."""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def build():
    source = json.loads((ROOT / 'monsters.source.json').read_text(encoding='utf-8'))
    assert source['game'] == 'DQM4'
    monsters = source['monsters']
    by_name = {m['name']: m for m in monsters}
    assert len(by_name) == len(monsters), 'Duplicate monster names'
    assert len({m['id'] for m in monsters}) == len(monsters), 'Duplicate IDs'
    for m in monsters:
        m['uses'] = []
    for m in monsters:
        for recipe in m.get('recipes', []):
            parents = recipe['parents']
            assert len(parents) in (2, 4), 'Expected 2 or 4 parents'
            assert recipe.get('sourceUrl', '').startswith('https://'), 'Source required'
            recipe['result'] = m['name']
            for i, parent in enumerate(parents):
                assert parent in by_name, f'Unknown parent: {parent}'
                by_name[parent]['uses'].append({
                    'type': recipe.get('type', '配合'), 'source': parent,
                    'otherParents': parents[:i] + parents[i+1:],
                    'result': m['name'], 'sourceUrl': recipe['sourceUrl']})
    for file, key in [('skills.json', 'skills'), ('recommendations.json', 'teams')]:
        data = json.loads((ROOT / file).read_text(encoding='utf-8'))
        assert data['game'] == 'DQM4' and isinstance(data[key], list)
    (ROOT / 'data.json').write_text(
        json.dumps(source, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    print(f"DQM4: {len(monsters)} monsters, {sum(len(m.get('recipes', [])) for m in monsters)} recipes")


if __name__ == '__main__':
    build()
