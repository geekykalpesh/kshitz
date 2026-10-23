async function testDownloadWithParams() {
  const fileId = '1jAc73s799-z_8CnO918zvyR9iRomZah5';
  const initialUrl = `https://drive.google.com/uc?export=download&id=${fileId}`;
  const resp1 = await fetch(initialUrl);
  const html = await resp1.text();
  const cookies = resp1.headers.get('set-cookie');

  // Extract form action and hidden inputs
  const actionMatch = html.match(/action="([^"]+)"/);
  const action = actionMatch ? actionMatch[1] : '';

  const idMatch = html.match(/name="id" value="([^"]+)"/);
  const exportMatch = html.match(/name="export" value="([^"]+)"/);
  const confirmMatch = html.match(/name="confirm" value="([^"]+)"/);
  const uuidMatch = html.match(/name="uuid" value="([^"]+)"/);

  const downloadUrl = `${action}?id=${idMatch ? idMatch[1] : fileId}&export=${exportMatch ? exportMatch[1] : 'download'}&confirm=${confirmMatch ? confirmMatch[1] : 't'}&uuid=${uuidMatch ? uuidMatch[1] : ''}`;

  console.log('Download URL:', downloadUrl);
  const resp2 = await fetch(downloadUrl, {
    headers: {
      Cookie: cookies || '',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
    }
  });

  console.log('Status:', resp2.status, 'Type:', resp2.headers.get('content-type'), 'Size:', resp2.headers.get('content-length'));
}

testDownloadWithParams().catch(console.error);
