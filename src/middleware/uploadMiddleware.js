const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Dossier de base pour les uploads (racine du projet)
const UPLOAD_BASE_PATH = path.join(__dirname, '../../uploads');

// Création du dossier de base si inexistant
if (!fs.existsSync(UPLOAD_BASE_PATH)) {
    fs.mkdirSync(UPLOAD_BASE_PATH, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        // L'identifiant utilisateur (ID ou username) doit être passé dans la requête
        // On préfère l'ID pour l'unicité
        const userId = req.body.creatorId || 'anonymous';
        const userDir = path.join(UPLOAD_BASE_PATH, userId.toString());

        if (!fs.existsSync(userDir)) {
            fs.mkdirSync(userDir, { recursive: true });
        }
        cb(null, userDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const fileFilter = (req, file, cb) => {
    const allowedTypes = [
        'image/jpeg', 'image/png', 'image/gif', 'image/webp',
        'video/mp4', 'video/quicktime', 'video/webm',
        'application/pdf'
    ];

    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Type de fichier non supporté. Seuls les images, vidéos et PDF sont acceptés.'), false);
    }
};

const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 2 * 1024 * 1024 * 1024 // 2 Go
    }
});

module.exports = upload;
