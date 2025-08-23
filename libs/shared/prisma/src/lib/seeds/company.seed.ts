import { PrismaClient } from '@prisma/client';

export async function seedCompanies(prisma: PrismaClient) {
  console.log('Seeding companies...');

  const companies = [
    {
      id: '550e8400-e29b-41d4-a716-446655440001',
      name: 'SupplySense Demo Corp',
      taxId: 'TAX123456789',
      businessAddress: '123 Manufacturing Street, Industrial District, New York, NY 10001',
      contactPhone: '+1-555-0123',
      contactEmail: 'admin@test.com',
      isActive: true,
      industry: 'Manufacturing',
      defaultCurrency: 'USD',
      timezone: 'America/New_York',
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440002',
      name: 'TechCorp Industries',
      taxId: 'TAX987654321',
      businessAddress: '456 Technology Blvd, Silicon Valley, CA 94043',
      contactPhone: '+1-555-0456',
      contactEmail: 'admin@techcorp-industries.com',
      isActive: true,
      industry: 'Technology',
      defaultCurrency: 'USD',
      timezone: 'America/Los_Angeles',
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440003',
      name: 'Global Manufacturing Ltd',
      taxId: 'TAX456789123',
      businessAddress: '789 Industrial Park, Manufacturing Zone, Houston, TX 77001',
      contactPhone: '+1-555-0789',
      contactEmail: 'admin@global-manufacturing.com',
      isActive: true,
      industry: 'Heavy Manufacturing',
      defaultCurrency: 'USD',
      timezone: 'America/Chicago',
    }
  ];

  for (const company of companies) {
    await prisma.company.upsert({
      where: { id: company.id },
      update: company,
      create: company,
    });
  }

  console.log(`✅ Seeded ${companies.length} companies`);
  return companies;
}
