import * as cheerio from 'cheerio';
import { respectfulFetch } from './http.js';

export async function currentUkTrends(limit = 30) {
  const endpoint = 'https://trends.google.com/trending/rss?geo=GB';
  const { text } = await respectfulFetch(endpoint,{minHostGapMs:2500,timeoutMs:15000});
  const $ = cheerio.load(text,{xmlMode:true});
  const out=[];
  $('item').each((_,el)=>{
    if(out.length>=limit)return;
    const title=$(el).find('title').first().text().trim();
    const published_at=$(el).find('pubDate').first().text().trim()||null;
    const traffic=$(el).find('ht\\:approx_traffic').first().text().trim()||null;
    const news=[];$(el).find('ht\\:news_item').each((__,n)=>{news.push({title:$(n).find('ht\\:news_item_title').text().trim(),url:$(n).find('ht\\:news_item_url').text().trim(),source:$(n).find('ht\\:news_item_source').text().trim()});});
    if(title)out.push({title:`Google Trends UK: ${title}`,url:`https://trends.google.com/trending?geo=GB&q=${encodeURIComponent(title)}`,snippet:`Trending search: ${title}${traffic?`; approximate traffic label from feed: ${traffic}`:''}`,publisher:'Google Trends',published_at,evidence_type:'trend_feed',raw_trend:{title,traffic,news}});
  });
  return out;
}
