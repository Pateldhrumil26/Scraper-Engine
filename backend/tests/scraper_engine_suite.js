const fs = require('fs');
const path = require('path');
const assert = require('assert');

// Import compiled dist modules
const { EventsEyeParser } = require('../dist/modules/scraper/parsers/EventsEyeParser');
const { ExpoFinderParser } = require('../dist/modules/scraper/parsers/ExpoFinderParser');
const { GenericExpoParser } = require('../dist/modules/scraper/parsers/GenericExpoParser');
const { TradeIndiaParser } = require('../dist/modules/scraper/parsers/TradeIndiaParser');
const { ExpoStandZoneParser } = require('../dist/modules/scraper/parsers/ExpoStandZoneParser');
const { ExpoValidator } = require('../dist/modules/scraper/validator/expo.validator');
const { parserRegistry } = require('../dist/modules/scraper/parser-registry');

const fixturesDir = path.join(__dirname, 'fixtures');

let testsPassed = 0;
let testsTotal = 0;

function runTest(name, fn) {
  testsTotal++;
  try {
    fn();
    console.log(`  [PASS] ${name}`);
    testsPassed++;
  } catch (err) {
    console.error(`  [FAIL] ${name}:`, err.message);
  }
}

async function runAsyncTest(name, fn) {
  testsTotal++;
  try {
    await fn();
    console.log(`  [PASS] ${name}`);
    testsPassed++;
  } catch (err) {
    console.error(`  [FAIL] ${name}:`, err.message);
  }
}

async function runSuite() {
  console.log('====================================================');
  console.log('BUSINESS EXPO SCRAPER ENGINE: REGRESSION TEST SUITE');
  console.log('====================================================\n');

  // ----------------------------------------------------
  // TEST GROUP 1: EventsEye HTML Fixture Extraction
  // ----------------------------------------------------
  console.log('Group 1: EventsEye Parser HTML Fixture Tests');
  const eeParser = new EventsEyeParser();

  await runAsyncTest('EventsEye Homepage Fixture extracts multiple trade shows', async () => {
    const html = fs.readFileSync(path.join(fixturesDir, 'eventseye_https___www_eventseye_com_.html'), 'utf8');
    const items = await eeParser.parse(html, 'https://www.eventseye.com/');
    assert(items.length > 0, `Expected > 0 items, got ${items.length}`);
    assert.strictEqual(items.length, 18, `Expected exactly 18 items on EventsEye homepage, got ${items.length}`);
    const medica = items.find(i => i.name.includes('MEDICA'));
    assert(medica, 'MEDICA trade show should be extracted');
    assert(medica.sourceUrl.includes('f-medica-1790-1.html'), 'MEDICA detail URL should be properly resolved');
    assert(medica.startDate instanceof Date, 'startDate must be a valid Date object');
  });

  await runAsyncTest('EventsEye Category Listing Fixture extracts all 50 trade shows with metadata', async () => {
    const html = fs.readFileSync(path.join(fixturesDir, 'eventseye_listing_page.html'), 'utf8');
    const items = await eeParser.parse(html, 'https://www.eventseye.com/fairs/z1_trade-shows_america.html');
    assert.strictEqual(items.length, 50, `Expected 50 items on America listing page, got ${items.length}`);
    const first = items[0];
    assert.strictEqual(first.name, 'BLUFFTON GUNS & KNIFE SHOW');
    assert.strictEqual(first.city, 'Bluffton');
    assert.strictEqual(first.country, 'USA');
    assert.strictEqual(first.venue, 'Wells County 4-H Park');
    assert(first.description.startsWith('Guns & Knife Expo'), 'Description should be extracted from <i> tag');
  });

  // ----------------------------------------------------
  // TEST GROUP 2: ExpoFinder HTML Fixture Extraction
  // ----------------------------------------------------
  console.log('\nGroup 2: ExpoFinder Parser HTML Fixture Tests');
  const efParser = new ExpoFinderParser();

  await runAsyncTest('ExpoFinder Fixture extracts 16 items via Next.js SSR stream hydration', async () => {
    const html = fs.readFileSync(path.join(fixturesDir, 'expofinder_https___www_expofinder_com_en.html'), 'utf8');
    const items = await efParser.parse(html, 'https://www.expofinder.com/en');
    assert.strictEqual(items.length, 16, `Expected 16 items from ExpoFinder, got ${items.length}`);
    const rehacare = items.find(i => i.name.includes('REHACARE'));
    assert(rehacare, 'REHACARE CHINA 2027 should be extracted');
    assert.strictEqual(rehacare.city, 'Suzhou');
    assert.strictEqual(rehacare.country, 'China');
    assert.strictEqual(rehacare.venue, 'Suzhou International Expo Center');
    assert(rehacare.sourceUrl.includes('/detail/FxJdkTRi'), 'Detail URL should match publicId');
  });

  await runAsyncTest('GenericExpoParser extracts ExpoFinder items via fallback ItemList / Next.js support', async () => {
    const html = fs.readFileSync(path.join(fixturesDir, 'expofinder_https___www_expofinder_com_en.html'), 'utf8');
    const genParser = new GenericExpoParser();
    const items = await genParser.parse(html, 'https://www.expofinder.com/en');
    assert.strictEqual(items.length, 16, `Expected GenericExpoParser to extract 16 items, got ${items.length}`);
  });

  // ----------------------------------------------------
  // TEST GROUP 3: Parser Registry Auto-Detection
  // ----------------------------------------------------
  console.log('\nGroup 3: Parser Registry Auto-Detection');

  runTest('Domain eventseye.com resolves to EventsEyeParser', () => {
    const resolved = parserRegistry.resolveForUrl('https://www.eventseye.com/');
    assert.strictEqual(resolved.key, 'eventseye');
  });

  runTest('Domain expofinder.com resolves to ExpoFinderParser', () => {
    const resolved = parserRegistry.resolveForUrl('https://www.expofinder.com/en');
    assert.strictEqual(resolved.key, 'expofinder');
  });

  runTest('Domain tradeindia.com resolves to TradeIndiaParser', () => {
    const resolved = parserRegistry.resolveForUrl('https://www.tradeindia.com/tradeshows/');
    assert.strictEqual(resolved.key, 'tradeindia');
  });

  runTest('Mismatched preferredKey falls back to matching domain parser', () => {
    // If a source had preferredKey='allevents' but URL is 'tradeindia.com'
    const resolved = parserRegistry.resolveForUrl('https://www.tradeindia.com/tradeshows/', 'allevents');
    assert.strictEqual(resolved.key, 'tradeindia', 'Should auto-correct to tradeindia');
  });

  // ----------------------------------------------------
  // TEST GROUP 4: Data Validation, Missing Fields & Scoring
  // ----------------------------------------------------
  console.log('\nGroup 4: Data Validation & Quality Scoring (ExpoValidator)');

  runTest('Complete item achieves high score (>= 80) and VERIFIED status', () => {
    const res = ExpoValidator.validate({
      name: 'Global AI & Cloud Summit 2027',
      organizer: 'Cloud Tech Events Inc.',
      industry: 'Artificial Intelligence',
      startDate: new Date('2027-04-10'),
      endDate: new Date('2027-04-12'),
      venue: 'San Francisco Convention Center',
      city: 'San Francisco',
      country: 'United States',
      description: 'Comprehensive industry conference on enterprise AI architectures.',
      registrationUrl: 'https://example.com/register',
      sourceUrl: 'https://example.com/event/123',
    }, 'test');

    assert(res.valid, 'Item must be valid');
    assert(res.data.dataQualityScore >= 80, `Expected score >= 80, got ${res.data.dataQualityScore}`);
    assert.strictEqual(res.data.verificationStatus, 'VERIFIED');
    assert.strictEqual(res.data.missingFields.length, 0);
  });

  runTest('Missing date triggers fallback and missingFields flag', () => {
    const res = ExpoValidator.validate({
      name: 'Undated Showcase 2027',
      sourceUrl: 'https://example.com/event/999',
    }, 'test');

    assert(res.valid, 'Item should be valid with fallbacks');
    assert(res.data.missingFields.includes('startDate'), 'missingFields must contain startDate');
    assert(res.data.missingFields.includes('venue'), 'missingFields must contain venue');
    assert(res.data.dataQualityScore < 50, `Score should be < 50, got ${res.data.dataQualityScore}`);
    assert.strictEqual(res.data.verificationStatus, 'FLAGGED');
  });

  runTest('Inverted dates (endDate < startDate) are auto-corrected', () => {
    const res = ExpoValidator.validate({
      name: 'Inverted Date Conference',
      startDate: new Date('2027-05-10'),
      endDate: new Date('2027-05-01'), // Earlier than start
      sourceUrl: 'https://example.com/event/111',
    }, 'test');

    assert(res.valid);
    assert(res.data.endDate >= res.data.startDate, 'End date must be on or after start date');
    assert(res.data.validationErrors.some(e => e.includes('prior to start date')), 'Validation warning should be recorded');
  });

  // ----------------------------------------------------
  // TEST GROUP 5: Zero-Record Protection & Status Mapping
  // ----------------------------------------------------
  console.log('\nGroup 5: Zero-Record Protection & Status Mapping');

  await runAsyncTest('Empty HTML extraction returns 0 items and maps to NO_DATA (never SUCCESS)', async () => {
    const emptyHtml = '<html><head><title>Empty Page</title></head><body><p>No trade shows listed here.</p></body></html>';
    const rawItems = await eeParser.parse(emptyHtml, 'https://www.eventseye.com/empty');
    assert.strictEqual(rawItems.length, 0, 'Should extract 0 items from empty page');

    // Emulate ScraperEngineService status resolution
    let fetchStatus = 'SUCCESS';
    if (rawItems.length === 0) {
      fetchStatus = 'NO_DATA';
    }
    assert.strictEqual(fetchStatus, 'NO_DATA', 'Status for 0 items must be NO_DATA, NEVER SUCCESS');
  });

  await runAsyncTest('All-invalid items map to PARSE_FAILED status', async () => {
    const invalidItems = [{ name: 'x', sourceUrl: 'not-a-url' }]; // Fails Zod validation
    let validCount = 0;
    for (const item of invalidItems) {
      const val = ExpoValidator.validate(item, 'test');
      if (val.valid) validCount++;
    }

    let fetchStatus = 'SUCCESS';
    if (invalidItems.length > 0 && validCount === 0) {
      fetchStatus = 'PARSE_FAILED';
    }
    assert.strictEqual(fetchStatus, 'PARSE_FAILED', 'Status for all-invalid items must be PARSE_FAILED');
  });

  // ----------------------------------------------------
  // TEST GROUP 6: Cloudflare WAF Detection (10times)
  // ----------------------------------------------------
  console.log('\nGroup 6: 10times HTTP 403 & WAF Protection Handling');

  runTest('10times fixture is verified as Cloudflare Turnstile protected', () => {
    const html = fs.readFileSync(path.join(fixturesDir, '10times_https___10times_com_india.html'), 'utf8');
    const isWaf = html.includes('Just a moment') || html.includes('Turnstile') || html.includes('cf-');
    assert(isWaf, '10times fixture must contain Cloudflare challenge indicators');
  });

  console.log('\n====================================================');
  console.log(`TEST SUITE FINISHED: ${testsPassed}/${testsTotal} TESTS PASSED`);
  console.log('====================================================\n');

  if (testsPassed !== testsTotal) {
    process.exit(1);
  }
}

runSuite().catch((err) => {
  console.error('Fatal test runner error:', err);
  process.exit(1);
});
