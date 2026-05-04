/**
 * SEED SCRIPT
 * Run with: npm run db:seed
 *
 * This creates:
 * - 1 admin account:  admin@demo.com / admin123
 * - 1 user account:   user@demo.com / user123
 * - 10 sample time slots for the next 7 days
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

function getDateString(daysFromNow: number): string {
  const d = new Date();
  d.setDate(d.getDate() + daysFromNow);
  return d.toISOString().split('T')[0]; // "2024-12-25"
}

async function main() {
  console.log('🌱 Seeding database...');

  // Clear existing data
  await prisma.booking.deleteMany();
  await prisma.slot.deleteMany();
  await prisma.user.deleteMany();

  // Create admin
  const adminPassword = await bcrypt.hash('admin123', 12);
  const admin = await prisma.user.create({
    data: {
      name: 'Admin User',
      email: 'admin@demo.com',
      password: adminPassword,
      role: 'ADMIN',
    },
  });
  console.log(`✅ Created admin: ${admin.email}`);

  // Create regular user
  const userPassword = await bcrypt.hash('user123', 12);
  const user = await prisma.user.create({
    data: {
      name: 'John Doe',
      email: 'user@demo.com',
      password: userPassword,
      role: 'USER',
    },
  });
  console.log(`✅ Created user: ${user.email}`);

  // Create sample slots for the next 7 days
  const timeSlots = [
    { start: '09:00', end: '09:30', title: 'Morning Consultation' },
    { start: '10:00', end: '10:30', title: 'Morning Consultation' },
    { start: '11:00', end: '11:30', title: 'Mid-Morning Session' },
    { start: '14:00', end: '14:30', title: 'Afternoon Meeting' },
    { start: '15:00', end: '15:30', title: 'Afternoon Meeting' },
  ];

  for (let day = 1; day <= 7; day++) {
    for (const slot of timeSlots) {
      await prisma.slot.create({
        data: {
          date: getDateString(day),
          startTime: slot.start,
          endTime: slot.end,
          title: slot.title,
          adminId: admin.id,
        },
      });
    }
  }
  console.log('✅ Created 35 sample time slots');

  console.log('\n🎉 Seed complete! Login credentials:');
  console.log('   Admin:  admin@demo.com / admin123');
  console.log('   User:   user@demo.com  / user123');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
