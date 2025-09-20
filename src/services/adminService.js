const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

class AdminService {

 async logAudit(userId, action, entityType, entityId) {
    await prisma.auditLog.create({
      data: { user_id: userId, action, entity_type: entityType, entity_id: entityId }
    });
  }  

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

   async createCategory(categoryData, adminId) {
    const category = await prisma.category.create({ data: categoryData })
    await this.logAudit(adminId, 'CREATE_CATEGORY', 'CATEGORY', category.id)
    return category
  }

  async createQuiz(quizData, adminId) {
    const quiz = await prisma.quiz.create({
      data: { ...quizData, created_by: adminId },
      include: { category: true }
    })
    await this.logAudit(adminId, 'CREATE_QUIZ', 'QUIZ', quiz.id)
    return quiz
  }

  async addQuestion(quizId, questionData, adminId) {
    // …validasi sama seperti sebelumnya
    const question = await prisma.question.create({
      data: { ...questionData, quiz_id: quizId }
    })
    await this.logAudit(adminId, 'ADD_QUESTION', 'QUESTION', question.id)
    return question
  }

  async addOption(questionId, optionData, adminId) {
    const option = await prisma.option.create({
      data: { ...optionData, question_id: questionId }
    })
    await this.logAudit(adminId, 'ADD_OPTION', 'OPTION', option.id)
    return option
  }

  async publishQuiz(quizId, adminId) {
    const updatedQuiz = await prisma.quiz.update({
      where: { id: quizId },
      data: { published: true }
    })
    await this.logAudit(adminId, 'PUBLISH_QUIZ', 'QUIZ', quizId)
    return updatedQuiz
  }

  async unpublishQuiz(quizId, adminId) {
    const updatedQuiz = await prisma.quiz.update({
      where: { id: quizId },
      data: { published: false }
    })
    await this.logAudit(adminId, 'UNPUBLISH_QUIZ', 'QUIZ', quizId)
    return updatedQuiz
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