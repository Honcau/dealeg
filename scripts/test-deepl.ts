/**
 * TEST DEEPL — chẩn đoán ngôn ngữ nào dịch được và tại sao fail
 * Chạy: npm run test:deepl
 */

// Load biến môi trường từ .env và .env.local (tsx không tự làm như Next.js)
import * as fs   from 'fs';
import * as path from 'path';

function loadEnv() {
  for (const file of ['.env', '.env.local']) {
    const p = path.join(process.cwd(), file);
    if (!fs.existsSync(p)) continue;
    const content = fs.readFileSync(p, 'utf8');
    for (const line of content.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eq = trimmed.indexOf('=');
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      let val   = trimmed.slice(eq + 1).trim();
      // Bỏ dấu ngoặc kép nếu có
      val = val.replace(/^["']|["']$/g, '');
      if (!process.env[key]) process.env[key] = val;
    }
  }
}

loadEnv();

const DEEPL_LANG: Record<string, string> = {
  vi: 'VI', zh: 'ZH', hi: 'HI', es: 'ES', pt: 'PT-BR',
  fr: 'FR', de: 'DE', ar: 'AR', ru: 'RU', ja: 'JA', ko: 'KO',
};

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

async function test() {
  const apiKey = process.env.DEEPL_API_KEY;
  if (!apiKey) {
    console.error('❌ DEEPL_API_KEY chưa set trong .env hoặc .env.local');
    console.log('   Kiểm tra: file .env có dòng DEEPL_API_KEY="..." không?');
    return;
  }

  console.log(`✓ Đã đọc key: ${apiKey.slice(0, 8)}...${apiKey.slice(-4)}\n`);

  const endpoint = apiKey.endsWith(':fx')
    ? 'https://api-free.deepl.com/v2/translate'
    : 'https://api.deepl.com/v2/translate';

  console.log(`Endpoint: ${endpoint}`);
  console.log(`Key type: ${apiKey.endsWith(':fx') ? 'FREE' : 'PRO'}\n`);

  // Kiểm tra quota
  const usageRes = await fetch(endpoint.replace('/translate', '/usage'), {
    headers: { 'Authorization': `DeepL-Auth-Key ${apiKey}` },
  });
  if (usageRes.ok) {
    const u = await usageRes.json();
    const pct = ((u.character_count / u.character_limit) * 100).toFixed(1);
    console.log(`📊 Quota: ${u.character_count.toLocaleString()}/${u.character_limit.toLocaleString()} ký tự (${pct}%)\n`);
    if (u.character_count >= u.character_limit) {
      console.error('❌ ĐÃ HẾT QUOTA THÁNG NÀY! Đây là lý do các bài fail.\n');
    }
  } else {
    console.error(`⚠ Không lấy được usage: HTTP ${usageRes.status}`);
    const err = await usageRes.text();
    console.error(`   ${err.slice(0, 150)}\n`);
  }

  // Test từng ngôn ngữ tuần tự
  for (const [locale, lang] of Object.entries(DEEPL_LANG)) {
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Authorization': `DeepL-Auth-Key ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: ['Hello world, this is a test.'],
          source_lang: 'EN',
          target_lang: lang,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        console.log(`✓ ${locale} (${lang}): ${data.translations[0].text}`);
      } else {
        const err = await res.text();
        console.log(`✗ ${locale} (${lang}): HTTP ${res.status} — ${err.slice(0, 120)}`);
      }
    } catch (e) {
      console.log(`✗ ${locale} (${lang}): ${e}`);
    }
    await sleep(500);
  }
}

test();
