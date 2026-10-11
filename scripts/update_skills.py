#!/usr/bin/env python3

import json
import time
from datetime import datetime, timezone
from pathlib import Path

import requests


BASE = (
    "https://raw.githubusercontent.com/"
    "MetalKid/DQM3_Database/main/data/json/raw"
)

FILES = {
    "talents": f"{BASE}/Talent.json",
    "talent_skills": f"{BASE}/TalentSkill.json",
    "skills": f"{BASE}/Skill.json",
    "talent_traits": f"{BASE}/TalentTrait.json",
    "traits": f"{BASE}/Trait.json",
    "syntheses": f"{BASE}/TalentSynthesis.json",
    "synthesis_talents": f"{BASE}/TalentSynthesisTalent.json",
}

OUT = Path("skills.json")

SESSION = requests.Session()

SESSION.headers.update({
    "User-Agent": "naoya-lab-dqm3-skill-builder/1.0",
    "Accept": "application/json,text/plain,*/*",
})


def fetch_json(url, attempts=4):

    last_error = None

    for attempt in range(attempts):

        try:

            response = SESSION.get(
                url,
                timeout=30
            )

            response.raise_for_status()

            return response.json()

        except (
            requests.RequestException,
            ValueError
        ) as exc:

            last_error = exc

            if attempt + 1 < attempts:
                time.sleep(2 ** attempt)

    raise RuntimeError(
        f"Failed to fetch {url}: {last_error}"
    )


def main():

    print("DQM3 スキルデータ取得開始")

    source = {
        name: fetch_json(url)
        for name, url in FILES.items()
    }

    talents = source["talents"]
    talent_skills = source["talent_skills"]
    skills = source["skills"]
    talent_traits = source["talent_traits"]
    traits = source["traits"]
    syntheses = source["syntheses"]
    synthesis_talents = source[
        "synthesis_talents"
    ]


    # -----------------------------
    # ID検索用
    # -----------------------------

    talent_by_id = {
        int(x["TalentId"]): x
        for x in talents
    }

    skill_by_id = {
        int(x["SkillId"]): x
        for x in skills
    }

    trait_by_id = {
        int(x["TraitId"]): x
        for x in traits
    }


    # -----------------------------
    # スキル配合素材をグループ化
    # -----------------------------

    synthesis_inputs = {}

    for item in synthesis_talents:

        synthesis_id = int(
            item["TalentSynthesisId"]
        )

        synthesis_inputs.setdefault(
            synthesis_id,
            []
        ).append(
            int(item["TalentId"])
        )


    # -----------------------------
    # 各スキルの基本情報
    # -----------------------------

    records = {}

    for talent in talents:

        talent_id = int(
            talent["TalentId"]
        )

        name = (
            talent.get("JapaneseName")
            or talent.get("Name")
            or ""
        ).strip()

        if not name:
            continue


        abilities = []


        # -------------------------
        # 特技・呪文
        # -------------------------

        for row in talent_skills:

            if int(row["TalentId"]) != talent_id:
                continue

            skill = skill_by_id.get(
                int(row["SkillId"])
            )

            if not skill:
                continue

            skill_name = (
                skill.get("JapaneseName")
                or skill.get("Name")
                or ""
            ).strip()

            if not skill_name:
                continue

            abilities.append({
                "points": int(row["Points"]),
                "name": skill_name,
                "type": "skill",
            })


        # -------------------------
        # ステータスアップ・耐性など
        # -------------------------

        for row in talent_traits:

            if int(row["TalentId"]) != talent_id:
                continue

            trait = trait_by_id.get(
                int(row["TraitId"])
            )

            if not trait:
                continue

            trait_name = (
                trait.get("JapaneseName")
                or trait.get("Name")
                or ""
            ).strip()

            if not trait_name:
                continue

            abilities.append({
                "points": int(row["Points"]),
                "name": trait_name,
                "type": "trait",
            })


        abilities.sort(
            key=lambda x: (
                x["points"],
                x["name"]
            )
        )


        max_points = max(
            [
                x["points"]
                for x in abilities
            ],
            default=0
        )


        record = {
            "name": name,
            "maxPoints": max_points,
            "abilities": abilities,
            "recipes": [],
            "evolvesTo": [],
        }


        if talent.get("IsEggOnly"):

            record["category"] = "タマゴ限定"


        records[talent_id] = record


    # -----------------------------
    # スキル配合・進化
    # -----------------------------

    for synthesis in syntheses:

        synthesis_id = int(
            synthesis["TalentSynthesisId"]
        )

        result_id = int(
            synthesis["TalentResultId"]
        )

        if result_id not in records:
            continue

        input_ids = synthesis_inputs.get(
            synthesis_id,
            []
        )

        input_ids = [
            x
            for x in input_ids
            if x in records
        ]

        if not input_ids:
            continue


        result_name = records[
            result_id
        ]["name"]


        # -------------------------
        # 1種類だけで進化
        # 火の心 → 火の極意など
        # -------------------------

        if len(input_ids) == 1:

            parent_id = input_ids[0]

            parent = records[parent_id]

            required_points = (
                parent["maxPoints"]
                or 100
            )

            evolution = {
                "result": result_name,
                "required": [
                    {
                        "skill":
                            parent["name"],
                        "points":
                            required_points,
                    }
                ],
                "note":
                    "必要ポイントを満たして配合",
            }

            if (
                evolution
                not in parent["evolvesTo"]
            ):

                parent[
                    "evolvesTo"
                ].append(
                    evolution
                )


        # -------------------------
        # 複数スキル配合
        # SP系など
        # -------------------------

        else:

            parent_names = [
                records[x]["name"]
                for x in input_ids
            ]

            parent_names = sorted(
                parent_names
            )

            result_record = records[
                result_id
            ]

            if (
                parent_names
                not in
                result_record["recipes"]
            ):

                result_record[
                    "recipes"
                ].append(
                    parent_names
                )

            result_record["note"] = (
                "素材スキルを最大まで振って配合"
            )


    # -----------------------------
    # 出力
    # -----------------------------

    result = list(
        records.values()
    )

    result.sort(
        key=lambda x: x["name"]
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

        "skills": result,
    }


    OUT.write_text(
        json.dumps(
            payload,
            ensure_ascii=False,
            indent=2
        )
        + "\n",
        encoding="utf-8"
    )


    print(
        f"skills.json 作成完了: "
        f"{len(result)}スキル"
    )

    ability_count = sum(
        len(x["abilities"])
        for x in result
    )

    recipe_count = sum(
        len(x["recipes"])
        for x in result
    )

    evolution_count = sum(
        len(x["evolvesTo"])
        for x in result
    )

    print(
        f"abilities={ability_count}"
    )

    print(
        f"recipes={recipe_count}"
    )

    print(
        f"evolutions={evolution_count}"
    )


if __name__ == "__main__":
    main()
