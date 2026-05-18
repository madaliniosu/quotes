import { Client } from '@notionhq/client';
import type { PageObjectResponse } from '@notionhq/client/build/src/api-endpoints';

export type Quote = {
  id: string;
  text: string;
  author: string;
  date: string; // "YYYY-MM"
};

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '';
  // Notion date format: "YYYY-MM-DD" — we keep only YYYY-MM
  return dateStr.slice(0, 7);
}

function richTextToString(richText: unknown[]): string {
  return (richText as Array<{ plain_text: string }>)
    .map((t) => t.plain_text)
    .join('');
}

export async function getQuotes(): Promise<Quote[]> {
  const notion = new Client({ auth: import.meta.env.NOTION_TOKEN });
  const databaseId = import.meta.env.NOTION_DATABASE_ID;

  const response = await notion.databases.query({
    database_id: databaseId,
    sorts: [{ property: 'Date', direction: 'descending' }],
  });

  return (response.results as PageObjectResponse[]).map((page) => {
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

    return { id: page.id, text, author, date };
  });
}
