import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { storage } from './storage';
import type { User } from '../shared/schema';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key';
const JWT_EXPIRES_IN = '7d';
const SALT_ROUNDS = 12;

export interface JWTPayload {
  userId: string;
  email: string;
  iat?: number;
  exp?: number;
}

export class AuthService {
  static async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, SALT_ROUNDS);
  }

  static async verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  static generateToken(user: User): string {
    const payload: JWTPayload = {
      userId: user.id,
      email: user.email
    };
    
    return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
  }

  static verifyToken(token: string): JWTPayload | null {
    try {
      return jwt.verify(token, JWT_SECRET) as JWTPayload;
    } catch (error) {
      return null;
    }
  }

  static async register(email: string, password: string, fullName: string, phoneNumber?: string): Promise<{ user: User; token: string }> {
    const existingUser = await storage.getUserByEmail(email);
    if (existingUser) {
      throw new Error('User already exists');
    }

    const passwordHash = await this.hashPassword(password);
    
    const user = await storage.createUser({
      email,
      passwordHash,
      fullName,
      phoneNumber,
      isEmailVerified: false,
      isPhoneVerified: false,
      kycStatus: 'pending',
      reputationScore: 100
    });

    const token = this.generateToken(user);
    
    return { user, token };
  }

  static async login(email: string, password: string): Promise<{ user: User; token: string }> {
    const user = await storage.getUserByEmail(email);
    if (!user) {
      throw new Error('Invalid credentials');
    }

    const isValidPassword = await this.verifyPassword(password, user.passwordHash);
    if (!isValidPassword) {
      throw new Error('Invalid credentials');
    }

    const token = this.generateToken(user);
    
    return { user, token };
  }

  static async getUserFromToken(token: string): Promise<User | null> {
    const payload = this.verifyToken(token);
    if (!payload) {
      return null;
    }

    return storage.getUser(payload.userId);
  }
}
