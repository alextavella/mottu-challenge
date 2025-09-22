import { prisma } from './client';

async function seed() {
  console.log('🌱 Starting database seeding...');

  try {
    // Clean existing data (optional - remove if you want to keep existing data)
    console.log('🧹 Cleaning existing data...');
    await prisma.movement.deleteMany();
    await prisma.ledgerLog.deleteMany();
    await prisma.account.deleteMany();

    // Create sample accounts
    console.log('👤 Creating sample accounts...');

    await prisma.account.create({
      data: {
        name: 'João Silva',
        document: '12345678901',
        email: 'joao.silva@example.com',
        balance: 1500.5,
      },
    });

    await prisma.account.create({
      data: {
        name: 'Maria Santos',
        document: '98765432109',
        email: 'maria.santos@example.com',
        balance: 750.25,
      },
    });

    await prisma.account.create({
      data: {
        name: 'Pedro Oliveira',
        document: '45612378945',
        email: 'pedro.oliveira@example.com',
        balance: 0.0,
      },
    });

    console.log('✅ Database seeding completed successfully!');
    console.log(`📊 Created:`);
    console.log(`   - 3 accounts`);
    console.log(`   - 0 movements`);
    console.log(`   - 0 ledger logs`);

    // Display created accounts summary
    const accounts = await prisma.account.findMany({
      include: {
        movements: true,
      },
    });

    console.log('\n📋 Accounts Summary:');
    accounts.forEach((account, index) => {
      console.log(`   ${index + 1}. ${account.name} (${account.email})`);
      console.log(`      Document: ${account.document}`);
      console.log(`      Balance: R$ ${account.balance}`);
      console.log(`      Movements: ${account.movements.length}`);
      console.log('');
    });
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

seed().catch((error) => {
  console.error('❌ Seed failed:', error);
  process.exit(1);
});
