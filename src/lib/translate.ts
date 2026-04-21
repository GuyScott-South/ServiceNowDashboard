// MyMemory Translation API - free, CORS-friendly, no key needed
// Batches texts with newline separator, 500-char limit per request

const API = "https://api.mymemory.translated.net/get";

async function translateChunk(text: string, from: string, to: string): Promise<string> {
  const url = API + "?q=" + encodeURIComponent(text) + "&langpair=" + from + "|" + to;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Translation failed");
  const data = await res.json();
  return data.responseData?.translatedText || text;
}

export async function translateBatch(texts: string[], from = "fr", to = "en"): Promise<string[]> {
  const chunks: string[][] = [];
  let current: string[] = [];
  let len = 0;
  for (const t of texts) {
    const add = t.length + (current.length > 0 ? 1 : 0);
    if (len + add > 490 && current.length > 0) {
      chunks.push(current);
      current = [t];
      len = t.length;
    } else {
      current.push(t);
      len += add;
    }
  }
  if (current.length > 0) chunks.push(current);

  const chunkResults = await Promise.all(
    chunks.map(async (chunk) => {
      const joined = chunk.join(String.fromCharCode(10));
      const translated = await translateChunk(joined, from, to);
      return translated.split(String.fromCharCode(10));
    })
  );

  const flat = chunkResults.flat();
  return texts.map((t, i) => flat[i]?.trim() || t);
}