const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
  console.log('Starting seeding...');

  // Clear existing data
  await prisma.purchase.deleteMany();
  await prisma.post.deleteMany();
  await prisma.user.deleteMany();

  const salt = await bcrypt.genSalt(10);
  const commonPassword = await bcrypt.hash('password123', salt);

  // 1. Create Users
  const users = [
    {
      name: 'Elena Rossi',
      username: 'elenarossi_art',
      email: 'elena@example.com',
      password: commonPassword,
      avatar: 'https://picsum.photos/id/64/200/200',
      role: 'creator',
      bio: 'Digital artist and photographer based in Milan.'
    },
    {
      name: 'Jean Dupont',
      username: 'jdupont_photo',
      email: 'jean@example.com',
      password: commonPassword,
      avatar: 'https://picsum.photos/id/65/200/200',
      role: 'creator',
      bio: 'Photographe de paysage passionné.'
    },
    {
      name: 'Marie Curie',
      username: 'mcurie',
      email: 'marie@example.com',
      password: commonPassword,
      avatar: 'https://picsum.photos/id/66/200/200',
      role: 'creator',
      bio: 'Amateur d\'art.'
    },
    {
      name: 'William Koua',
      username: 'william',
      email: 'william.kouakinimo@gmail.com',
      password: commonPassword,
      avatar: 'https://picsum.photos/id/67/200/200',
      role: 'creator',
      bio: 'Développeur et curieux.'
    },
    {
      name: 'Sophie Martin',
      username: 'sophie_pics',
      email: 'sophie@example.com',
      password: commonPassword,
      avatar: 'https://picsum.photos/id/70/200/200',
      role: 'creator',
      bio: 'Photographe portraitiste basée à Paris.'
    },
    {
      name: 'Lucas Bernard',
      username: 'lucas_design',
      email: 'lucas@example.com',
      password: commonPassword,
      avatar: 'https://picsum.photos/id/80/200/200',
      role: 'creator',
      bio: 'Designer UI/UX, je partage mes templates Notion.'
    },
    {
      name: 'Amélie Petit',
      username: 'amelie_travel',
      email: 'amelie@example.com',
      password: commonPassword,
      avatar: 'https://picsum.photos/id/90/200/200',
      role: 'creator',
      bio: 'Globe-trotteuse et créatrice de guides de voyage PDF.'
    }
  ];

  const createdUsers = [];
  for (const user of users) {
    const created = await prisma.user.create({ data: user });
    createdUsers.push(created);
  }

  const elena = createdUsers.find(u => u.username === 'elenarossi_art');
  const jean = createdUsers.find(u => u.username === 'jdupont_photo');
  const william = createdUsers.find(u => u.username === 'william');

  // 2. Create Posts
  const posts = [
    {
      creatorId: elena.id,
      title: 'Collection Secrète Tokyo Night',
      description: 'Fichiers RAW haute résolution de mon dernier voyage au Japon. Seulement 20 exemplaires disponibles.',
      type: 'image',
      price: 9.99,
      previewUrl: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?q=80&w=800&auto=format&fit=crop',
      fullUrl: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?q=80&w=1200&auto=format&fit=crop'
    },
    {
      creatorId: elena.id,
      title: 'Guide Minimaliste Portrait (PDF)',
      description: 'Une masterclass de 45 pages sur l’éclairage en studio et les poses pour la photographie de mode haut de gamme.',
      type: 'pdf',
      price: 24.50,
      previewUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=800&auto=format&fit=crop',
      fullUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf'
    },
    {
      creatorId: jean.id,
      title: 'Préréglages Lightroom Cinématographiques',
      description: 'Les réglages exacts que j’utilise pour tous mes paysages. Comprend 10 styles uniques.',
      type: 'image',
      price: 15.00,
      previewUrl: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=800&auto=format&fit=crop',
      fullUrl: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=1200&auto=format&fit=crop'
    },
    {
      creatorId: jean.id,
      title: 'Pack Scans Films Vintage',
      description: 'Grain authentique 35mm et textures scannées depuis des bobines Kodak vintage.',
      type: 'image',
      price: 12.00,
      previewUrl: 'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?q=80&w=800&auto=format&fit=crop',
      fullUrl: 'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?q=80&w=1200&auto=format&fit=crop'
    }
  ];

  const sophie = createdUsers.find(u => u.username === 'sophie_pics');
  const lucas = createdUsers.find(u => u.username === 'lucas_design');
  const amelie = createdUsers.find(u => u.username === 'amelie_travel');

  const extraPosts = [
    {
      creatorId: sophie.id,
      title: 'Preset Portrait Doux',
      description: 'Le preset que j’utilise pour adoucir les tons de peau.',
      type: 'image',
      price: 5.00,
      previewUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?q=80&w=800&auto=format&fit=crop',
      fullUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=1200'
    },
    {
      creatorId: lucas.id,
      title: 'Template Portfolio Designer',
      description: 'Template Notion complet pour présenter vos travaux.',
      type: 'pdf',
      price: 19.00,
      previewUrl: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?q=80&w=800&auto=format&fit=crop',
      fullUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf'
    },
    {
      creatorId: amelie.id,
      title: 'Guide 3 jours à Rome',
      description: 'Meilleurs restaurants, vues et coins secrets de Rome.',
      type: 'pdf',
      price: 15.00,
      previewUrl: 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?q=80&w=800&auto=format&fit=crop',
      fullUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf'
    }
  ];

  posts.push(...extraPosts);

  const createdPosts = [];
  for (const post of posts) {
    const created = await prisma.post.create({ data: post });
    createdPosts.push(created);
  }

  // 3. Create Purchases
  const tokyoPost = createdPosts.find(p => p.title === 'Collection Secrète Tokyo Night');
  const guidePost = createdPosts.find(p => p.title === 'Guide Minimaliste Portrait (PDF)');

  await prisma.purchase.createMany({
    data: [
      {
        buyerId: william.id,
        postId: tokyoPost.id,
        amount: tokyoPost.price
      },
      {
        buyerId: william.id,
        postId: guidePost.id,
        amount: guidePost.price
      }
    ]
  });

  console.log('Seeding finished.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
