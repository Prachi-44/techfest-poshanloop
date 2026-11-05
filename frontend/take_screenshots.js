import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';

const CHROME_PATH = fs.existsSync('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe')
  ? 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
  : 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';

const routes = [
  { name: '01_overview.png', path: '/' },
  { name: '02_children_registry.png', path: '/children' },
  { name: '03_child_detail.png', path: '/children/CH-0030' },
  { name: '04_trust_gate.png', path: '/trust-gate' },
  { name: '05_blindspot_coverage.png', path: '/blindspot' },
  { name: '06_referral_worklist.png', path: '/referrals' },
  { name: '07_facility_desk.png', path: '/facility' },
  { name: '08_offline_queue.png', path: '/offline' },
  { name: '09_cause_finder.png', path: '/cause-finder' },
  { name: '10_supervisor_view.png', path: '/supervisor' },
];

const outDir = path.resolve('d:/techfest_poshanloop/screenshots');
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

async function main() {
  console.log('Launching browser via puppeteer-core:', CHROME_PATH);
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu'],
    defaultViewport: { width: 1366, height: 850 },
  });

  const page = await browser.newPage();

  for (const r of routes) {
    const url = `http://localhost:5173${r.path}`;
    const outPath = path.join(outDir, r.name);
    console.log(`Navigating to ${url} ...`);
    try {
      await page.goto(url, { waitUntil: 'networkidle0', timeout: 15000 });
      await new Promise((resolve) => setTimeout(resolve, 1000));
      await page.screenshot({ path: outPath, fullPage: false });
      console.log(`Saved: ${r.name}`);
    } catch (e) {
      console.error(`Error capturing ${r.name}:`, e.message);
    }
  }

  await browser.close();
  console.log('Finished capturing all genuine screenshots!');
}

main().catch(console.error);

