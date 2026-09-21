const FEEDS = {
  world: [
    { name: 'BBC World', url: 'https://feeds.bbci.co.uk/news/world/rss.xml' },
    { name: 'Sky News World', url: 'https://feeds.skynews.com/feeds/rss/world.xml' }
  ],
  technology: [
    { name: 'BBC Technology', url: 'https://feeds.bbci.co.uk/news/technology/rss.xml' },
    { name: 'Ars Technica', url: 'https://feeds.arstechnica.com/arstechnica/index' }
  ],
  business: [
    { name: 'BBC Business', url: 'https://feeds.bbci.co.uk/news/business/rss.xml' },
    { name: 'Sky News Business', url: 'https://feeds.skynews.com/feeds/rss/business.xml' }
  ],
  sports: [
    { name: 'BBC Sport', url: 'https://feeds.bbci.co.uk/sport/rss.xml' },
    { name: 'Sky Sports', url: 'https://www.skysports.com/rss/12040' }
  ],
  health: [{ name: 'BBC Health', url: 'https://feeds.bbci.co.uk/news/health/rss.xml' }],
  science: [{ name: 'BBC Science & Environment', url: 'https://feeds.bbci.co.uk/news/science_and_environment/rss.xml' }],
  entertainment: [{ name: 'BBC Entertainment & Arts', url: 'https://feeds.bbci.co.uk/news/entertainment_and_arts/rss.xml' }]
};

const REGIONAL_FEEDS = {
  GB: [
    { name: 'BBC UK', url: 'https://feeds.bbci.co.uk/news/uk/rss.xml' },
    { name: 'Sky News UK', url: 'https://feeds.skynews.com/feeds/rss/uk.xml' }
  ],
  US: [
    { name: 'BBC US & Canada', url: 'https://feeds.bbci.co.uk/news/world/us_and_canada/rss.xml' }
  ],
  CA: [
    { name: 'BBC US & Canada', url: 'https://feeds.bbci.co.uk/news/world/us_and_canada/rss.xml' }
  ],
  AU: [
    { name: 'BBC Asia', url: 'https://feeds.bbci.co.uk/news/world/asia/rss.xml' }
  ],
  IN: [
    { name: 'BBC Asia', url: 'https://feeds.bbci.co.uk/news/world/asia/rss.xml' }
  ],
  SG: [
    { name: 'BBC Asia', url: 'https://feeds.bbci.co.uk/news/world/asia/rss.xml' }
  ],
  JP: [
    { name: 'BBC Asia', url: 'https://feeds.bbci.co.uk/news/world/asia/rss.xml' }
  ],
  AE: [
    { name: 'BBC Middle East', url: 'https://feeds.bbci.co.uk/news/world/middle_east/rss.xml' }
  ],
  DE: [
    { name: 'BBC Europe', url: 'https://feeds.bbci.co.uk/news/world/europe/rss.xml' }
  ],
  FR: [
    { name: 'BBC Europe', url: 'https://feeds.bbci.co.uk/news/world/europe/rss.xml' }
  ]
};

const MAX_ITEMS = 35;
const FETCH_TIMEOUT_MS = 8500;

function decodeXml(value = '') {
  return String(value)
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)));
}

function stripHtml(value = '') {
  return decodeXml(value)
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function tag(block, name) {
  const escaped = name.replace(':', '\\:');
  const match = block.match(new RegExp(`<${escaped}\\b[^>]*>([\\s\\S]*?)<\\/${escaped}>`, 'i'));
  return match ? decodeXml(match[1]).trim() : '';
}

function attr(block, tagName, attrName) {
  const escaped = tagName.replace(':', '\\:');
  const match = block.match(new RegExp(`<${escaped}\\b[^>]*\\b${attrName}=["']([^"']+)["'][^>]*>`, 'i'));
  return match ? decodeXml(match[1]).trim() : '';
}

function firstImage(html = '') {
  const match = decodeXml(html).match(/<img\b[^>]*\bsrc=["']([^"']+)["']/i);
  return match ? decodeXml(match[1]) : '';
}

function safeHttpUrl(value = '') {
  try {
    const url = new URL(value);
    return ['http:', 'https:'].includes(url.protocol) ? url.href : '';
  } catch { return ''; }
}

function hashString(str = '') {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
  return (h >>> 0).toString(36);
}

function parseRss(xml, category, source) {
  const blocks = xml.match(/<item\b[\s\S]*?<\/item>/gi) || xml.match(/<entry\b[\s\S]*?<\/entry>/gi) || [];
  return blocks.slice(0, MAX_ITEMS).map(block => {
    const title = stripHtml(tag(block, 'title'));
    let link = stripHtml(tag(block, 'link')) || attr(block, 'link', 'href');
    link = safeHttpUrl(link);
    const descriptionRaw = tag(block, 'description') || tag(block, 'summary') || tag(block, 'content:encoded') || tag(block, 'content');
    const description = stripHtml(descriptionRaw);
    const dateRaw = stripHtml(tag(block, 'pubDate') || tag(block, 'published') || tag(block, 'updated'));
    const parsedDate = new Date(dateRaw || Date.now());
    let image = attr(block, 'enclosure', 'url') || attr(block, 'media:content', 'url') || attr(block, 'media:thumbnail', 'url') || firstImage(descriptionRaw);
    image = safeHttpUrl(image);
    if (!title || !link) return null;
    const id = hashString(link || title);
    return {
      id,
      title,
      link,
      description: description || `Read the latest ${category} report from ${source}.`,
      pubDate: Number.isNaN(parsedDate.getTime()) ? new Date().toISOString() : parsedDate.toISOString(),
      image: image ? `/api/image?url=${encodeURIComponent(image)}` : '',
      category,
      source
    };
  }).filter(Boolean);
}

async function fetchXml(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      redirect: 'follow',
      headers: {
        'accept': 'application/rss+xml, application/atom+xml, application/xml, text/xml, */*',
        'user-agent': 'GlobalNewsHub/1.0 (+Netlify Function)'
      }
    });
    if (!response.ok) throw new Error(`upstream HTTP ${response.status}`);
    const text = await response.text();
    if (!text || text.length < 80) throw new Error('upstream returned an empty feed');
    return text;
  } finally { clearTimeout(timer); }
}

function json(statusCode, body, extraHeaders = {}) {
  return {
    statusCode,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'public, max-age=120, s-maxage=300, stale-while-revalidate=900',
      'access-control-allow-origin': 'https://tubular-dango-8a8844.netlify.app',
      'x-content-type-options': 'nosniff',
      ...extraHeaders
    },
    body: JSON.stringify(body)
  };
}

async function handler(event) {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: { 'access-control-allow-origin': 'https://tubular-dango-8a8844.netlify.app', 'access-control-allow-methods': 'GET, OPTIONS', 'access-control-allow-headers': 'Content-Type', 'x-content-type-options': 'nosniff' }, body: '' };
  }
  if (event.httpMethod !== 'GET') return json(405, { error: 'Method not allowed' }, { allow: 'GET, OPTIONS' });

  if (String(event.queryStringParameters?.health || '') === '1') return json(200, { ok: true, service: 'Global News Hub', time: new Date().toISOString(), categories: ['regional', ...Object.keys(FEEDS)], regions: Object.keys(REGIONAL_FEEDS) });

  const category = String(event.queryStringParameters?.category || '').toLowerCase();
  const region = String(event.queryStringParameters?.region || 'GLOBAL').toUpperCase();
  const requestedSource = String(event.queryStringParameters?.source || '');
  if (category !== 'regional' && !FEEDS[category]) return json(400, { error: 'Unknown category' });

  let feeds = category === 'regional' ? (REGIONAL_FEEDS[region] || FEEDS.world) : FEEDS[category];
  if (requestedSource) feeds = feeds.filter(feed => feed.name === requestedSource);
  if (!feeds.length) return json(404, { error: 'Unknown source' });

  const results = await Promise.allSettled(feeds.map(async feed => {
    const xml = await fetchXml(feed.url);
    const articles = parseRss(xml, category === 'regional' ? 'regional' : category, feed.name);
    if (!articles.length) throw new Error('No readable RSS items');
    return { source: feed.name, articles };
  }));

  const articles = [];
  const errors = [];
  for (let i = 0; i < results.length; i++) {
    const result = results[i];
    if (result.status === 'fulfilled') articles.push(...result.value.articles);
    else errors.push({ source: feeds[i].name, message: result.reason?.message || 'Feed failed' });
  }

  const unique = [...new Map(articles.map(article => [article.id, article])).values()]
    .sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate));

  if (!unique.length) return json(502, { error: 'All requested RSS feeds failed', errors });
  return json(200, { category, region: category === 'regional' ? region : undefined, articles: unique, errors, generatedAt: new Date().toISOString() });
};


module.exports = async function(req,res){
  const url=new URL(req.url,'https://local.invalid');
  const event={httpMethod:req.method,queryStringParameters:Object.fromEntries(url.searchParams.entries())};
  const out=await handler(event);
  res.statusCode=out.statusCode||200;
  for(const [k,v] of Object.entries(out.headers||{})) res.setHeader(k,v);
  if(out.isBase64Encoded){res.end(Buffer.from(out.body||'','base64'));return;}
  res.end(out.body||'');
};
