const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

class AdminService {
  async createCategory(categoryData, adminId) {
    const category = await prisma.category.create({
      data: categoryData
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        user_id: adminId,
        action: 'CREATE_CATEGORY',
        entity_type: 'CATEGORY',
        entity_id: category.id
      }
    });

    return category;
  }

  async getCategories() {
    return await prisma.category.findMany({
      include: {
        _count: {
          select: { quizzes: true }
        }
      },
      orderBy: { name: 'asc' }
    });
  }

  async createQuiz(quizData, adminId) {
    const quiz = await prisma.quiz.create({
      data: {
        ...quizData,
        created_by: adminId
      },
      include: {
        category: true
      }
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        user_id: adminId,
        action: 'CREATE_QUIZ',
        entity_type: 'QUIZ',
        entity_id: quiz.id
      }
    });

    return quiz;
  }

  async getQuizById(quizId) {
    const quiz = await prisma.quiz.findUnique({
      where: { id: quizId },
      include: {
        category: true,
        creator: {
          select: { id: true, name: true }
        },
        questions: {
          include: {
            options: {
              orderBy: { id: 'asc' }
            }
          },
          orderBy: { created_at: 'asc' }
        },
        _count: {
          select: { results: true }
        }
      }
    });

    if (!quiz) {
      throw new Error('Quiz not found');
    }

    return quiz;
  }

  async addQuestion(quizId, questionData, adminId) {
    // Verify quiz exists and admin has permission
    const quiz = await prisma.quiz.findUnique({
      where: { id: quizId },
      select: { id: true, created_by: true }
    });

    if (!quiz) {
      throw new Error('Quiz not found');
    }

    if (quiz.created_by !== adminId) {
      throw new Error('Permission denied');
    }

    const question = await prisma.question.create({
      data: {
        ...questionData,
        quiz_id: quizId
      }
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        user_id: adminId,
        action: 'ADD_QUESTION',
        entity_type: 'QUESTION',
        entity_id: question.id
      }
    });

    return question;
  }

  async addOption(questionId, optionData, adminId) {
    // Verify question exists and admin has permission
    const question = await prisma.question.findUnique({
      where: { id: questionId },
      include: {
        quiz: {
          select: { created_by: true }
        }
      }
    });

    if (!question) {
      throw new Error('Question not found');
    }

    if (question.quiz.created_by !== adminId) {
      throw new Error('Permission denied');
    }

    const option = await prisma.option.create({
      data: {
        ...optionData,
        question_id: questionId
      }
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        user_id: adminId,
        action: 'ADD_OPTION',
        entity_type: 'OPTION',
        entity_id: option.id
      }
    });

    return option;
  }

  async publishQuiz(quizId, adminId) {
    // Verify quiz exists and admin has permission
    const quiz = await prisma.quiz.findUnique({
      where: { id: quizId },
      include: {
        questions: {
          include: {
            options: true
          }
        }
      }
    });

    if (!quiz) {
      throw new Error('Quiz not found');
    }

    if (quiz.created_by !== adminId) {
      throw new Error('Permission denied');
    }

    // Validate quiz has questions and options
    if (quiz.questions.length === 0) {
      throw new Error('Quiz must have at least one question');
    }

    for (const question of quiz.questions) {
      if (question.options.length === 0) {
        throw new Error(`Question "${question.text}" must have at least one option`);
      }

      const hasCorrectAnswer = question.options.some(option => option.is_correct);
      if (!hasCorrectAnswer) {
        throw new Error(`Question "${question.text}" must have at least one correct answer`);
      }
    }

    const updatedQuiz = await prisma.quiz.update({
      where: { id: quizId },
      data: { published: true }
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        user_id: adminId,
        action: 'PUBLISH_QUIZ',
        entity_type: 'QUIZ',
        entity_id: quizId
      }
    });

    return updatedQuiz;
  }

  async getQuizResults(quizId, adminId) {
    // Verify quiz exists and admin has permission
    const quiz = await prisma.quiz.findUnique({
      where: { id: quizId },
      select: { id: true, title: true, created_by: true }
    });

    if (!quiz) {
      throw new Error('Quiz not found');
    }

    if (quiz.created_by !== adminId) {
      throw new Error('Permission denied');
    }

    const results = await prisma.result.findMany({
      where: { 
        quiz_id: quizId,
        finished_at: { not: null }
      },
      include: {
        user: {
          select: { id: true, name: true, email: true }
        }
      },
      orderBy: [
        { score: 'desc' },
        { finished_at: 'asc' }
      ]
    });

    // Calculate statistics
    const totalAttempts = results.length;
    const averageScore = totalAttempts > 0 
      ? results.reduce((sum, result) => sum + result.score, 0) / totalAttempts 
      : 0;
    const highestScore = totalAttempts > 0 
      ? Math.max(...results.map(result => result.score)) 
      : 0;
    const lowestScore = totalAttempts > 0 
      ? Math.min(...results.map(result => result.score)) 
      : 0;

    return {
      quiz: {
        id: quiz.id,
        title: quiz.title
      },
      statistics: {
        total_attempts: totalAttempts,
        average_score: Math.round(averageScore * 100) / 100,
        highest_score: highestScore,
        lowest_score: lowestScore
      },
      results
    };
  }

  async getAllQuizzes(adminId) {
    return await prisma.quiz.findMany({
      where: { created_by: adminId },
      include: {
        category: true,
        _count: {
          select: { 
            questions: true,
            results: true
          }
        }
      },
      orderBy: { created_at: 'desc' }
    });
  }
}

module.exports = new AdminService();