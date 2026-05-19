import { Client } from '@notionhq/client';
import type { PageObjectResponse } from '@notionhq/client/build/src/api-endpoints';

export type Quote = {
  id: string;
  text: string;
  author: string;
  date: string; // "YYYY-MM"
  dateFormatted: string; // "Month YYYY" or ""
};

export function formatMonthYear(dateStr: string | null | undefined): string {
  if (!dateStr || dateStr === 'Undated') return dateStr === 'Undated' ? 'Undated' : '';
  const [year, month] = dateStr.split('-');
  const d = new Date(Number(year), Number(month) - 1);
  return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '';
  return dateStr.slice(0, 7);
}

function richTextToString(richText: unknown[]): string {
  return (richText as Array<{ plain_text: string }>)
    .map((t) => t.plain_text)
    .join('');
}

function pageToQuote(page: PageObjectResponse): Quote {
  const props = page.properties;

  const titleProp = props['Name'];
  const text =
    titleProp?.type === 'title' ? richTextToString(titleProp.title) : '';

  const authorProp = props['Author'];
  const author =
    authorProp?.type === 'rich_text'
      ? richTextToString(authorProp.rich_text)
      : '';

  const dateProp = props['Date'];
  const date =
    dateProp?.type === 'date' ? formatDate(dateProp.date?.start) : '';

  return { id: page.id, text, author, date, dateFormatted: formatMonthYear(date) };
}

let cache: { quotes: Quote[]; at: number } | null = null;
const CACHE_TTL = 60_000;

async function fetchAllQuotes(): Promise<Quote[]> {
  const token = import.meta.env.NOTION_TOKEN;
  const databaseId = import.meta.env.NOTION_DATABASE_ID;

  if (!token || !databaseId) {
    throw new Error('Missing NOTION_TOKEN or NOTION_DATABASE_ID environment variables');
  }

  const notion = new Client({ auth: token });
  const allResults: PageObjectResponse[] = [];
  let cursor: string | undefined;

  do {
    const response = await notion.databases.query({
      database_id: databaseId,
      sorts: [{ property: 'Date', direction: 'descending' }],
      start_cursor: cursor,
    });
    allResults.push(...(response.results as PageObjectResponse[]));
    cursor = response.has_more ? (response.next_cursor ?? undefined) : undefined;
  } while (cursor);

  return allResults.map(pageToQuote);
}

export async function getQuotes(): Promise<Quote[]> {
  if (cache && Date.now() - cache.at < CACHE_TTL) return cache.quotes;
  const quotes = await fetchAllQuotes();
  cache = { quotes, at: Date.now() };
  return quotes;
}
