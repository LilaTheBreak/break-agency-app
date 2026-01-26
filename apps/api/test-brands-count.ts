import prisma from './src/lib/prisma.js';

async function testBrandsCount() {
  const brands = await prisma.brand.findMany();
  console.log(`\n📊 BRAND COUNT AUDIT:`);
  console.log(`Total brands in database: ${brands.length}`);
  console.log(`\nBrand names:`);
  brands.forEach((b, i) => {
    console.log(`  [${i+1}] ${b.name} (id: ${b.id})`);
  });
  
  process.exit(0);
}

testBrandsCount().catch(e => {
  console.error(e);
  process.exit(1);
});
