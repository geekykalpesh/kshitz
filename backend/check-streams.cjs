const { Client } = require('pg');
const client = new Client({ connectionString: 'postgresql://postgres:postgres@localhost:5432/kshitz_portfolio' });

async function checkMuxStreams() {
  await client.connect();
  const { rows } = await client.query("SELECT id, title, video_link FROM works WHERE video_link LIKE '%mux.com%' ORDER BY id ASC");
  console.log('Testing ' + rows.length + ' Mux video streams...\n');
  let validCount = 0;
  let erroredCount = 0;

  for (const r of rows) {
    try {
      const res = await fetch(r.video_link);
      const isOk = res.status === 200;
      if (isOk) validCount++; else erroredCount++;
      console.log((isOk ? '✅' : '❌') + ' [#' + r.id + '] Status ' + res.status + ' | ' + r.title.substring(0, 35));
    } catch (e) {
      console.log('❌ [#' + r.id + '] Fetch Error: ' + e.message);
      erroredCount++;
    }
  }

  console.log('\nSummary: ' + validCount + ' working streams, ' + erroredCount + ' need repair.');
  await client.end();
}

checkMuxStreams().catch(console.error);
