"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const prisma = new client_1.PrismaClient();
async function main() {
    console.log('🌱 Début du seeding de la base de données...');
    const existingAdmin = await prisma.user.findUnique({
        where: { email: 'admin@talenteex.com' },
    });
    if (!existingAdmin) {
        const hashedPassword = await bcryptjs_1.default.hash('admin123', 12);
        const adminUser = await prisma.user.create({
            data: {
                email: 'admin@talenteex.com',
                password: hashedPassword,
                role: 'ADMIN',
                isActive: true,
                isVerified: true,
            },
        });
        await prisma.admin.create({
            data: {
                userId: adminUser.id,
                role: 'super_admin',
            },
        });
        console.log('✅ Utilisateur admin créé:', adminUser.email);
    }
    else {
        console.log('ℹ️ L\'utilisateur admin existe déjà');
    }
    const formations = [
        {
            title: 'Négociation Commerciale Avancée',
            description: 'Maîtrisez les techniques de négociation pour optimiser vos contrats commerciaux',
            content: 'Contenu détaillé du cours de négociation...',
            duration: 120,
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
//# sourceMappingURL=seed.js.map