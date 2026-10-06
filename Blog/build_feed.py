"""Builds Blog/feed.xml (RSS 2.0) from the post tiles in Blog/index.html.

Run after adding a post:  python Blog/build_feed.py
"""
import html, os, re
from datetime import datetime, timezone
from email.utils import format_datetime

SITE = "https://www.ruchith.space"
HERE = os.path.dirname(os.path.abspath(__file__))
page = open(os.path.join(HERE, "index.html"), encoding="utf8").read()

def text(s):
    return html.unescape(re.sub(r"<[^>]+>", "", s)).strip()

items = []
for tile in re.findall(r'<a class="blog-tile".*?</a>', page, flags=re.S):
    href = re.search(r'href="([^"]+)"', tile).group(1)
    if href.startswith("post-slug/"):          # the commented-out example tile
        continue
    title = text(re.search(r"<h3>(.*?)</h3>", tile, flags=re.S).group(1))
    summary = text(re.search(r"<p>(.*?)</p>", tile, flags=re.S).group(1))
    date = re.search(r'<time datetime="([\d-]+)"', tile).group(1)
    tags = [t.strip() for t in (re.search(r'data-tags="([^"]*)"', tile) or [None, ""])[1].split(",") if t.strip()]
    url = f"{SITE}/Blog/{href}"
    when = datetime.strptime(date, "%Y-%m-%d").replace(tzinfo=timezone.utc)
    items.append((when, title, url, summary, tags))

items.sort(reverse=True)
esc = lambda s: html.escape(s, quote=False)
entries = "".join(
    f"""
    <item>
      <title>{esc(t)}</title>
      <link>{u}</link>
      <guid isPermaLink="true">{u}</guid>
      <pubDate>{format_datetime(w)}</pubDate>
      <description>{esc(s)}</description>{''.join(f'''
      <category>{esc(c)}</category>''' for c in tags)}
    </item>"""
    for w, t, u, s, tags in items
)
latest = items[0][0] if items else datetime.now(timezone.utc)
feed = f"""<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Ruchith Balam: Blog</title>
    <link>{SITE}/Blog/index.html</link>
    <atom:link href="{SITE}/Blog/feed.xml" rel="self" type="application/rss+xml"/>
    <description>Notes on LLM pipelines, AI evaluation and ML engineering.</description>
    <language>en</language>
    <lastBuildDate>{format_datetime(latest)}</lastBuildDate>{entries}
  </channel>
</rss>
"""
open(os.path.join(HERE, "feed.xml"), "w", encoding="utf8", newline="\n").write(feed)
print(f"feed.xml written with {len(items)} post(s)")
