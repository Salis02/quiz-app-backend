const { z } = require('zod');

const validate = (schema) => {
  return (req, res, next) => {
    try {
      schema.parse(req.body);
      next();
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.errors
      });
    }
  };
};

// Common validation schemas
const schemas = {
  register: z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Invalid email format'),
    password: z.string().min(6, 'Password must be at least 6 characters')
  }),

  login: z.object({
    email: z.string().email('Invalid email format'),
    password: z.string().min(1, 'Password is required')
  }),

  createCategory: z.object({
    name: z.string().min(1, 'Category name is required'),
    description: z.string().optional()
  }),

  createQuiz: z.object({
    title: z.string().min(1, 'Quiz title is required'),
    description: z.string().optional(),
    category_id: z.number().int().positive().optional()
  }),

  createQuestion: z.object({
    text: z.string().min(1, 'Question text is required'),
    type: z.enum(['MCQ', 'TRUE_FALSE', 'MULTIPLE_CHOICE']).default('MCQ')
  }),

  createOption: z.object({
    text: z.string().min(1, 'Option text is required'),
    is_correct: z.boolean().default(false)
  }),

  submitAnswer: z.object({
    option_id: z.number().int().positive()
  })
};

module.exports = {
  validate,
  schemas
};