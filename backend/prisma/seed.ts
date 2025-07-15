import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Début du seeding de la base de données...');

  // Vérifier si l'admin existe déjà
  const existingAdmin = await prisma.user.findUnique({
    where: { email: 'admin@talenteex.com' },
  });

  if (!existingAdmin) {
    // Créer l'utilisateur admin
    const hashedPassword = await bcrypt.hash('admin123', 12);
    
    const adminUser = await prisma.user.create({
      data: {
        email: 'admin@talenteex.com',
        password: hashedPassword,
        role: 'ADMIN',
        isActive: true,
        isVerified: true,
      },
    });

    // Créer le profil admin
    await prisma.admin.create({
      data: {
        userId: adminUser.id,
        role: 'super_admin',
      },
    });

    console.log('✅ Utilisateur admin créé:', adminUser.email);
  } else {
    console.log('ℹ️ L\'utilisateur admin existe déjà');
  }

  // Créer quelques formations d'exemple
  const formations = [
    {
      title: 'Négociation Commerciale Avancée',
      description: 'Maîtrisez les techniques de négociation pour optimiser vos contrats commerciaux',
      content: 'Contenu détaillé du cours de négociation...',
      duration: 120, // minutes
      difficulty: 'intermediate',
      domain: 'commerce',
    },
    {
      title: 'Droit des Contrats',
      description: 'Comprendre les fondamentaux du droit des contrats en entreprise',
      content: 'Contenu détaillé du cours de droit...',
      duration: 180,
      difficulty: 'beginner',
      domain: 'juridique',
    },
    {
      title: 'Gestion de Projet Agile',
      description: 'Méthodologies agiles pour la gestion efficace de projets',
      content: 'Contenu détaillé du cours de gestion de projet...',
      duration: 150,
      difficulty: 'intermediate',
      domain: 'management',
    },
  ];

  for (const formation of formations) {
    const existingFormation = await prisma.formation.findFirst({
      where: { title: formation.title },
    });

    if (!existingFormation) {
      await prisma.formation.create({
        data: formation,
      });
      console.log(`✅ Formation créée: ${formation.title}`);
    }
  }

  console.log('🎉 Seeding terminé avec succès!');
}

main()
  .catch((e) => {
    console.error('❌ Erreur lors du seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 