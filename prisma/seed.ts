import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...');

  // Create admin user
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@example.com';
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin123456';

  const hashedPassword = await bcrypt.hash(adminPassword, 12);

  const adminUser = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      password: hashedPassword,
      roles: {
        create: { role: 'admin' },
      },
    },
  });

  console.log(`✅ Admin user created: ${adminUser.email}`);

  // Create default site settings
  const defaultSettings = [
    { key: 'logo_text', value: { value: 'Portfolio' } },
    { key: 'hero_title', value: { value: 'Welcome to my portfolio' } },
    { key: 'hero_subtitle', value: { value: 'Creative Developer' } },
    { key: 'section_visibility', value: { 
      value: {
        hero: true,
        projects: true,
        experience: true,
        certifications: true,
        contact: true,
      }
    }},
  ];

  for (const setting of defaultSettings) {
    await prisma.siteSetting.upsert({
      where: { key: setting.key },
      update: {},
      create: setting,
    });
  }

  console.log('✅ Default settings created');

  // Create sample project
  await prisma.project.upsert({
    where: { id: 'sample-project-1' },
    update: {},
    create: {
      id: 'sample-project-1',
      title: 'Proyecto de Ejemplo',
      titleEn: 'Sample Project',
      category: 'Web Development',
      description: 'Este es un proyecto de ejemplo para demostrar la funcionalidad.',
      descriptionEn: 'This is a sample project to demonstrate functionality.',
      software: ['React', 'TypeScript', 'Node.js'],
      featured: true,
      displayOrder: 1,
      isActive: true,
    },
  });

  console.log('✅ Sample project created');

  // Create sample experience
  await prisma.experience.upsert({
    where: { id: 'sample-experience-1' },
    update: {},
    create: {
      id: 'sample-experience-1',
      company: 'Empresa Ejemplo',
      companyEn: 'Example Company',
      role: 'Desarrollador Full Stack',
      roleEn: 'Full Stack Developer',
      period: '2020 - Presente',
      responsibilities: [
        'Desarrollo de aplicaciones web',
        'Diseño de bases de datos',
        'Implementación de APIs RESTful',
      ],
      responsibilitiesEn: [
        'Web application development',
        'Database design',
        'RESTful API implementation',
      ],
      technologies: ['React', 'Node.js', 'PostgreSQL'],
      displayOrder: 1,
      isActive: true,
      isCurrent: true,
    },
  });

  console.log('✅ Sample experience created');

  // Create sample certification
  await prisma.certification.upsert({
    where: { id: 'sample-cert-1' },
    update: {},
    create: {
      id: 'sample-cert-1',
      title: 'Certificación de Ejemplo',
      titleEn: 'Sample Certification',
      issuer: 'Institución Ejemplo',
      issueDate: '2023-01',
      displayOrder: 1,
      isActive: true,
    },
  });

  console.log('✅ Sample certification created');

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
