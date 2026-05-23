import { PrismaClient, KitchenStationType } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('START SEED');

  const sushiStation = await prisma.kitchenStation.upsert({
    where: { name: 'Sushi Printer' },
    update: {},
    create: { name: 'Sushi Printer', type: KitchenStationType.SUSHI },
  });

  const drinksStation = await prisma.kitchenStation.upsert({
    where: { name: 'Drinks Printer' },
    update: {},
    create: { name: 'Drinks Printer', type: KitchenStationType.DRINKS },
  });

  await prisma.kitchenStation.upsert({
    where: { name: 'Hot Kitchen Printer' },
    update: {},
    create: { name: 'Hot Kitchen Printer', type: KitchenStationType.HOT_KITCHEN },
  });

  await prisma.package.upsert({
    where: { name: 'Standard' },
    update: {},
    create: { name: 'Standard' },
  });

  const deluxePackage = await prisma.package.upsert({
    where: { name: 'Deluxe' },
    update: {},
    create: { name: 'Deluxe' },
  });

  for (let i = 1; i <= 30; i++) {
    await prisma.table.upsert({
      where: { number: i },
      update: {},
      create: {
        number: i,
        seats: i <= 10 ? 4 : i <= 20 ? 6 : 8,
      },
    });
  }

  const sushiCategory = await prisma.menuCategory.upsert({
    where: { slug: 'sushi' },
    update: {},
    create: { name: 'Sushi', slug: 'sushi' },
  });

  const drinksCategory = await prisma.menuCategory.upsert({
    where: { slug: 'drinks' },
    update: {},
    create: { name: 'Drinks', slug: 'drinks' },
  });

  const sushiItem = await prisma.menuItem.create({
    data: {
      name: 'Salmon Roll',
      description: 'Fresh salmon sushi roll',
      price: 8.5,
      categoryId: sushiCategory.id,
      stationId: sushiStation.id,
    },
  });

  const drinkItem = await prisma.menuItem.create({
    data: {
      name: 'Coca Cola',
      description: 'Cold drink',
      price: 3,
      categoryId: drinksCategory.id,
      stationId: drinksStation.id,
    },
  });

  await prisma.packageMenuItem.create({
    data: {
      packageId: deluxePackage.id,
      menuItemId: sushiItem.id,
    },
  });

  await prisma.packageMenuItem.create({
    data: {
      packageId: deluxePackage.id,
      menuItemId: drinkItem.id,
    },
  });

  console.log('SEED DONE');
}

main()
  .catch((e) => {
    console.error(e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });