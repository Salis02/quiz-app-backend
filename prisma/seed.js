const { PrismaClient } = require('@prisma/client');
const { hashPassword } = require('../src/utils/bcrypt');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Create admin user
  const adminPassword = await hashPassword('admin123');
  const admin = await prisma.user.upsert({
    where: { email: 'admin@quiz.com' },
    update: {},
    create: {
      name: 'Quiz Admin',
      email: 'admin@quiz.com',
      password_hash: adminPassword,
      role: 'ADMIN'
    }
  });

  // Create test user
  const userPassword = await hashPassword('user123');
  const user = await prisma.user.upsert({
    where: { email: 'user@quiz.com' },
    update: {},
    create: {
      name: 'Test User',
      email: 'user@quiz.com',
      password_hash: userPassword,
      role: 'USER'
    }
  });

  // Create categories
  const jsCategory = await prisma.category.upsert({
    where: { name: 'JavaScript' },
    update: {},
    create: {
      name: 'JavaScript',
      description: 'Test your JavaScript knowledge'
    }
  });

  const generalCategory = await prisma.category.upsert({
    where: { name: 'General Knowledge' },
    update: {},
    create: {
      name: 'General Knowledge',
      description: 'General knowledge quiz'
    }
  });

  // Create sample quiz
  const jsQuiz = await prisma.quiz.upsert({
    where: { id: 1 },
    update: {},
    create: {
      title: 'JavaScript Basics',
      description: 'Test your basic JavaScript knowledge',
      category_id: jsCategory.id,
      created_by: admin.id,
      published: true
    }
  });

  // Create sample questions
  const question1 = await prisma.question.upsert({
    where: { id: 1 },
    update: {},
    create: {
      quiz_id: jsQuiz.id,
      text: 'What is the correct way to declare a variable in JavaScript?',
      type: 'MCQ'
    }
  });

  // Create options for question 1
  await prisma.option.createMany({
    data: [
      { question_id: question1.id, text: 'var myVar;', is_correct: true },
      { question_id: question1.id, text: 'variable myVar;', is_correct: false },
      { question_id: question1.id, text: 'v myVar;', is_correct: false },
      { question_id: question1.id, text: 'declare myVar;', is_correct: false }
    ],
    skipDuplicates: true
  });

  const question2 = await prisma.question.upsert({
    where: { id: 2 },
    update: {},
    create: {
      quiz_id: jsQuiz.id,
      text: 'JavaScript is a compiled language.',
      type: 'TRUE_FALSE'
    }
  });

  // Create options for question 2
  await prisma.option.createMany({
    data: [
      { question_id: question2.id, text: 'True', is_correct: false },
      { question_id: question2.id, text: 'False', is_correct: true }
    ],
    skipDuplicates: true
  });

  console.log('✅ Seeding completed!');
  console.log(`👨‍💼 Admin: admin@quiz.com / admin123`);
  console.log(`👤 User: user@quiz.com / user123`);
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });