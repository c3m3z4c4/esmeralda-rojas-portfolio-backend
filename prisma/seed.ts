import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...');

  // Create admin user
  const adminEmail = process.env.ADMIN_EMAIL || 'esme.rojas67@gmail.com';
  const adminPassword = process.env.ADMIN_PASSWORD || '4nonimouS';

  const hashedPassword = await bcrypt.hash(adminPassword, 12);

  const adminUser = await prisma.user.upsert({
    where: { email: adminEmail },
    update: { password: hashedPassword },
    create: {
      email: adminEmail,
      password: hashedPassword,
      roles: {
        create: { role: 'admin' },
      },
    },
  });

  console.log(`✅ Admin user created/updated: ${adminUser.email}`);

  // Create default site settings (raw values, no nested wrapper)
  const defaultSettings = [
    { key: 'logo_text', value: 'Esmeralda Rojas' },
    { key: 'hero_title', value: 'Gabriela Esmeralda Rojas Solis' },
    { key: 'hero_subtitle', value: 'Editora de Video Profesional' },
    { key: 'section_visibility', value: {
      hero: true,
      projects: true,
      services: true,
      experience: true,
      certifications: true,
      contact: true,
    }},
  ];

  for (const setting of defaultSettings) {
    await prisma.siteSetting.upsert({
      where: { key: setting.key },
      update: { value: setting.value },
      create: setting,
    });
  }

  console.log('✅ Default settings created');
  console.log('🎉 Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
