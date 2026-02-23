import 'dotenv/config';

const API_KEY = process.env.API_KEY;

export async function api<T>(method: string, path: string, body?: object): Promise<T> {
  const res = await fetch(`${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${API_KEY}`,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  
  if (!res.ok) throw new Error((await res.json()).error);
  return res.json();
}