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
        "User-Agent": "naoya-lab-dqm3-data-builder/8.0",
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
    """\u7279\u6027\u8aac\u660e\u3092\u65e5\u672c\u8a9e\u5316\u3059\u308b\u3002\u82f1\u8a9e\u306f\u753b\u9762\u306b\u6b8b\u3055\u306a\u3044\u3002"""

    trait_id = int(trait.get("TraitId") or 0)
    jp_name = (
        trait.get("JapaneseName")
        or trait.get("Name")
        or "\u7279\u6027"
    ).strip()
    description = (
        trait.get("Description")
        or ""
    ).strip()

    # \u6570\u5024\u4e0a\u6607\u7cfb
    bonus_map = [
        ("HPBonus", "\u6700\u5927HP"),
        ("MPBonus", "\u6700\u5927MP"),
        ("AttackBonus", "\u653b\u6483\u529b"),
        ("DefenceBonus", "\u5b88\u5099\u529b"),
        ("AgilityBonus", "\u3059\u3070\u3084\u3055"),
        ("WisdomBonus", "\u304b\u3057\u3053\u3055"),
    ]
    for field, label in bonus_map:
        value = trait.get(field)
        if value is not None:
            return f"{label}\u304c{value}\u4e0a\u304c\u308b\u3002"

    # \u56fa\u6709\u7279\u6027\uff08\u82f1\u8a9e\u8aac\u660e\u304c\u5b9a\u578b\u5316\u3057\u306b\u304f\u3044\u3082\u306e\uff09
    exact = {
        69:"\u901a\u5e38\u653b\u6483\u6642\u3001\u3068\u304d\u3069\u304d\u6575\u306eMP\u3092\u5438\u53ce\u3059\u308b\u3002",
        100:"\u4f1a\u5fc3\u306e\u4e00\u6483\u3092\u51fa\u3059\u3068\u3001\u653b\u6483\u529b\u304c\u5927\u304d\u304f\u4e0a\u304c\u308b\u3002",
        77:"\u6df7\u4e71\u4e2d\u3067\u3082\u6575\u3092\u653b\u6483\u3057\u3001\u653b\u6483\u304c\u5f53\u305f\u308b\u3068\u4f1a\u5fc3\u306e\u4e00\u6483\u306b\u306a\u308b\u3002",
        93:"HP\u304c\u534a\u5206\u4ee5\u4e0b\u306b\u306a\u308b\u3068\u3001\u4e0e\u3048\u308b\u30c0\u30e1\u30fc\u30b8\u304c\u5897\u3048\u308b\u3002",
        88:"\u5012\u3055\u308c\u305f\u3068\u304d\u3001\u5473\u65b9\u5168\u4f53\u306e\u653b\u6483\u529b\u30fb\u5b88\u5099\u529b\u30fb\u3059\u3070\u3084\u3055\u30fb\u304b\u3057\u3053\u3055\u3092\u5927\u304d\u304f\u4e0a\u3052\u308b\u3002",
        73:"L\u30b5\u30a4\u30ba\u306e\u30e2\u30f3\u30b9\u30bf\u30fc\u306b\u4e0e\u3048\u308b\u30c0\u30e1\u30fc\u30b8\u304c\u5897\u3048\u308b\u3002",
        82:"\u5473\u65b9\u306e\u80fd\u529b\u4e0a\u6607\u52b9\u679c\u30925\u30bf\u30fc\u30f3\u306b\u5ef6\u9577\u3057\u3001\u3055\u3089\u306b\u7121\u6575\u30fb\u546a\u6587\u53cd\u5c04\u30fb\u30d6\u30ec\u30b9\u53cd\u5c04\u30fb\u307f\u304b\u308f\u3057\u4e0a\u6607\u306e\u3044\u305a\u308c\u304b\u3092\u4ed8\u4e0e\u3059\u308b\u3053\u3068\u304c\u3042\u308b\u3002",
        51:"\u6d88\u8cbbMP\u304c\u534a\u5206\u306b\u306a\u308b\u3002",
        84:"\u5012\u3055\u308c\u308b\u30c0\u30e1\u30fc\u30b8\u3092\u53d7\u3051\u3066\u3082\u3001\u3068\u304d\u3069\u304dHP1\u3067\u751f\u304d\u6b8b\u308b\u3002",
        97:"\u653b\u6483\u529b\u4f9d\u5b58\u3067\u5a01\u529b\u304c\u4e0a\u304c\u308b\u4e00\u90e8\u306e\u653b\u6483\u304c\u3001\u5358\u4f53\u3067\u306f\u306a\u304f\u6575\u5168\u4f53\u306b\u5f53\u305f\u308b\u3088\u3046\u306b\u306a\u308b\u3002",
        65:"\u901a\u5e38\u653b\u6483\u6642\u3001\u3068\u304d\u3069\u304d\u6575\u3092\u6df7\u4e71\u3055\u305b\u308b\u3002",
        121:"\u6575\u306b\u72b6\u614b\u7570\u5e38\u3092\u4e0e\u3048\u3084\u3059\u304f\u306a\u308b\u3002",
        67:"\u901a\u5e38\u653b\u6483\u6642\u3001\u3068\u304d\u3069\u304d\u6575\u3092\u5373\u6b7b\u3055\u305b\u308b\u3002",
        94:"HP\u304c\u534a\u5206\u4ee5\u4e0b\u306b\u306a\u308b\u3068\u3001\u53d7\u3051\u308b\u30c0\u30e1\u30fc\u30b8\u304c\u6e1b\u308b\u3002",
        48:"\u4f1a\u5fc3\u306e\u4e00\u6483\u3068\u66b4\u8d70\u3057\u305f\u546a\u6587\u306b\u3088\u308b\u30c0\u30e1\u30fc\u30b8\u3092\u7121\u52b9\u5316\u3059\u308b\u3002",
        42:"\u6575\u306e\u307f\u304b\u308f\u3057\u3092\u7121\u8996\u3057\u3066\u653b\u6483\u3092\u5f53\u3066\u308b\u3002",
        99:"\u3068\u304d\u3069\u304d\u540c\u3058\u546a\u6587\u30922\u56de\u9023\u7d9a\u3067\u5531\u3048\u308b\u3002\u305d\u306e\u969b\u3001\u901a\u5e38\u3088\u308a\u5c11\u3057\u591a\u304fMP\u3092\u6d88\u8cbb\u3059\u308b\u3002",
        95:"HP\u304c\u534a\u5206\u4ee5\u4e0b\u306b\u306a\u308b\u3068\u3001\u3068\u304d\u3069\u304d\u307f\u304b\u308f\u3057\u7387\u3068\u3059\u3070\u3084\u3055\u304c\u5927\u304d\u304f\u4e0a\u304c\u308b\u30021\u6226\u95d8\u306b\u3064\u304d1\u56de\u3060\u3051\u767a\u52d5\u3059\u308b\u3002",
        31:"\u56de\u5fa9\u7cfb\u306e\u7279\u6280\u30fb\u546a\u6587\u306e\u56de\u5fa9\u91cf\u304c\u5897\u3048\u3001\u6d88\u8cbbMP\u304c\u5c11\u306a\u304f\u306a\u308b\u3002",
        233:"\u6226\u95d8\u4e2d\u3001\u3068\u304d\u3069\u304d\u653b\u6483\u529b\u30fb\u5b88\u5099\u529b\u30fb\u3059\u3070\u3084\u3055\u30fb\u304b\u3057\u3053\u3055\u306e\u3044\u305a\u308c\u304b\u304c\u5927\u304d\u304f\u4e0a\u304c\u308b\u3002",
        19:"\u6226\u95d8\u4e2d\u3001\u3068\u304d\u3069\u304d\u5473\u65b9\u5168\u4f53\u306eHP\u309280\u4ee5\u4e0a\u56de\u5fa9\u3059\u308b\u3002\u304b\u3057\u3053\u3055\u304c\u9ad8\u3044\u307b\u3069\u56de\u5fa9\u91cf\u304c\u5897\u3048\u308b\u3002",
        34:"\u9593\u63a5\u653b\u6483\u3092\u3057\u3066\u304d\u305f\u6575\u3092\u3001\u3068\u304d\u3069\u304d\u6bd2\u72b6\u614b\u306b\u3059\u308b\u3002",
        38:"\u76f4\u63a5\u653b\u6483\u3092\u3057\u3066\u304d\u305f\u6575\u3092\u3001\u3068\u304d\u3069\u304d\u30de\u30d2\u3055\u305b\u308b\u3002",
        74:"\u6bd2\u30fb\u731b\u6bd2\u30fb\u4f11\u307f\u30fb\u7720\u308a\u30fb\u6df7\u4e71\u30fb\u30de\u30d2\u72b6\u614b\u306e\u6575\u306b\u4e0e\u3048\u308b\u30c0\u30e1\u30fc\u30b8\u304c\u5897\u3048\u308b\u3002",
        75:"\u6226\u95d8\u4e2d\u3001\u3068\u304d\u3069\u304d\u6575\u30921\u30bf\u30fc\u30f3\u4f11\u307f\u306b\u3059\u308b\u3002",
        21:"\u5473\u65b9\u304c\u5012\u308c\u305f\u3068\u304d\u30011\u4f53\u3092\u5fa9\u6d3b\u3055\u305b\u308b\u30021\u6226\u95d8\u306b\u3064\u304d1\u56de\u3060\u3051\u767a\u52d5\u3059\u308b\u3002",
        85:"\u5012\u3055\u308c\u308b\u30c0\u30e1\u30fc\u30b8\u3092\u53d7\u3051\u3066\u3082\u3001HP1\u3067\u751f\u304d\u6b8b\u308b\u3002",
        90:"3\u30e9\u30a6\u30f3\u30c9\u76ee\u4ee5\u964d\u306b\u653b\u6483\u529b\u30fb\u5b88\u5099\u529b\u30fb\u3059\u3070\u3084\u3055\u30fb\u304b\u3057\u3053\u3055\u304c\u4e0a\u304c\u308a\u30016\u30e9\u30a6\u30f3\u30c9\u76ee\u4ee5\u964d\u306f\u3055\u3089\u306b\u4e0a\u304c\u308b\u3002",
        72:"S\u30b5\u30a4\u30ba\u306e\u30e2\u30f3\u30b9\u30bf\u30fc\u306b\u4e0e\u3048\u308b\u30c0\u30e1\u30fc\u30b8\u304c\u5897\u3048\u308b\u3002",
        18:"\u6226\u95d8\u4e2d\u3001\u3068\u304d\u3069\u304d\u5473\u65b9\u5168\u4f53\u306eHP\u309230\u4ee5\u4e0a\u56de\u5fa9\u3059\u308b\u3002\u304b\u3057\u3053\u3055\u304c\u9ad8\u3044\u307b\u3069\u56de\u5fa9\u91cf\u304c\u5897\u3048\u308b\u3002",
        83:"\u6575\u306e\u80fd\u529b\u4f4e\u4e0b\u52b9\u679c\u30925\u30bf\u30fc\u30f3\u306b\u5ef6\u9577\u3057\u3001\u3055\u3089\u306b\u30d6\u30ec\u30b9\u5c01\u3058\u30fb\u4f1a\u5fc3\u5c01\u3058\u30fb\u546a\u6587\u5c01\u3058\u30fb\u5e7b\u60d1\u306e\u3044\u305a\u308c\u304b\u3092\u4e0e\u3048\u308b\u3053\u3068\u304c\u3042\u308b\u3002",
        70:"\u6575\u306b\u8ffd\u52a0\u30c0\u30e1\u30fc\u30b8\u3092\u4e0e\u3048\u308b\u3002\u30ec\u30d9\u30eb\u304c\u9ad8\u3044\u307b\u3069\u52b9\u679c\u304c\u4e0a\u304c\u308a\u3001\u30e1\u30bf\u30eb\u30dc\u30c7\u30a3\u6301\u3061\u306b\u3082\u6709\u52b9\u3002",
        71:"\u30e1\u30bf\u30eb\u30dc\u30c7\u30a3\u306b\u3088\u308b\u30c0\u30e1\u30fc\u30b8\u8efd\u6e1b\u52b9\u679c\u3092\u7121\u8996\u3057\u3066\u653b\u6483\u3059\u308b\u3002",
        239:"\u53d7\u3051\u308b\u30c0\u30e1\u30fc\u30b8\u30923\u5206\u306e1\u8efd\u6e1b\u3059\u308b\u4ee3\u308f\u308a\u306b\u3001\u546a\u6587\u3084\u7279\u6280\u306e\u6d88\u8cbbMP\u304c2\u500d\u306b\u306a\u308b\u3002",
        68:"\u901a\u5e38\u653b\u6483\u3067\u4e0e\u3048\u305f\u30c0\u30e1\u30fc\u30b8\u306e\u534a\u5206\u3060\u3051\u3001\u81ea\u5206\u306eHP\u3092\u56de\u5fa9\u3059\u308b\u3002",
        92:"\u30a2\u30af\u30bb\u30b5\u30ea\u30fc\u3092\u88c5\u5099\u3057\u3066\u3044\u306a\u3044\u3068\u3001\u4f1a\u5fc3\u306e\u4e00\u6483\u3084\u546a\u6587\u66b4\u8d70\u304c\u8d77\u3053\u308a\u3084\u3059\u304f\u306a\u308b\u3002",
        66:"\u901a\u5e38\u653b\u6483\u6642\u3001\u3068\u304d\u3069\u304d\u6575\u3092\u30de\u30d2\u3055\u305b\u308b\u3002",
        87:"\u5012\u3055\u308c\u305f\u3068\u304d\u3001\u6575\u5168\u4f53\u306b\u53cd\u6483\u30c0\u30e1\u30fc\u30b8\u3092\u4e0e\u3048\u308b\u3002HP\u3092\u8d85\u3048\u3066\u53d7\u3051\u305f\u30c0\u30e1\u30fc\u30b8\u304c\u5927\u304d\u3044\u307b\u3069\u53cd\u6483\u3082\u5f37\u304f\u306a\u308b\u3002",
        98:"\u81ea\u5206\u3092\u5012\u3057\u305f\u6575\u306e\u653b\u6483\u529b\u30fb\u5b88\u5099\u529b\u30fb\u3059\u3070\u3084\u3055\u30fb\u304b\u3057\u3053\u3055\u3092\u5927\u304d\u304f\u4e0b\u3052\u3001\u6b21\u306e\u30bf\u30fc\u30f3\u4f11\u307f\u306b\u3059\u308b\u3002",
        62:"\u901a\u5e38\u653b\u6483\u6642\u3001\u3068\u304d\u3069\u304d\u6575\u3092\u6bd2\u72b6\u614b\u306b\u3059\u308b\u3002",
        12:"\u6226\u95d8\u4e2d\u3001\u3068\u304d\u3069\u304d\u81ea\u5206\u306b\u30d4\u30aa\u30e9\u3092\u4f7f\u3046\u3002",
        11:"\u6226\u95d8\u4e2d\u3001\u3068\u304d\u3069\u304d\u81ea\u5206\u306b\u30b9\u30ab\u30e9\u3092\u4f7f\u3046\u3002",
        234:"\u6226\u95d8\u4e2d\u3001\u3068\u304d\u3069\u304d\u3044\u3066\u3064\u304f\u306f\u3069\u3046\u3092\u4f7f\u3046\u3002",
        14:"\u6226\u95d8\u4e2d\u3001\u3068\u304d\u3069\u304d\u81ea\u5206\u306b\u307e\u3082\u308a\u306e\u9727\u3092\u4f7f\u3046\u3002",
        17:"\u6226\u95d8\u4e2d\u3001\u3068\u304d\u3069\u304d\u3061\u304b\u3089\u305f\u3081\u3092\u4f7f\u3046\u3002",
        10:"\u6226\u95d8\u4e2d\u3001\u3068\u304d\u3069\u304d\u81ea\u5206\u306b\u30d0\u30a4\u30ad\u30eb\u30c8\u3092\u4f7f\u3046\u3002",
        16:"\u6226\u95d8\u4e2d\u3001\u3068\u304d\u3069\u304d\u3084\u307f\u306e\u306f\u3069\u3046\u3092\u4f7f\u3046\u3002",
        13:"\u6226\u95d8\u4e2d\u3001\u3068\u304d\u3069\u304d\u81ea\u5206\u306b\u30a4\u30f3\u30c6\u3092\u4f7f\u3046\u3002",
        15:"\u6226\u95d8\u4e2d\u3001\u3068\u304d\u3069\u304d\u3072\u304b\u308a\u306e\u306f\u3069\u3046\u3092\u4f7f\u3046\u3002",
        78:"\u7720\u3063\u3066\u3044\u308b\u9593\u3001\u6575\u5168\u4f53\u3092\u653b\u6483\u3059\u308b\u3002",
        64:"\u901a\u5e38\u653b\u6483\u6642\u3001\u3068\u304d\u3069\u304d\u6575\u3092\u7720\u3089\u305b\u308b\u3002",
        32:"\u76f4\u63a5\u653b\u6483\u3092\u3001\u3068\u304d\u3069\u304d\u7121\u52b9\u5316\u3057\u3066\u304b\u308f\u3059\u3002",
        86:"\u81ea\u5206\u3092\u5012\u3057\u305f\u6575\u306b\u53cd\u6483\u30c0\u30e1\u30fc\u30b8\u3092\u4e0e\u3048\u308b\u3002HP\u3092\u8d85\u3048\u3066\u53d7\u3051\u305f\u30c0\u30e1\u30fc\u30b8\u304c\u5927\u304d\u3044\u307b\u3069\u53cd\u6483\u3082\u5f37\u304f\u306a\u308b\u3002",
        36:"\u76f4\u63a5\u653b\u6483\u3092\u3057\u3066\u304d\u305f\u6575\u3092\u3001\u3068\u304d\u3069\u304d\u7720\u3089\u305b\u308b\u3002",
        33:"\u76f4\u63a5\u653b\u6483\u3067\u53d7\u3051\u305f\u30c0\u30e1\u30fc\u30b8\u306e4\u5206\u306e1\u3092\u3001\u653b\u6483\u3057\u3066\u304d\u305f\u6575\u306b\u8fd4\u3059\u3002",
        39:"\u76f4\u63a5\u653b\u6483\u3092\u3057\u3066\u304d\u305f\u6575\u304b\u3089\u3001\u3068\u304d\u3069\u304dMP\u3092\u5438\u53ce\u3059\u308b\u3002",
        79:"\u81ea\u5206\u304c\u30de\u30d2\u3057\u3066\u3044\u308b\u3068\u304d\u3001\u76f4\u63a5\u653b\u6483\u3057\u3066\u304d\u305f\u6575\u3092\u3068\u304d\u3069\u304d\u30de\u30d2\u3055\u305b\u308b\u3002",
        76:"\u6226\u95d8\u4e2d\u3001\u3068\u304d\u3069\u304d\u6575\u30921\u30bf\u30fc\u30f3\u4f11\u307f\u306b\u3059\u308b\u3002",
        89:"3\u30e9\u30a6\u30f3\u30c9\u76ee\u307e\u3067\u306f\u4e0e\u3048\u308b\u30c0\u30e1\u30fc\u30b8\u304c\u5897\u3048\u308b\u304c\u30014\u30e9\u30a6\u30f3\u30c9\u76ee\u4ee5\u964d\u306f\u6e1b\u308b\u3002",
        35:"\u76f4\u63a5\u653b\u6483\u3092\u3057\u3066\u304d\u305f\u6575\u3092\u3001\u3068\u304d\u3069\u304d1\u30bf\u30fc\u30f3\u4f11\u307f\u306b\u3059\u308b\u3002",
        63:"\u901a\u5e38\u653b\u6483\u6642\u3001\u3068\u304d\u3069\u304d\u6575\u30921\u30bf\u30fc\u30f3\u4f11\u307f\u306b\u3059\u308b\u3002",
        37:"\u76f4\u63a5\u653b\u6483\u3092\u3057\u3066\u304d\u305f\u6575\u3092\u3001\u3068\u304d\u3069\u304d\u6df7\u4e71\u3055\u305b\u308b\u3002",
        2:"1\u30bf\u30fc\u30f3\u306b\u5fc5\u305a2\u56de\u884c\u52d5\u3059\u308b\u3002\u547d\u4ee4\u3057\u306a\u3044\u5834\u5408\u3082\u884c\u52d5\u56de\u6570\u306f\u5909\u308f\u3089\u305a\u3001\u80fd\u529b\u5024\u304c\u5c11\u3057\u4e0b\u304c\u308b\u3002",
        3:"1\u30bf\u30fc\u30f3\u306b1\uff5e3\u56de\u884c\u52d5\u3059\u308b\u3002\u547d\u4ee4\u3057\u306a\u3044\u5834\u5408\u3082\u884c\u52d5\u56de\u6570\u306f\u5909\u308f\u3089\u305a\u3001\u80fd\u529b\u5024\u304c\u5c11\u3057\u4e0b\u304c\u308b\u3002",
        4:"1\u30bf\u30fc\u30f3\u306b2\uff5e3\u56de\u884c\u52d5\u3059\u308b\u3002\u547d\u4ee4\u3057\u306a\u3044\u5834\u5408\u3082\u884c\u52d5\u56de\u6570\u306f\u5909\u308f\u3089\u305a\u3001\u80fd\u529b\u5024\u304c\u4e0b\u304c\u308b\u3002",
        1:"1\u30bf\u30fc\u30f3\u306b1\uff5e2\u56de\u884c\u52d5\u3059\u308b\u3002\u547d\u4ee4\u3057\u306a\u3044\u5834\u5408\u3082\u884c\u52d5\u56de\u6570\u306f\u5909\u308f\u3089\u305a\u3001\u80fd\u529b\u5024\u304c\u308f\u305a\u304b\u306b\u4e0b\u304c\u308b\u3002",
        91:"\u81ea\u5206\u304c\u72b6\u614b\u7570\u5e38\u306b\u3055\u308c\u305f\u3068\u304d\u3001\u76f8\u624b\u306b\u3082\u540c\u3058\u72b6\u614b\u7570\u5e38\u3092\u8fd4\u3059\u3002",
        101:"\u546a\u6587\u304c\u66b4\u8d70\u3059\u308b\u3068\u3001\u304b\u3057\u3053\u3055\u304c\u5927\u304d\u304f\u4e0a\u304c\u308b\u3002",
        56:"\u9b54\u7363\u7cfb\u306e\u6575\u306b\u4e0e\u3048\u308b\u30c0\u30e1\u30fc\u30b8\u304c\u5927\u304d\u304f\u5897\u3048\u308b\u4ee3\u308f\u308a\u306b\u3001\u81ea\u5206\u306e\u5168\u8010\u6027\u304c\u5c11\u3057\u4e0b\u304c\u308b\u3002",
        231:"\uff1f\uff1f\uff1f\u7cfb\u306e\u6575\u306b\u4e0e\u3048\u308b\u30c0\u30e1\u30fc\u30b8\u304c\u5927\u304d\u304f\u5897\u3048\u308b\u4ee3\u308f\u308a\u306b\u3001\u81ea\u5206\u306e\u5168\u8010\u6027\u304c\u5c11\u3057\u4e0b\u304c\u308b\u3002",
        242:"\u60aa\u9b54\u7cfb\u306e\u6575\u306b\u4e0e\u3048\u308b\u30c0\u30e1\u30fc\u30b8\u304c\u5927\u304d\u304f\u5897\u3048\u308b\u4ee3\u308f\u308a\u306b\u3001\u81ea\u5206\u306e\u5168\u8010\u6027\u304c\u5c11\u3057\u4e0b\u304c\u308b\u3002",
        55:"\u30c9\u30e9\u30b4\u30f3\u7cfb\u306e\u6575\u306b\u4e0e\u3048\u308b\u30c0\u30e1\u30fc\u30b8\u304c\u5927\u304d\u304f\u5897\u3048\u308b\u4ee3\u308f\u308a\u306b\u3001\u81ea\u5206\u306e\u5168\u8010\u6027\u304c\u5c11\u3057\u4e0b\u304c\u308b\u3002",
        61:"\u7269\u8cea\u7cfb\u306e\u6575\u306b\u4e0e\u3048\u308b\u30c0\u30e1\u30fc\u30b8\u304c\u5927\u304d\u304f\u5897\u3048\u308b\u4ee3\u308f\u308a\u306b\u3001\u81ea\u5206\u306e\u5168\u8010\u6027\u304c\u5c11\u3057\u4e0b\u304c\u308b\u3002",
        57:"\u81ea\u7136\u7cfb\u306e\u6575\u306b\u4e0e\u3048\u308b\u30c0\u30e1\u30fc\u30b8\u304c\u5927\u304d\u304f\u5897\u3048\u308b\u4ee3\u308f\u308a\u306b\u3001\u81ea\u5206\u306e\u5168\u8010\u6027\u304c\u5c11\u3057\u4e0b\u304c\u308b\u3002",
        232:"\u30b9\u30e9\u30a4\u30e0\u7cfb\u306e\u6575\u306b\u4e0e\u3048\u308b\u30c0\u30e1\u30fc\u30b8\u304c\u5927\u304d\u304f\u5897\u3048\u308b\u4ee3\u308f\u308a\u306b\u3001\u81ea\u5206\u306e\u5168\u8010\u6027\u304c\u5c11\u3057\u4e0b\u304c\u308b\u3002",
        60:"\u30be\u30f3\u30d3\u7cfb\u306e\u6575\u306b\u4e0e\u3048\u308b\u30c0\u30e1\u30fc\u30b8\u304c\u5927\u304d\u304f\u5897\u3048\u308b\u4ee3\u308f\u308a\u306b\u3001\u81ea\u5206\u306e\u5168\u8010\u6027\u304c\u5c11\u3057\u4e0b\u304c\u308b\u3002",
        96:"\u6b8b\u308aHP\u304c\u5c11\u306a\u3044\u307b\u3069\u3001\u4e0e\u3048\u308b\u30c0\u30e1\u30fc\u30b8\u304c\u5897\u3048\u308b\u3002",
        205:"\u6226\u95d8\u4e2d\u3001\u3068\u304d\u3069\u304d\u5473\u65b9\u5168\u4f53\u306eMP\u30921\u4ee5\u4e0a\u56de\u5fa9\u3059\u308b\u3002\u30ec\u30d9\u30eb\u304c\u9ad8\u3044\u307b\u3069\u56de\u5fa9\u91cf\u304c\u5897\u3048\u308b\u3002",
        20:"\u6226\u95d8\u4e2d\u3001\u3068\u304d\u3069\u304d\u5473\u65b9\u5168\u4f53\u306eMP\u30925\u4ee5\u4e0a\u56de\u5fa9\u3059\u308b\u3002\u304b\u3057\u3053\u3055\u304c\u9ad8\u3044\u307b\u3069\u56de\u5fa9\u91cf\u304c\u5897\u3048\u308b\u3002",
    }

    if trait_id in exact:
        return exact[trait_id]

    # \u5b9a\u578b\u7ffb\u8a33
    element_map = {
        "fire-elemental":"\u706b",
        "ice-elemental":"\u6c37\u7d50",
        "water-elemental":"\u6c34",
        "wind-elemental":"\u98a8",
        "earth-elemental":"\u5730",
        "explosion":"\u7206\u767a",
        "electrical":"\u96fb\u6483",
        "light-elemental":"\u5149",
        "dark-elemental":"\u95c7",
    }

    family_map = {
        "beast":"\u9b54\u7363",
        "demon":"\u60aa\u9b54",
        "dragon":"\u30c9\u30e9\u30b4\u30f3",
        "material":"\u7269\u8cea",
        "nature":"\u81ea\u7136",
        "slime":"\u30b9\u30e9\u30a4\u30e0",
        "undead":"\u30be\u30f3\u30d3",
        "???":"\uff1f\uff1f\uff1f",
    }

    resistance_map = {
        "poison and severe poison":"\u6bd2\u30fb\u731b\u6bd2",
        "paralysis":"\u30de\u30d2",
        "sleep":"\u7720\u308a",
        "being put to sleep":"\u7720\u308a",
        "confusion":"\u6df7\u4e71",
        "instant death":"\u5373\u6b7b",
        "bedazzlement":"\u5e7b\u60d1",
        "antimagic":"\u5c01\u3058",
        "MP absorption":"MP\u5438\u53ce",
        "being stunned":"\u4f11\u307f",
        "stun":"\u4f11\u307f",
        "debilitation":"\u5f31\u4f53\u5316",
        "fire-elemental attacks":"\u706b\u5c5e\u6027",
        "ice-elemental attacks":"\u6c37\u7d50\u5c5e\u6027",
        "water-elemental attacks":"\u6c34\u5c5e\u6027",
        "wind-elemental attacks":"\u98a8\u5c5e\u6027",
        "earth-elemental attacks":"\u5730\u5c5e\u6027",
        "explosion attacks":"\u7206\u767a\u5c5e\u6027",
        "electrical attacks":"\u96fb\u6483\u5c5e\u6027",
        "light-elemental attacks":"\u5149\u5c5e\u6027",
        "dark-elemental attacks":"\u95c7\u5c5e\u6027",
    }

    m = re.fullmatch(
        r"Increases the potency of (.+) attacks and decreases their MP consumption\.",
        description,
    )
    if m:
        e = element_map.get(m.group(1))
        if e:
            return f"{e}\u5c5e\u6027\u306e\u653b\u6483\u304c\u5f37\u304f\u306a\u308a\u3001\u6d88\u8cbbMP\u3082\u5c11\u306a\u304f\u306a\u308b\u3002"

    m = re.fullmatch(
        r"Slightly increases the damage inflicted by (.+) attacks\.",
        description,
    )
    if m:
        e = element_map.get(m.group(1))
        if e:
            return f"{e}\u5c5e\u6027\u306e\u653b\u6483\u3067\u30c0\u30e1\u30fc\u30b8\u3092\u4e0e\u3048\u3084\u3059\u304f\u306a\u308b\u3002"

    m = re.fullmatch(
        r"Greatly increases the damage inflicted by (.+) attacks\.",
        description,
    )
    if m:
        e = element_map.get(m.group(1))
        if e:
            return f"{e}\u5c5e\u6027\u306e\u653b\u6483\u3067\u30c0\u30e1\u30fc\u30b8\u3092\u5927\u304d\u304f\u4e0e\u3048\u3084\u3059\u304f\u306a\u308b\u3002"

    for pattern, degree in [
        (r"Slightly increases resistance to (.+)\.", "\u5c11\u3057"),
        (r"Greatly increases resistance to (.+)\.", "\u5927\u304d\u304f"),
        (r"Increases resistance to (.+)\.", ""),
    ]:
        m = re.fullmatch(pattern, description)
        if m:
            target = resistance_map.get(m.group(1))
            if target:
                return f"{target}\u3078\u306e\u8010\u6027\u304c{degree}\u4e0a\u304c\u308b\u3002" if degree else f"{target}\u3078\u306e\u8010\u6027\u304c\u4e0a\u304c\u308b\u3002"

    m = re.fullmatch(
        r"Increases damage inflicted on monsters from the (.+) family and slightly lowers all resistances\.",
        description,
    )
    if m:
        family = family_map.get(m.group(1), "\u5bfe\u8c61")
        return f"{family}\u7cfb\u306e\u6575\u306b\u4e0e\u3048\u308b\u30c0\u30e1\u30fc\u30b8\u304c\u5897\u3048\u308b\u4ee3\u308f\u308a\u306b\u3001\u81ea\u5206\u306e\u5168\u8010\u6027\u304c\u5c11\u3057\u4e0b\u304c\u308b\u3002"

    action_map = {
        "absorb MP":"MP\u3092\u5438\u53ce\u3057",
        "paralyse the enemy":"\u6575\u3092\u30de\u30d2\u3055\u305b",
        "poison or severely poison the enemy":"\u6575\u3092\u6bd2\u30fb\u731b\u6bd2\u306b\u3057",
        "put the enemy to sleep":"\u6575\u3092\u7720\u3089\u305b",
        "prevent spellcasting":"\u6575\u306e\u546a\u6587\u3092\u5c01\u3058",
        "stun the enemy":"\u6575\u3092\u4f11\u307f\u306b\u3057",
        "kill the enemy instantly":"\u6575\u3092\u5373\u6b7b\u3055\u305b",
        "inflict status ailments on the enemy":"\u6575\u306b\u72b6\u614b\u7570\u5e38\u3092\u4e0e\u3048",
    }

    for prefix, degree in [
        ("Makes it much easier to ", "\u304b\u306a\u308a"),
        ("Makes it moderately easier to ", ""),
        ("Makes it somewhat easier to ", "\u3084\u3084"),
        ("Makes it easier to ", ""),
    ]:
        if description.startswith(prefix):
            action = description[len(prefix):].rstrip(".")
            jp = action_map.get(action)
            if jp:
                return f"{jp}{degree}\u3084\u3059\u304f\u306a\u308b\u3002"

    m = re.fullmatch(
        r"Restores a small amount of (HP|MP) after each action\.",
        description,
    )
    if m:
        return f"\u884c\u52d5\u5f8c\u306b\u6bce\u56de\u3001{m.group(1)}\u3092\u5c11\u3057\u56de\u5fa9\u3059\u308b\u3002"

    # \u3053\u3053\u306b\u6765\u3066\u3082\u82f1\u8a9e\u306f\u8868\u793a\u3057\u306a\u3044
    return f"{jp_name}\u306e\u56fa\u6709\u52b9\u679c\u3002\u8a73\u7d30\u306f\u30b2\u30fc\u30e0\u5185\u306e\u7279\u6027\u8aac\u660e\u306b\u6e96\u3058\u308b\u3002"

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
            "stats": {
                "hp": int(monster.get("MaxHP") or 0),
                "mp": int(monster.get("MaxMP") or 0),
                "attack": int(monster.get("MaxAtt") or 0),
                "defence": int(monster.get("MaxDef") or 0),
                "agility": int(monster.get("MaxAgi") or 0),
                "wisdom": int(monster.get("MaxWis") or 0),
            },
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

# rebuild-trigger-v18
