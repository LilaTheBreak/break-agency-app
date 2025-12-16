import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const sampleOpportunities = [
  {
    brand: "Maison Delphine",
    location: "Paris & Remote",
    title: "Luxury Residency Story Suite",
    deliverables: "4 IG Reels • 2 Editorial Posts",
    payment: "€8K – €12K + travel",
    deadline: "Feb 28",
    status: "Shortlisting · Login required to apply",
    image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80",
    logo: "https://images.unsplash.com/photo-1446520394190-660e5a4f0cc8?auto=format&fit=crop&w=200&q=80",
    type: "Luxury travel",
    isActive: true,
    createdBy: "system"
  },
  {
    brand: "Nova Fintech",
    location: "Dubai · Hybrid",
    title: "AI Banking Confidence Drops",
    deliverables: "3 TikTok explainers • 1 livestream",
    payment: "$6K – $9K + CPA bonus",
    deadline: "Mar 5",
    status: "Live brief · Login required to apply",
    image: "https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=800&q=80",
    logo: "https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=200&q=80",
    type: "Fintech",
    isActive: true,
    createdBy: "system"
  },
  {
    brand: "Aster Retail",
    location: "New York & Doha",
    title: "Global Capsule Tour",
    deliverables: "6 UGC sets • OOH stills",
    payment: "$5K – $7K + product equity",
    deadline: "Mar 12",
    status: "Pre-production · Login required to apply",
    image: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=800&q=80",
    logo: "https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=200&q=80",
    type: "Retail",
    isActive: true,
    createdBy: "system"
  }
];

async function seedOpportunities() {
  console.log('Seeding opportunities...');
  
  for (const opportunity of sampleOpportunities) {
    await prisma.opportunity.create({
      data: opportunity
    });
    console.log(`Created opportunity: ${opportunity.brand} - ${opportunity.title}`);
  }
  
  console.log('Seeding completed!');
}

seedOpportunities()
  .catch((e) => {
    console.error('Error seeding opportunities:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
