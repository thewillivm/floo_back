const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();
const UPLOAD_BASE_PATH = path.join(__dirname, '../uploads');

async function migrate() {
    console.log('--- DÉBUT DE LA MIGRATION DES DOSSIERS UTILISATEURS ---');
    
    try {
        // Créer le dossier racine s'il n'existe pas
        if (!fs.existsSync(UPLOAD_BASE_PATH)) {
            fs.mkdirSync(UPLOAD_BASE_PATH, { recursive: true });
            console.log(`Dossier racine créé : ${UPLOAD_BASE_PATH}`);
        }

        // Récupérer tous les utilisateurs
        const users = await prisma.user.findMany();
        console.log(`${users.length} utilisateurs trouvés.`);

        for (const user of users) {
            const userDir = path.join(UPLOAD_BASE_PATH, user.id.toString());
            if (!fs.existsSync(userDir)) {
                fs.mkdirSync(userDir, { recursive: true });
                console.log(`Dossier créé pour ${user.username} (ID: ${user.id}) : ${userDir}`);
            } else {
                console.log(`Dossier existe déjà pour ${user.username} (ID: ${user.id})`);
            }
        }

        console.log('--- MIGRATION TERMINÉE AVEC SUCCÈS ---');
    } catch (error) {
        console.error('Erreur lors de la migration :', error);
    } finally {
        await prisma.$disconnect();
    }
}

migrate();
