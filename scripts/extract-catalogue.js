// Extract full catalogue from TypeScript source
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Read the catalogue TypeScript file
const catalogueTs = fs.readFileSync(
  path.join(__dirname, '../src/data/catalogue.ts'),
  'utf-8'
);

// Extract INFRA_CATALOGUE_DATA object
const match = catalogueTs.match(/const INFRA_CATALOGUE_DATA = ({[\s\S]*?^}) as const;/m);
if (!match) {
  console.error('Could not extract INFRA_CATALOGUE_DATA');
  process.exit(1);
}

// Convert TypeScript object to JSON-parseable format
let dataStr = match[1];

// Remove trailing commas (TS allows them, JSON doesn't in some contexts)
dataStr = dataStr.replace(/,(\s*[}\]])/g, '$1');

// Evaluate the object (safe since it's from our own source)
const categories = eval(`(${dataStr})`);

// Add metadata to each item
const now = new Date().toISOString();
for (const [catKey, catData] of Object.entries(categories)) {
  catData.items = catData.items.map(item => ({
    ...item,
    lastUpdated: now,
    source: 'manual'
  }));
}

// Create the full catalogue JSON
const catalogue = {
  categories,
  metadata: {
    lastFullUpdate: now,
    version: '1.0.0',
    note: 'This catalogue can be updated via the admin API or by refreshing prices with AI'
  }
};

// Write to data/catalogue.json
const outputPath = path.join(__dirname, '../data/catalogue.json');
fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, JSON.stringify(catalogue, null, 2));

console.log(`✅ Extracted catalogue to ${outputPath}`);
console.log(`   Categories: ${Object.keys(categories).length}`);
console.log(`   Total items: ${Object.values(categories).reduce((sum, cat) => sum + cat.items.length, 0)}`);
