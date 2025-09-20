const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

class QuizService {
  async getPublicQuizzes() {
    return await prisma.quiz.findMany({
      where: { published: true },
      include: {
        category: true,
        creator: {
          select: { id: true, name: true }
        },
        _count: {
          select: { questions: true }
        }
      },
      orderBy: { created_at: 'desc' }
    });
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
            options: true
          },
          orderBy: { created_at: 'asc' }
        }
      }
    });

    if (!quiz) {
      throw new Error('Quiz not found');
    }

    if (!quiz.published) {
      throw new Error('Quiz is not published');
    }

    return quiz;
  }

  async startQuiz(userId, quizId) {
    // Check if quiz exists and is published
    const quiz = await prisma.quiz.findUnique({
      where: { id: quizId },
      include: {
        questions: {
          include: {
            options: true,
          },
          orderBy: { created_at: 'asc' }, // Pastikan urutan pertanyaan konsisten
        },
      },
    });

    if (!quiz) {
      throw new Error('Quiz not found');
    }

    if (!quiz.published) {
      throw new Error('Quiz is not published');
    }

    // Check if user already has an ongoing result
    const existingResult = await prisma.result.findFirst({
      where: {
        user_id: userId,
        quiz_id: quizId,
        finished_at: null
      }
    });

    if (existingResult) {
      throw new Error('Quiz already started. Please finish the current attempt.');
    }

    // Create new result record
    const result = await prisma.result.create({
      data: {
        user_id: userId,
        quiz_id: quizId,
        score: 0,
        started_at: new Date()
      }
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        user_id: userId,
        action: 'START_QUIZ',
        entity_type: 'QUIZ',
        entity_id: quizId
      }
    });

    return {
      result_id: result.id,
      quiz,
      started_at: result.started_at
    };
  }

  async submitAnswer(userId, questionId, optionId) {
    // Verify question exists
    const question = await prisma.question.findUnique({
      where: { id: questionId },
      include: {
        quiz: true,
        options: true
      }
    });

    if (!question) {
      throw new Error('Question not found');
    }

    // Verify option belongs to this question
    const option = question.options.find(opt => opt.id === optionId);
    if (!option) {
      throw new Error('Invalid option for this question');
    }

    // Check if user has an active quiz session
    const activeResult = await prisma.result.findFirst({
      where: {
        user_id: userId,
        quiz_id: question.quiz_id,
        finished_at: null
      }
    });

    if (!activeResult) {
      throw new Error('No active quiz session found');
    }

    // Check if user already answered this question
    const existingAnswer = await prisma.answer.findUnique({
      where: {
        user_id_question_id: {
          user_id: userId,
          question_id: questionId
        }
      }
    });

    if (existingAnswer) {
      throw new Error('Question already answered');
    }

    // Save answer
    const answer = await prisma.answer.create({
      data: {
        user_id: userId,
        question_id: questionId,
        option_id: optionId
      }
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        user_id: userId,
        action: 'SUBMIT_ANSWER',
        entity_type: 'QUESTION',
        entity_id: questionId
      }
    });

    return {
      answer_id: answer.id,
      is_correct: option.is_correct,
      submitted_at: answer.created_at
    };
  }

  async finishQuiz(userId, quizId) {
    // Find active result
    const activeResult = await prisma.result.findFirst({
      where: {
        user_id: userId,
        quiz_id: quizId,
        finished_at: null
      }
    });

    if (!activeResult) {
      throw new Error('No active quiz session found');
    }

    // Calculate score
    const totalQuestions = await prisma.question.count({
      where: { quiz_id: quizId }
    });

    const correctAnswers = await prisma.answer.count({
      where: {
        user_id: userId,
        question: {
          quiz_id: quizId
        },
        option: {
          is_correct: true
        }
      }
    });

    const score = totalQuestions > 0 ? (correctAnswers / totalQuestions) * 100 : 0;

    // Update result
    const updatedResult = await prisma.result.update({
      where: { id: activeResult.id },
      data: {
        score,
        finished_at: new Date()
      },
      include: {
        quiz: {
          select: { title: true }
        }
      }
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        user_id: userId,
        action: 'FINISH_QUIZ',
        entity_type: 'QUIZ',
        entity_id: quizId
      }
    });

    return {
      result_id: updatedResult.id,
      quiz_title: updatedResult.quiz.title,
      total_questions: totalQuestions,
      correct_answers: correctAnswers,
      score: score,
      started_at: updatedResult.started_at,
      finished_at: updatedResult.finished_at
    };
  }

  async getUserResults(userId) {
    return await prisma.result.findMany({
      where: {
        user_id: userId,
        finished_at: { not: null }
      },
      include: {
        quiz: {
          select: { id: true, title: true }
        }
      },
      orderBy: { finished_at: 'desc' }
    });
  }
}

module.exports = new QuizService();