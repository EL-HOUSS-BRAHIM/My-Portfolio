#!/usr/bin/env python3
"""Export static legacy article text for editorial review; never executes PHP."""
from html.parser import HTMLParser
from pathlib import Path
import json, re, sys

class Article(HTMLParser):
    def __init__(self):
        super().__init__(); self.parts=[]; self.depth=0; self.title=[]; self.in_title=False
    def handle_starttag(self,tag,attrs):
        attrs=dict(attrs)
        if tag=='h1': self.in_title=True
        if 'article-content' in attrs.get('class','').split() and not self.depth:
            self.depth=1; return
        if not self.depth:return
        if tag=='div':self.depth+=1
        if tag in ('h2','h3'):self.parts.append('\n\n'+('#'*(2 if tag=='h2' else 3))+' ')
        elif tag=='li':self.parts.append('\n- ')
        elif tag=='p':self.parts.append('\n\n')
        elif tag=='pre':self.parts.append('\n\n```\n')
        elif tag=='br':self.parts.append('\n')
    def handle_endtag(self,tag):
        if tag=='h1':self.in_title=False
        if self.depth and tag=='div':self.depth-=1
        if self.depth and tag=='pre':self.parts.append('\n```\n')
    def handle_data(self,data):
        if self.in_title:self.title.append(data)
        if self.depth:self.parts.append(data)

if len(sys.argv)!=2:raise SystemExit('Usage: python scripts/export-legacy-posts.py /secure/posts.draft.json')
root=Path(__file__).resolve().parents[2]; posts=[]
for index,path in enumerate(sorted((root/'blog').glob('*.php'))):
    parser=Article();parser.feed(re.sub(r'<\?php.*?\?>','',path.read_text(),flags=re.S))
    body=re.sub(r'\n[ \t]+','\n',''.join(parser.parts)).strip()
    posts.append({'id':path.stem,'slug':path.stem,'title':''.join(parser.title).strip(),'description':body,'short_description':'Legacy article awaiting factual and editorial review.','order_position':index})
Path(sys.argv[1]).write_text(json.dumps({'posts':posts},ensure_ascii=False,indent=2)+'\n')
print(f'Exported {len(posts)} draft articles. Review personal claims and TODO placeholders before importing/publishing.')
