#!/usr/bin/env python3

from __future__ import annotations

import json
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

    # 野生出現
    "monster_locations": f"{BASE}/MonsterLocation.json",
    "locations": f"{BASE}/Location.json",
    "seasons": f"{BASE}/Season.json",
    "weather": f"{BASE}/Weather.json",

    # 卵
    "monster_egg_types": f"{BASE}/MonsterEggType.json",
    "egg_types": f"{BASE}/EggType.json",
}

OUT = Path("data.json")

EXPECTED_COUNT = 526


SESSION = requests.Session()

SESSION.headers.update(
    {
        "User-Agent": "naoya-lab-dqm3-data-builder/3.0",
        "Accept": "application/json,text/plain,*/*",
    }
)


def fetch_json(url: str, attempts: int = 4) -> Any:

    last_error = None

    for attempt in range(attempts):

        try:
            response = SESSION.get(
                url,
                timeout=30,
            )

            response.raise_for_status()

            return response.json()

        except (
            requests.RequestException,
            ValueError,
        ) as exc:

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

    monster = monsters_by_id.get(
        monster_id
    )

    if not monster:
        return f"ID:{monster_id}"

    japanese_name = (
        monster.get("JapaneseName")
        or ""
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

        if (
            rank_name
            and rank_name != "Any"
        ):
            return (
                f"{family_name}系"
                f"（{rank_name}ランク）"
            )

        return f"{family_name}系"

    return (
        monster.get("Name")
        or f"ID:{monster_id}"
    ).strip()


def main():

    print("DQM3データ取得開始")

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
        "取得モンスター数:",
        len(real_monsters),
    )

    if len(real_monsters) != EXPECTED_COUNT:

        raise RuntimeError(
            "モンスター数が想定と違います。"
            f" expected={EXPECTED_COUNT}"
            f" actual={len(real_monsters)}"
        )

    records_by_id = {}

    # =====================================
    # 基本情報
    # =====================================

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

        records_by_id[
            monster_id
        ] = {
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
                f"{family_name}系",

            "locations": [],

            "eggs": [],

            "recipes": [],

            "uses": [],
        }

    # =====================================
    # 生息地
    # =====================================

    location_groups = {}

    def weather_name(weather):

        identifier = (
            weather.get("Identifier")
            or ""
        )

        if identifier == "sun":
            return "晴れ"

        if identifier == "precipitation":
            return "降水時"

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
            bool(
                item.get("IsMiniBoss")
            ),
        )

        if key not in location_groups:

            location_groups[key] = {
                "name": location_name,
                "seasons": [],
                "weather": weather_jp,
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
        "春": 0,
        "夏": 1,
        "秋": 2,
        "冬": 3,
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

    # =====================================
    # 卵
    # =====================================

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
            "name": egg_name,
            "identifier": identifier,
            "postGameOnly":
                identifier == "rainbowp",
        }

        if (
            egg_info
            not in
            records_by_id[
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

    # =====================================
    # 配合
    # =====================================

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

            recipe_type = "4体配合"

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

            recipe_type = "配合"

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
            "type": recipe_type,
            "parents": parent_names,
            "result": result_name,
        }

        if (
            recipe
            not in
            records_by_id[
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

    # =====================================
    # 逆引き
    # =====================================

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
            "4体配合"
            if is_quadruple
            else "配合"
        )

        result_name = (
            records_by_id[
                int(result_id)
            ]["name"]
        )

        for index, parent_id in (
            enumerate(parent_ids)
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
                "type": use_type,

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
                not in
                records_by_id[
                    parent_id
                ]["uses"]
            ):
                records_by_id[
                    parent_id
                ]["uses"].append(
                    use
                )

    # =====================================
    # 出力
    # =====================================

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
                "https://github.com/MetalKid/DQM3_Database",

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

    print(
        "data.json 作成完了"
    )

    print(
        f"monsters={len(monsters)}"
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
