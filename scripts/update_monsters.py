#!/usr/bin/env python3
from __future__ import annotations

import json
import re
import time
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

import requests

BASE = (
    "https://raw.githubusercontent.com/"
    "MetalKid/DQM3_Database/main/data/json/raw"
)

FILES = {
    "monsters": f"{BASE}/Monster.json",
    "families": f"{BASE}/Family.json",
    "ranks": f"{BASE}/Rank.json",
    "syntheses": f"{BASE}/MonsterSynthesis.json",
    "monster_locations": f"{BASE}/MonsterLocation.json",
    "locations": f"{BASE}/Location.json",
    "seasons": f"{BASE}/Season.json",
    "weather": f"{BASE}/Weather.json",
    "monster_egg_types": f"{BASE}/MonsterEggType.json",
    "egg_types": f"{BASE}/EggType.json",
    "monster_talents": f"{BASE}/MonsterTalent.json",
    "talents": f"{BASE}/Talent.json",
    "monster_traits": f"{BASE}/MonsterTrait.json",
    "traits": f"{BASE}/Trait.json",
}

OUT = Path("data.json")
EXPECTED_COUNT = 526

SESSION = requests.Session()
SESSION.headers.update(
    {
        "User-Agent": "naoya-lab-dqm3-data-builder/6.0",
        "Accept": "application/json,text/plain,*/*",
    }
)


def fetch_json(url: str, attempts: int = 4) -> Any:
    last_error = None
    for attempt in range(attempts):
        try:
            response = SESSION.get(url, timeout=30)
            response.raise_for_status()
            return response.json()
        except (requests.RequestException, ValueError) as exc:
            last_error = exc
            if attempt + 1 < attempts:
                time.sleep(2 ** attempt)

    raise RuntimeError(
        f"Failed to fetch {url}: {last_error}"
    )


def parent_label(
    monster_id,
    monsters_by_id,
    families_by_id,
    ranks_by_id,
):
    if monster_id is None:
        return ""

    monster = monsters_by_id.get(monster_id)
    if not monster:
        return f"ID:{monster_id}"

    japanese_name = (
        monster.get("JapaneseName") or ""
    ).strip()

    if japanese_name:
        return japanese_name

    family = families_by_id.get(
        monster.get("FamilyId"),
        {},
    )
    rank = ranks_by_id.get(
        monster.get("RankId"),
        {},
    )

    family_name = (
        family.get("JapaneseName")
        or family.get("Name")
        or ""
    ).strip()

    rank_name = (
        rank.get("Name")
        or ""
    ).strip()

    if family_name:
        if rank_name and rank_name != "Any":
            return (
                f"{family_name}\u7cfb"
                f"\uff08{rank_name}\u30e9\u30f3\u30af\uff09"
            )
        return f"{family_name}\u7cfb"

    return (
        monster.get("Name")
        or f"ID:{monster_id}"
    ).strip()


def trait_description_ja(trait: dict) -> str:
    """Translate trait descriptions to concise Japanese when safely possible."""

    name = (
        trait.get("Name")
        or ""
    ).strip()

    description = (
        trait.get("Description")
        or ""
    ).strip()

    # Stat bonuses
    bonus_map = [
        ("HPBonus", "\u6700\u5927HP"),
        ("MPBonus", "\u6700\u5927MP"),
        ("AttackBonus", "\u653b\u6483\u529b"),
        ("DefenceBonus", "\u5b88\u5099\u529b"),
        ("AgilityBonus", "\u3059\u3070\u3084\u3055"),
        ("WisdomBonus", "\u304b\u3057\u3053\u3055"),
    ]

    for field, jp_name in bonus_map:
        value = trait.get(field)

        if value is not None:
            return (
                f"{jp_name}\u304c"
                f"{value}\u4e0a\u304c\u308b\u3002"
            )

    # High-confidence direct translations
    exact = {
        "Regular attacks sometimes absorb a portion of the enemy's MP.":
            "\u901a\u5e38\u653b\u6483\u6642\u3001\u3068\u304d\u3069\u304d\u6575\u306eMP\u3092\u5438\u53ce\u3059\u308b\u3002",

        "Makes it somewhat easier to avoid enemy attacks.":
            "\u6575\u304b\u3089\u306e\u653b\u6483\u3092\u304b\u308f\u3057\u3084\u3059\u304f\u306a\u308b\u3002",

        "Greatly increases the attack after inflicting a critical hit.":
            "\u4f1a\u5fc3\u306e\u4e00\u6483\u3092\u51fa\u3059\u3068\u3001\u653b\u6483\u529b\u304c\u5927\u304d\u304f\u4e0a\u304c\u308b\u3002",

        "Always attacks an enemy when the monster is confused. Successful strikes inflict critical hits.":
            "\u6df7\u4e71\u3057\u3066\u3044\u308b\u9593\u3082\u6575\u3092\u653b\u6483\u3057\u3001\u653b\u6483\u304c\u5f53\u305f\u308b\u3068\u4f1a\u5fc3\u306e\u4e00\u6483\u306b\u306a\u308b\u3002",

        "Makes it somewhat easier to inflict critical hits.":
            "\u4f1a\u5fc3\u306e\u4e00\u6483\u304c\u51fa\u3084\u3059\u304f\u306a\u308b\u3002",

        "Increases damage inflicted on L-size monsters.":
            "L\u30b5\u30a4\u30ba\u306e\u30e2\u30f3\u30b9\u30bf\u30fc\u306b\u4e0e\u3048\u308b\u30c0\u30e1\u30fc\u30b8\u304c\u5897\u3048\u308b\u3002",

        "Increases damage inflicted on S-size monsters.":
            "S\u30b5\u30a4\u30ba\u306e\u30e2\u30f3\u30b9\u30bf\u30fc\u306b\u4e0e\u3048\u308b\u30c0\u30e1\u30fc\u30b8\u304c\u5897\u3048\u308b\u3002",

        "Sometimes performs 2 or 3 actions in a row.":
            "\u3068\u304d\u3069\u304d1\u30bf\u30fc\u30f3\u306b2\uff5e3\u56de\u884c\u52d5\u3059\u308b\u3002",

        "Sometimes performs 1 to 3 actions in a row.":
            "\u3068\u304d\u3069\u304d1\u30bf\u30fc\u30f3\u306b1\uff5e3\u56de\u884c\u52d5\u3059\u308b\u3002",

        "Sometimes performs 2 actions in a row.":
            "\u3068\u304d\u3069\u304d1\u30bf\u30fc\u30f3\u306b2\u56de\u884c\u52d5\u3059\u308b\u3002",
    }

    if description in exact:
        return exact[description]

    # Elemental potency / MP-cost traits
    element_map = {
        "fire": "\u706b",
        "ice": "\u6c37\u7d50",
        "wind": "\u98a8",
        "earth": "\u5730",
        "explosion": "\u7206\u767a",
        "electrical": "\u96fb\u6483",
        "light": "\u5149",
        "dark": "\u95c7",
    }

    m = re.fullmatch(
        r"Increases the potency of ([A-Za-z]+) attacks "
        r"and decreases their MP consumption\.",
        description,
    )

    if m:
        element = element_map.get(
            m.group(1).lower()
        )

        if element:
            return (
                f"{element}\u5c5e\u6027\u306e\u653b\u6483\u304c\u5f37\u304f\u306a\u308a\u3001"
                "\u6d88\u8cbbMP\u3082\u5c11\u306a\u304f\u306a\u308b\u3002"
            )

    # Resistance traits
    resistance_map = {
        "poison and severe poison": "\u6bd2\u30fb\u731b\u6bd2",
        "paralysis": "\u30de\u30d2",
        "sleep": "\u7720\u308a",
        "confusion": "\u6df7\u4e71",
        "instant death": "\u5373\u6b7b",
        "bedazzlement": "\u5e7b\u60d1",
        "antimagic": "\u5c01\u3058",
        "MP absorption": "MP\u5438\u53ce",
        "stun": "\u4f11\u307f",
    }

    resistance_patterns = [
        (
            r"Slightly increases resistance to (.+)\.",
            "\u3078\u306e\u8010\u6027\u304c\u5c11\u3057\u4e0a\u304c\u308b\u3002",
        ),
        (
            r"Greatly increases resistance to (.+)\.",
            "\u3078\u306e\u8010\u6027\u304c\u5927\u304d\u304f\u4e0a\u304c\u308b\u3002",
        ),
        (
            r"Increases resistance to (.+)\.",
            "\u3078\u306e\u8010\u6027\u304c\u4e0a\u304c\u308b\u3002",
        ),
    ]

    for pattern, suffix in resistance_patterns:
        m = re.fullmatch(
            pattern,
            description,
        )

        if m:
            target = resistance_map.get(
                m.group(1),
                m.group(1),
            )

            if target != m.group(1):
                return f"{target}{suffix}"

    # Generic multi-action phrasing
    m = re.fullmatch(
        r"Sometimes performs (\d+) or (\d+) actions in a row\.",
        description,
    )

    if m:
        return (
            "\u3068\u304d\u3069\u304d1\u30bf\u30fc\u30f3\u306b"
            f"{m.group(1)}\uff5e{m.group(2)}"
            "\u56de\u884c\u52d5\u3059\u308b\u3002"
        )

    # Keep the source text when no safe translation rule is available.
    return description

def main():
    print("DQM3\u30c7\u30fc\u30bf\u53d6\u5f97\u958b\u59cb")

    source = {
        name: fetch_json(url)
        for name, url in FILES.items()
    }

    all_monsters = source["monsters"]
    syntheses = source["syntheses"]

    monsters_by_id = {
        int(x["MonsterId"]): x
        for x in all_monsters
    }
    families_by_id = {
        int(x["FamilyId"]): x
        for x in source["families"]
    }
    ranks_by_id = {
        int(x["RankId"]): x
        for x in source["ranks"]
    }
    location_by_id = {
        int(x["LocationId"]): x
        for x in source["locations"]
    }
    season_by_id = {
        int(x["SeasonId"]): x
        for x in source["seasons"]
    }
    weather_by_id = {
        int(x["WeatherId"]): x
        for x in source["weather"]
    }
    egg_type_by_id = {
        int(x["EggTypeId"]): x
        for x in source["egg_types"]
    }
    talent_by_id = {
        int(x["TalentId"]): x
        for x in source["talents"]
    }
    trait_by_id = {
        int(x["TraitId"]): x
        for x in source["traits"]
    }

    real_monsters = [
        monster
        for monster in all_monsters
        if (
            monster.get("Number") is not None
            and
            (
                monster.get("JapaneseName")
                or ""
            ).strip()
        )
    ]

    print(
        "\u53d6\u5f97\u30e2\u30f3\u30b9\u30bf\u30fc\u6570:",
        len(real_monsters),
    )

    if len(real_monsters) != EXPECTED_COUNT:
        raise RuntimeError(
            "\u30e2\u30f3\u30b9\u30bf\u30fc\u6570\u304c\u60f3\u5b9a\u3068\u9055\u3044\u307e\u3059\u3002"
            f" expected={EXPECTED_COUNT}"
            f" actual={len(real_monsters)}"
        )

    records_by_id = {}

    for monster in real_monsters:
        monster_id = int(
            monster["MonsterId"]
        )

        family = families_by_id.get(
            monster.get("FamilyId"),
            {},
        )
        rank = ranks_by_id.get(
            monster.get("RankId"),
            {},
        )

        family_name = (
            family.get("JapaneseName")
            or family.get("Name")
            or ""
        ).strip()

        records_by_id[monster_id] = {
            "name":
                monster["JapaneseName"].strip(),
            "reading": "",
            "no":
                int(monster["Number"]),
            "rank":
                (
                    rank.get("Name")
                    or ""
                ).strip(),
            "family":
                f"{family_name}\u7cfb",
            "talents": [],
            "traits": {
                "S": [],
                "L": [],
            },
            "locations": [],
            "eggs": [],
            "recipes": [],
            "uses": [],
        }

    # \u6240\u6301\u30b9\u30ad\u30eb
    for item in source["monster_talents"]:
        monster_id = int(
            item["MonsterId"]
        )

        if monster_id not in records_by_id:
            continue

        talent = talent_by_id.get(
            int(item["TalentId"]),
            {},
        )

        talent_name = (
            talent.get("JapaneseName")
            or talent.get("Name")
            or ""
        ).strip()

        if not talent_name:
            continue

        talent_info = {
            "name": talent_name,
            "primary":
                bool(item.get("IsPrimary")),
        }

        if (
            talent_info
            not in records_by_id[
                monster_id
            ]["talents"]
        ):
            records_by_id[
                monster_id
            ]["talents"].append(
                talent_info
            )

    for record in records_by_id.values():
        record["talents"].sort(
            key=lambda x: (
                not x["primary"],
                x["name"],
            )
        )

    # \u7279\u6027
    for item in source["monster_traits"]:
        monster_id = int(
            item["MonsterId"]
        )

        if monster_id not in records_by_id:
            continue

        trait = trait_by_id.get(
            int(item["TraitId"]),
            {},
        )

        trait_name = (
            trait.get("JapaneseName")
            or trait.get("Name")
            or ""
        ).strip()

        if not trait_name:
            continue

        size_id = int(
            item.get("SizeId", 1)
        )

        size_key = (
            "L"
            if size_id == 2
            else "S"
        )

        trait_info = {
            "name":
                trait_name,
            "level":
                int(
                    item.get(
                        "UnlockLevel",
                        1,
                    )
                    or 1
                ),
            "description":
                trait_description_ja(
                    trait
                ),
        }

        if (
            trait_info
            not in records_by_id[
                monster_id
            ]["traits"][size_key]
        ):
            records_by_id[
                monster_id
            ]["traits"][size_key].append(
                trait_info
            )

    for record in records_by_id.values():
        for size_key in ("S", "L"):
            record["traits"][size_key].sort(
                key=lambda x: (
                    x["level"],
                    x["name"],
                )
            )

    # \u751f\u606f\u5730
    location_groups = {}

    def weather_name(weather):
        identifier = (
            weather.get("Identifier")
            or ""
        )

        if identifier == "sun":
            return "\u6674\u308c"

        if identifier == "precipitation":
            return "\u964d\u6c34\u6642"

        return (
            weather.get("Name")
            or ""
        )

    for item in source["monster_locations"]:
        monster_id = int(
            item["MonsterId"]
        )

        if monster_id not in records_by_id:
            continue

        location = location_by_id.get(
            int(item["LocationId"]),
            {},
        )
        season = season_by_id.get(
            int(item["SeasonId"]),
            {},
        )
        weather = weather_by_id.get(
            int(item["WeatherId"]),
            {},
        )

        location_name = (
            location.get("JapaneseName")
            or location.get("Name")
            or ""
        ).strip()

        season_name = (
            season.get("JapaneseName")
            or season.get("Name")
            or ""
        ).strip()

        weather_jp = weather_name(
            weather
        )

        if not location_name:
            continue

        key = (
            monster_id,
            location_name,
            weather_jp,
            bool(item.get("IsMiniBoss")),
        )

        if key not in location_groups:
            location_groups[key] = {
                "name":
                    location_name,
                "seasons": [],
                "weather":
                    weather_jp,
                "miniBoss":
                    bool(
                        item.get(
                            "IsMiniBoss"
                        )
                    ),
            }

        if (
            season_name
            and
            season_name
            not in location_groups[
                key
            ]["seasons"]
        ):
            location_groups[
                key
            ]["seasons"].append(
                season_name
            )

    season_order = {
        "\u6625": 0,
        "\u590f": 1,
        "\u79cb": 2,
        "\u51ac": 3,
    }

    for key, location_data in (
        location_groups.items()
    ):
        monster_id = key[0]

        location_data[
            "seasons"
        ].sort(
            key=lambda value:
                season_order.get(
                    value,
                    99,
                )
        )

        records_by_id[
            monster_id
        ]["locations"].append(
            location_data
        )

    for record in records_by_id.values():
        record["locations"].sort(
            key=lambda x: x["name"]
        )

    # \u5375
    egg_order = {
        "white": 0,
        "silver": 1,
        "gold": 2,
        "rainbow": 3,
        "rainbowp": 4,
    }

    for item in source[
        "monster_egg_types"
    ]:
        monster_id = int(
            item["MonsterId"]
        )

        if monster_id not in records_by_id:
            continue

        egg = egg_type_by_id.get(
            int(item["EggTypeId"]),
            {},
        )

        egg_name = (
            egg.get("JapaneseName")
            or egg.get("Name")
            or ""
        ).strip()

        identifier = (
            egg.get("Identifier")
            or ""
        )

        if not egg_name:
            continue

        egg_info = {
            "name":
                egg_name,
            "identifier":
                identifier,
            "postGameOnly":
                identifier == "rainbowp",
        }

        if (
            egg_info
            not in records_by_id[
                monster_id
            ]["eggs"]
        ):
            records_by_id[
                monster_id
            ]["eggs"].append(
                egg_info
            )

    for record in records_by_id.values():
        record["eggs"].sort(
            key=lambda x:
                egg_order.get(
                    x.get(
                        "identifier",
                        ""
                    ),
                    99,
                )
        )

    # \u914d\u5408
    recipe_parent_ids = {}

    grandparent_keys = (
        "MonsterGrandParent1AId",
        "MonsterGrandParent1BId",
        "MonsterGrandParent2AId",
        "MonsterGrandParent2BId",
    )

    for synthesis in syntheses:
        result_id = synthesis.get(
            "MonsterResultId"
        )

        if result_id not in records_by_id:
            continue

        grandparent_ids = [
            synthesis.get(key)
            for key in grandparent_keys
            if synthesis.get(key)
            is not None
        ]

        if grandparent_ids:
            parent_ids = [
                int(value)
                for value
                in grandparent_ids
            ]
            recipe_type = "4\u4f53\u914d\u5408"
        else:
            parent_ids = [
                int(value)
                for value in (
                    synthesis.get(
                        "MonsterParent1Id"
                    ),
                    synthesis.get(
                        "MonsterParent2Id"
                    ),
                )
                if value is not None
            ]
            recipe_type = "\u914d\u5408"

        if not parent_ids:
            continue

        parent_names = [
            parent_label(
                parent_id,
                monsters_by_id,
                families_by_id,
                ranks_by_id,
            )
            for parent_id
            in parent_ids
        ]

        parent_names = [
            name
            for name in parent_names
            if name
        ]

        if not parent_names:
            continue

        result_name = (
            records_by_id[
                int(result_id)
            ]["name"]
        )

        recipe = {
            "type":
                recipe_type,
            "parents":
                parent_names,
            "result":
                result_name,
        }

        if (
            recipe
            not in records_by_id[
                int(result_id)
            ]["recipes"]
        ):
            records_by_id[
                int(result_id)
            ]["recipes"].append(
                recipe
            )

        synthesis_id = int(
            synthesis[
                "MonsterSynthesisId"
            ]
        )

        recipe_parent_ids[
            (
                int(result_id),
                synthesis_id,
            )
        ] = parent_ids

    # \u9006\u5f15\u304d
    for synthesis in syntheses:
        result_id = synthesis.get(
            "MonsterResultId"
        )

        if result_id not in records_by_id:
            continue

        synthesis_id = int(
            synthesis[
                "MonsterSynthesisId"
            ]
        )

        key = (
            int(result_id),
            synthesis_id,
        )

        parent_ids = (
            recipe_parent_ids.get(key)
        )

        if not parent_ids:
            continue

        parent_labels = [
            parent_label(
                parent_id,
                monsters_by_id,
                families_by_id,
                ranks_by_id,
            )
            for parent_id
            in parent_ids
        ]

        is_quadruple = any(
            synthesis.get(key)
            is not None
            for key
            in grandparent_keys
        )

        use_type = (
            "4\u4f53\u914d\u5408"
            if is_quadruple
            else "\u914d\u5408"
        )

        result_name = (
            records_by_id[
                int(result_id)
            ]["name"]
        )

        for index, parent_id in enumerate(
            parent_ids
        ):
            if (
                parent_id
                not in records_by_id
            ):
                continue

            other_parents = [
                label
                for i, label
                in enumerate(
                    parent_labels
                )
                if (
                    i != index
                    and label
                )
            ]

            use = {
                "type":
                    use_type,
                "source":
                    records_by_id[
                        parent_id
                    ]["name"],
                "otherParents":
                    other_parents,
                "result":
                    result_name,
            }

            if (
                use
                not in records_by_id[
                    parent_id
                ]["uses"]
            ):
                records_by_id[
                    parent_id
                ]["uses"].append(
                    use
                )

    monsters = sorted(
        records_by_id.values(),
        key=lambda m: (
            m["no"],
            m["name"],
        ),
    )

    payload = {
        "generatedAt":
            datetime.now(
                timezone.utc
            ).isoformat(),
        "source": {
            "name":
                "MetalKid/DQM3_Database",
            "url":
                "https://github.com/"
                "MetalKid/DQM3_Database",
            "license":
                "MIT",
        },
        "monsters":
            monsters,
    }

    OUT.write_text(
        json.dumps(
            payload,
            ensure_ascii=False,
            indent=2,
        )
        + "\n",
        encoding="utf-8",
    )

    print("data.json \u4f5c\u6210\u5b8c\u4e86")
    print(f"monsters={len(monsters)}")
    print(
        "talents="
        f"{sum(len(x['talents']) for x in monsters)}"
    )
    print(
        "traits="
        f"{sum(len(x['traits']['S']) + len(x['traits']['L']) for x in monsters)}"
    )
    print(
        "locations="
        f"{sum(len(x['locations']) for x in monsters)}"
    )
    print(
        "eggs="
        f"{sum(len(x['eggs']) for x in monsters)}"
    )
    print(
        "recipes="
        f"{sum(len(x['recipes']) for x in monsters)}"
    )
    print(
        "uses="
        f"{sum(len(x['uses']) for x in monsters)}"
    )


if __name__ == "__main__":
    main()
