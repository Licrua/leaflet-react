export async function getWFSData({ url, typeName, bbox, srsName = 'EPSG:3857' }: {
  url: string;
  typeName: string;
  bbox: number[];
  srsName?: string;
}) {
  if (!typeName) throw new Error('WFS typeName не задан.');

  const params = new URLSearchParams({
    service: 'WFS',
    version: '1.1.0',
    request: 'GetFeature',
    typeName,
    outputFormat: 'application/json',
    bbox: `${bbox.join(',')},${srsName}`,
    srsName
  });

  const full = `${url}?${params.toString()}`;
  console.log('WFS URL:', full);

  const resp = await fetch(full, { method: 'GET' });
  if (!resp.ok) {
    const txt = await resp.text().catch(() => '');
    throw new Error(`WFS fetch failed: ${resp.status} ${resp.statusText}\n${txt}`);
  }

  const text = await resp.text();
  try {
    return JSON.parse(text);
  } catch {
    throw new Error('Сервер вернул не JSON: ' + text.substring(0, 200));
  }
}
