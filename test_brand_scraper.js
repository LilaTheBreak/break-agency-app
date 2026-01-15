import { enrichBrandFromUrl } from './apps/api/src/services/brandEnrichment.ts';

async function testScraper() {
  console.log('Testing brand scraper...\n');
  
  // Test with a real website
  const testUrls = [
    'https://www.nike.com',
    'https://www.tesla.com',
    'https://www.apple.com',
  ];
  
  for (const url of testUrls) {
    console.log(`\nTesting: ${url}`);
    try {
      const result = await enrichBrandFromUrl(url);
      console.log(JSON.stringify(result, null, 2));
    } catch (error) {
      console.error(`Error: ${error.message}`);
    }
  }
}

testScraper();
