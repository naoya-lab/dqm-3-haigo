#!/usr/bin/env python3
"""Build data.json for the DQM3 synthesis search app.

Source:
  MetalKid/DQM3_Database (MIT)
  https://github.com/MetalKid/DQM3_Database
"""

from __future__ import annotations

import json
import time
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

import requests


BASE = "https://raw.githubusercontent.com/MetalKid/DQM3_Database/main/data/json/raw"

FILES = {
    "monsters": f"{BASE}/Monster.json",
    "families": f"{BASE}/Family.json",
    "ranks": f"{BASE}/Rank.json",
    "syntheses": f"{BASE}/MonsterSynthesis.json",
}

OUT = Path("data.json")

# DQM3の図鑑登録モンスター数
EXPECTED_COUNT = 526


SESSION = requests.Session()

SESSION.headers.update(
    {
        "User-Agent": "naoya-lab-dqm3-data-builder/1.0",
        "Accept": "application/json,text/plain,*/*",
    }
)


def fetch_json(url: str, attempts: int = 4) -> Any:
    """JSONを取得。失敗時は数回リトライする。"""

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
    """親モンスターIDを日本語名に変換する。"""

    if monster_id is None:
        return ""

    monster = monsters_by_id.get(monster_id)

    if not monster:
        return f"ID:{monster_id}"

    japanese_name = (
        monster.get("JapaneseName") or ""
    ).strip()

    # 通常モンスターなら日本語名
    if japanese_name:
        return japanese_name

    # ○○系、○ランクなどの汎用親
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
        rank.get("Name") or ""
    ).strip()

    if family_name:

        if rank_name and rank_name != "Any":

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

    # -----------------------------
    # データ取得
    # -----------------------------

    source = {
        name: fetch_json(url)
        for name, url in FILES.items()
    }

    all_monsters = source["monsters"]

    syntheses = source["syntheses"]

    monsters_by_id = {
        int(monster["MonsterId"]): monster
        for monster in all_monsters
    }

    families_by_id = {
        int(family["FamilyId"]): family
        for family in source["families"]
    }

    ranks_by_id = {
        int(rank["RankId"]): rank
        for rank in source["ranks"]
    }

    # -----------------------------
    # 実モンスターだけ抽出
    # -----------------------------

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

    # -----------------------------
    # モンスター基本データ
    # -----------------------------

    records_by_id = {}

    for monster in real_monsters:

        family = families_by_id.get(
            monster.get("FamilyId"),
            {},
        )

        rank = ranks_by_id.get(
            monster.get("RankId"),
            {},
        )

        monster_id = int(
            monster["MonsterId"]
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
                f"{family_name}系",

            "recipes": [],

            "uses": [],

        }

    # -----------------------------
    # 配合データ作成
    # -----------------------------

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

        # 4体配合
        grandparent_ids = [

            synthesis.get(key)

            for key in grandparent_keys

            if synthesis.get(key) is not None

        ]

        if grandparent_ids:

            parent_ids = [
                int(value)
                for value in grandparent_ids
            ]

            recipe_type = "4体配合"

        else:

            parent1 = synthesis.get(
                "MonsterParent1Id"
            )

            parent2 = synthesis.get(
                "MonsterParent2Id"
            )

            parent_ids = [

                int(value)

                for value in (
                    parent1,
                    parent2,
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

            for parent_id in parent_ids

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

    # -----------------------------
    # 逆引き配合データ
    # -----------------------------

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

            for parent_id in parent_ids

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

        for index, parent_id in enumerate(
            parent_ids
        ):

            # ○○系などは
            # 個別モンスターではないので除外
            if parent_id not in records_by_id:
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

    # -----------------------------
    # 図鑑番号順に並べる
    # -----------------------------

    monsters = sorted(

        records_by_id.values(),

        key=lambda monster: (
            monster["no"],
            monster["name"],
        ),

    )

    # -----------------------------
    # data.json作成
    # -----------------------------

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

    recipe_count = sum(

        len(monster["recipes"])

        for monster in monsters

    )

    use_count = sum(

        len(monster["uses"])

        for monster in monsters

    )

    print(
        "data.json 作成完了"
    )

    print(
        f"monsters={len(monsters)}"
    )

    print(
        f"recipes={recipe_count}"
    )

    print(
        f"uses={use_count}"
    )


if __name__ == "__main__":
    main()
