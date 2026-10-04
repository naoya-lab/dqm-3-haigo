#!/usr/bin/env python3
# DQM3 full database builder
# Factual game data is collected from public DQM3 reference pages.
# The script intentionally stores only names/ranks/families and synthesis facts, not article prose or images.

import json, re, time, unicodedata
from pathlib import Path
from urllib.parse import urljoin
import requests
from bs4 import BeautifulSoup

BASE="https://kyokugen.info/dqm3/db/"
FAMILY_PAGES={
 "スライム系":"dqm3_mnlk_01.html",
 "ドラゴン系":"dqm3_mnlk_02.html",
 "自然系":"dqm3_mnlk_03.html",
 "魔獣系":"dqm3_mnlk_04.html",
 "物質系":"dqm3_mnlk_05.html",
 "悪魔系":"dqm3_mnlk_06.html",
 "ゾンビ系":"dqm3_mnlk_07.html",
 "？？？系":"dqm3_mnlk_08.html",
}
S=requests.Session()
S.headers.update({"User-Agent":"Mozilla/5.0 DQM3-personal-offline-index/1.0"})

def kata_to_hira(s):
    out=[]
    for c in s:
        o=ord(c)
        if 0x30A1<=o<=0x30F6: out.append(chr(o-0x60))
        else: out.append(c)
    return ''.join(out)

def clean_name_from_combined(text):
    t=re.sub(r'\s+','',text or '')
    # Common site format: reading + display name.
    # 1) exact duplicated all-hiragana
    if len(t)%2==0 and t[:len(t)//2]==t[len(t)//2:]:
        return t[len(t)//2:], t[:len(t)//2]
    # 2) find split where right side, converted from katakana, matches left reading.
    for i in range(1,len(t)):
        left,right=t[:i],t[i:]
        if re.fullmatch(r'[ぁ-ゖー]+',left) and kata_to_hira(right)==left:
            return right,left
    # 3) display name begins at first kanji/katakana/latin/number/symbol.
    m=re.search(r'[^ぁ-ゖー]',t)
    if m and m.start()>0:
        return t[m.start():],t[:m.start()]
    return t,''

def get(url, tries=3):
    for i in range(tries):
        r=S.get(url,timeout=30)
        if r.ok: return r
        time.sleep(1+i)
    r.raise_for_status()

def parse_index():
    mons=[]
    seen=set()
    for family,path in FAMILY_PAGES.items():
        soup=BeautifulSoup(get(urljoin(BASE,path)).text,'html.parser')
        # Find table rows containing monster links.
        for tr in soup.find_all('tr'):
            tds=tr.find_all(['td','th'])
            if len(tds)<3: continue
            no_txt=tds[0].get_text(" ",strip=True)
            if not re.fullmatch(r'\d{1,3}|-',no_txt): continue
            a=tds[1].find('a',href=True)
            if not a: continue
            href=urljoin(BASE,a['href'])
            combined=a.get_text("",strip=True)
            name,reading=clean_name_from_combined(combined)
            rank_txt=tds[2].get_text("",strip=True)
            rank=re.sub(r'^\d+','',rank_txt)
            key=href
            if key in seen: continue
            seen.add(key)
            mons.append({
                "no": None if no_txt=="-" else no_txt.zfill(3),
                "name":name,"reading":reading,"rank":rank,"family":family,
                "_url":href,"recipes":[]
            })
        time.sleep(.25)
    return mons

def heading_after(soup, needle):
    for h in soup.find_all(['h2','h3','h4']):
        if needle in h.get_text(" ",strip=True): return h
    return None

def until_next_heading(h):
    cur=h.find_next_sibling() if h else None
    out=[]
    while cur:
        if cur.name in ['h2','h3','h4']: break
        out.append(cur); cur=cur.find_next_sibling()
    return out

def extract_table_recipes(nodes, result, typ):
    out=[]
    for node in nodes:
        for table in ([node] if getattr(node,'name',None)=='table' else node.find_all('table')):
            for tr in table.find_all('tr'):
                cells=tr.find_all(['td','th'])
                if len(cells)<2: continue
                # First cell commonly contains both parents separated by <br>; second cell is child.
                left=[x.strip() for x in cells[0].get_text("\n",strip=True).splitlines() if x.strip()]
                right=[x.strip() for x in cells[-1].get_text("\n",strip=True).splitlines() if x.strip()]
                if not left or not right: continue
                child=right[-1]
                parents=left
                if child==result and len(parents)>=2:
                    out.append({"type":typ,"parents":parents[:4],"result":result})
                elif len(cells)>=3:
                    allc=[[x.strip() for x in c.get_text("\n",strip=True).splitlines() if x.strip()] for c in cells]
                    child=allc[-1][-1] if allc[-1] else ''
                    parents=[x for group in allc[:-1] for x in group]
                    if child==result and len(parents)>=2:
                        out.append({"type":typ,"parents":parents[:4],"result":result})
    return out

def parse_detail(m):
    soup=BeautifulSoup(get(m["_url"]).text,'html.parser')
    h1=soup.find('h1')
    if h1:
        mm=re.search(r'\n?(.+?)の詳細',h1.get_text(" ",strip=True))
        if mm:
            nm=mm.group(1).strip()
            if nm and nm!="ドラクエモンスターズ3": m["name"]=nm

    # Normal synthesis is often prose like "スライム系 × ゾンビ系(少なくとも片方がEランク)"
    h=heading_after(soup,"通常配合")
    if h:
        txt="\n".join(n.get_text(" ",strip=True) for n in until_next_heading(h))
        mm=re.search(r'([^。\n]+?系)\s*[×xX]\s*([^。\n]+?系(?:\([^)]*\))?)',txt)
        if mm:
            p1=mm.group(1).strip()
            p2=mm.group(2).strip()
            m["recipes"].append({"type":"通常","parents":[p1,p2],"result":m["name"]})

    h=heading_after(soup,"特殊配合(種族/種族系統)")
    if h:
        m["recipes"].extend(extract_table_recipes(until_next_heading(h),m["name"],"特殊"))

    h=heading_after(soup,"四体配合の組み合わせ")
    if h:
        m["recipes"].extend(extract_table_recipes(until_next_heading(h),m["name"],"四体"))

    # de-dup
    uniq=[]; keys=set()
    for r in m["recipes"]:
        k=(r["type"],tuple(r["parents"]),r["result"])
        if k not in keys: keys.add(k); uniq.append(r)
    m["recipes"]=uniq

def build_uses(mons):
    byname={m["name"]:m for m in mons}
    for m in mons: m["uses"]=[]
    for target in mons:
        for r in target.get("recipes",[]):
            ps=r.get("parents",[])
            for i,p in enumerate(ps):
                if p in byname:
                    others=ps[:i]+ps[i+1:]
                    byname[p]["uses"].append({"type":r["type"],"source":p,"otherParents":others,"result":target["name"]})
    for m in mons:
        seen=set(); u=[]
        for x in m["uses"]:
            k=(x["type"],tuple(x["otherParents"]),x["result"])
            if k not in seen: seen.add(k); u.append(x)
        m["uses"]=u

def main():
    mons=parse_index()
    print("index monsters:",len(mons))
    for i,m in enumerate(mons,1):
        try:
            parse_detail(m)
        except Exception as e:
            print("WARN",i,m.get("name"),e)
        if i%25==0: print("details",i,"/",len(mons))
        time.sleep(.12)
    build_uses(mons)
    for m in mons: m.pop("_url",None)
    mons.sort(key=lambda x: (9999 if not x["no"] else int(x["no"]), x["name"]))
    out={"generatedAt":time.strftime("%Y-%m-%dT%H:%M:%SZ",time.gmtime()),"count":len(mons),"monsters":mons}
    Path("data.json").write_text(json.dumps(out,ensure_ascii=False,indent=2),encoding="utf-8")
    print("wrote",len(mons),"monsters")

if __name__=="__main__":
    main()
