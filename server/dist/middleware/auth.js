"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireEmailVerification = exports.requireKYC = exports.authenticateToken = void 0;
const auth_1 = require("../auth");
const authenticateToken = async (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
    if (!token) {
        return res.status(401).json({ error: 'Access token required' });
    }
    try {
        const user = await auth_1.AuthService.getUserFromToken(token);
        if (!user) {
            return res.status(403).json({ error: 'Invalid or expired token' });
        }
        req.user = user;
        next();
    }
    catch (error) {
        return res.status(403).json({ error: 'Invalid token' });
    }
};
exports.authenticateToken = authenticateToken;
const requireKYC = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({ error: 'Authentication required' });
    }
    if (req.user.kycStatus !== 'approved') {
        return res.status(403).json({
            error: 'KYC verification required',
            kycStatus: req.user.kycStatus
        });
    }
    next();
};
exports.requireKYC = requireKYC;
const requireEmailVerification = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({ error: 'Authentication required' });
    }
    if (!req.user.isEmailVerified) {
        return res.status(403).json({ error: 'Email verification required' });
    }
    next();
};
exports.requireEmailVerification = requireEmailVerification;
