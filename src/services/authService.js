const { PrismaClient } = require('@prisma/client');
const { hashPassword, comparePassword } = require('../utils/bcrypt');
const { generateToken } = require('../utils/jwt');

const prisma = new PrismaClient();

class AuthService {
  async register(userData) {
    const { name, email, password } = userData;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      throw new Error('Email already registered');
    }

    // Hash password
    const password_hash = await hashPassword(password);

    // Create user
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password_hash,
        role: 'USER'
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        created_at: true
      }
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        user_id: user.id,
        action: 'REGISTER',
        entity_type: 'USER',
        entity_id: user.id
      }
    });

    // Generate token
    const token = generateToken({ 
      id: user.id, 
      email: user.email, 
      role: user.role 
    });

    return { user, token };
  }

  async login(credentials) {
    const { email, password } = credentials;

    // Find user
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      throw new Error('Invalid credentials');
    }

    // Verify password
    const isValidPassword = await comparePassword(password, user.password_hash);
    
    if (!isValidPassword) {
      throw new Error('Invalid credentials');
    }

    // Create audit log
    await prisma.auditLog.create({
      data: {
        user_id: user.id,
        action: 'LOGIN',
        entity_type: 'USER',
        entity_id: user.id
      }
    });

    // Generate token
    const token = generateToken({ 
      id: user.id, 
      email: user.email, 
      role: user.role 
    });

    const userResponse = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      created_at: user.created_at
    };

    return { user: userResponse, token };
  }
}

module.exports = new AuthService();