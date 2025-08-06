"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const storage_1 = require("./storage");
const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key';
const JWT_EXPIRES_IN = '7d';
const SALT_ROUNDS = 12;
class AuthService {
    static async hashPassword(password) {
        return bcrypt_1.default.hash(password, SALT_ROUNDS);
    }
    static async verifyPassword(password, hash) {
        return bcrypt_1.default.compare(password, hash);
    }
    static generateToken(user) {
        const payload = {
            userId: user.id,
            email: user.email
        };
        return jsonwebtoken_1.default.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
    }
    static verifyToken(token) {
        try {
            return jsonwebtoken_1.default.verify(token, JWT_SECRET);
        }
        catch (error) {
            return null;
        }
    }
    static async register(email, password, fullName, phoneNumber) {
        const existingUser = await storage_1.storage.getUserByEmail(email);
        if (existingUser) {
            throw new Error('User already exists');
        }
        const passwordHash = await this.hashPassword(password);
        const user = await storage_1.storage.createUser({
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
    static async login(email, password) {
        const user = await storage_1.storage.getUserByEmail(email);
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
    static async getUserFromToken(token) {
        const payload = this.verifyToken(token);
        if (!payload) {
            return null;
        }
        const user = await storage_1.storage.getUser(payload.userId);
        return user ?? null; // This ensures the return type is either User or null
    }
}
exports.AuthService = AuthService;
