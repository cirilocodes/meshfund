"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerRoutes = registerRoutes;
const http_1 = require("http");
const ws_1 = require("ws");
const stripe_1 = __importDefault(require("stripe"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const storage_1 = require("./storage");
const auth_1 = require("./auth");
const notifications_1 = require("./services/notifications");
const auth_2 = require("./middleware/auth");
const validation_1 = require("./middleware/validation");
const paypal_1 = require("./paypal");
// Stripe setup
const stripeSecretKey = process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder';
if (!process.env.STRIPE_SECRET_KEY) {
    console.warn('Missing STRIPE_SECRET_KEY - Stripe payments will be disabled');
}
const stripe = new stripe_1.default(stripeSecretKey, {
    apiVersion: "2023-10-16",
});
// Rate limiting
const authLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 attempts per window
    message: { error: 'Too many authentication attempts, please try again later.' }
});
const generalLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // 100 requests per window
    message: { error: 'Too many requests, please try again later.' }
});
async function registerRoutes(app) {
    // Apply general rate limiting
    app.use('/api', generalLimiter);
    // Root route - API documentation/status
    app.get('/', (req, res) => {
        res.json({
            name: 'MeshFund API',
            version: '1.0.0',
            status: 'running',
            description: 'Production-ready fintech platform for global savings circles',
            endpoints: {
                health: '/api/health',
                auth: {
                    register: 'POST /api/auth/register',
                    login: 'POST /api/auth/login',
                    me: 'GET /api/auth/me'
                },
                groups: {
                    create: 'POST /api/groups',
                    list: 'GET /api/groups',
                    details: 'GET /api/groups/:id',
                    join: 'POST /api/groups/:id/join'
                },
                payments: {
                    stripe: 'POST /api/stripe/create-payment-intent',
                    paypal_setup: 'GET /api/paypal/setup',
                    paypal_order: 'POST /api/paypal/order'
                },
                websocket: 'ws://localhost:5000/ws'
            },
            timestamp: new Date().toISOString()
        });
    });
    // Health check
    app.get('/api/health', (req, res) => {
        res.json({ status: 'healthy', timestamp: new Date().toISOString() });
    });
    // Authentication routes
    app.post('/api/auth/register', authLimiter, (0, validation_1.validateBody)(validation_1.schemas.register), async (req, res) => {
        try {
            const { email, password, fullName, phoneNumber } = req.body;
            const { user, token } = await auth_1.AuthService.register(email, password, fullName, phoneNumber);
            // Remove password hash from response
            const { passwordHash, ...userResponse } = user;
            res.status(201).json({
                success: true,
                data: { user: userResponse, token }
            });
        }
        catch (error) {
            res.status(400).json({
                success: false,
                error: error.message
            });
        }
    });
    app.post('/api/auth/login', authLimiter, (0, validation_1.validateBody)(validation_1.schemas.login), async (req, res) => {
        try {
            const { email, password } = req.body;
            const { user, token } = await auth_1.AuthService.login(email, password);
            // Remove password hash from response
            const { passwordHash, ...userResponse } = user;
            res.json({
                success: true,
                data: { user: userResponse, token }
            });
        }
        catch (error) {
            res.status(401).json({
                success: false,
                error: error.message
            });
        }
    });
    app.get('/api/auth/me', auth_2.authenticateToken, async (req, res) => {
        const { passwordHash, ...userResponse } = req.user;
        res.json({
            success: true,
            data: { user: userResponse }
        });
    });
    // PayPal routes
    app.get("/api/paypal/setup", async (req, res) => {
        await (0, paypal_1.loadPaypalDefault)(req, res);
    });
    app.post("/api/paypal/order", async (req, res) => {
        await (0, paypal_1.createPaypalOrder)(req, res);
    });
    app.post("/api/paypal/order/:orderID/capture", async (req, res) => {
        await (0, paypal_1.capturePaypalOrder)(req, res);
    });
    // Stripe payment routes
    app.post("/api/stripe/create-payment-intent", auth_2.authenticateToken, async (req, res) => {
        try {
            const { amount, currency = 'USD', metadata = {} } = req.body;
            if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
                return res.status(400).json({ error: "Invalid amount" });
            }
            const paymentIntent = await stripe.paymentIntents.create({
                amount: Math.round(parseFloat(amount) * 100), // Convert to cents
                currency: currency.toLowerCase(),
                metadata: {
                    userId: req.user.id,
                    ...metadata
                }
            });
            res.json({
                success: true,
                data: { clientSecret: paymentIntent.client_secret }
            });
        }
        catch (error) {
            res.status(500).json({
                success: false,
                error: "Error creating payment intent: " + error.message
            });
        }
    });
    // Group management routes
    app.post('/api/groups', auth_2.authenticateToken, auth_2.requireEmailVerification, (0, validation_1.validateBody)(validation_1.schemas.createGroup), async (req, res) => {
        try {
            const { name, description, contributionAmount, frequency, maxMembers, currency } = req.body;
            const group = await storage_1.storage.createGroup({
                name,
                description,
                adminId: req.user.id,
                contributionAmount,
                frequency,
                maxMembers,
                currency,
                currentCycle: 1,
                isLocked: false
            });
            // Add admin as first member
            await storage_1.storage.addGroupMember({
                groupId: group.id,
                userId: req.user.id,
                payoutPosition: 1
            });
            res.status(201).json({
                success: true,
                data: { group }
            });
        }
        catch (error) {
            res.status(400).json({
                success: false,
                error: error.message
            });
        }
    });
    app.get('/api/groups', auth_2.authenticateToken, async (req, res) => {
        try {
            const groups = await storage_1.storage.getUserGroups(req.user.id);
            res.json({
                success: true,
                data: { groups }
            });
        }
        catch (error) {
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    });
    app.get('/api/groups/:id', auth_2.authenticateToken, (0, validation_1.validateParams)(validation_1.schemas.uuidParam), async (req, res) => {
        try {
            const { id } = req.params;
            const group = await storage_1.storage.getGroup(id);
            if (!group) {
                return res.status(404).json({
                    success: false,
                    error: 'Group not found'
                });
            }
            // Check if user is a member
            const membership = await storage_1.storage.getGroupMember(id, req.user.id);
            if (!membership) {
                return res.status(403).json({
                    success: false,
                    error: 'Access denied'
                });
            }
            const members = await storage_1.storage.getGroupMembers(id);
            const contributions = await storage_1.storage.getContributions(id, group.currentCycle || 1);
            res.json({
                success: true,
                data: {
                    group,
                    members,
                    contributions
                }
            });
        }
        catch (error) {
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    });
    app.post('/api/groups/:id/join', auth_2.authenticateToken, auth_2.requireEmailVerification, (0, validation_1.validateParams)(validation_1.schemas.uuidParam), async (req, res) => {
        try {
            const { id } = req.params;
            const group = await storage_1.storage.getGroup(id);
            if (!group) {
                return res.status(404).json({
                    success: false,
                    error: 'Group not found'
                });
            }
            if (group.isLocked) {
                return res.status(400).json({
                    success: false,
                    error: 'Group is locked and not accepting new members'
                });
            }
            const currentMembers = await storage_1.storage.getGroupMembers(id);
            if (currentMembers.length >= group.maxMembers) {
                return res.status(400).json({
                    success: false,
                    error: 'Group is full'
                });
            }
            // Check if already a member
            const existingMembership = await storage_1.storage.getGroupMember(id, req.user.id);
            if (existingMembership) {
                return res.status(400).json({
                    success: false,
                    error: 'Already a member of this group'
                });
            }
            const membership = await storage_1.storage.addGroupMember({
                groupId: id,
                userId: req.user.id,
                payoutPosition: currentMembers.length + 1
            });
            // Notify other members
            await notifications_1.NotificationService.notifyGroupMembers(id, 'New Member Joined', `${req.user.fullName} has joined the group`, req.user.id);
            res.status(201).json({
                success: true,
                data: { membership }
            });
        }
        catch (error) {
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    });
    // Contribution routes
    app.post('/api/groups/:id/contributions', auth_2.authenticateToken, auth_2.requireKYC, (0, validation_1.validateParams)(validation_1.schemas.uuidParam), (0, validation_1.validateBody)(validation_1.schemas.makeContribution), async (req, res) => {
        try {
            const { id: groupId } = req.params;
            const { amount, paymentMethod } = req.body;
            const group = await storage_1.storage.getGroup(groupId);
            if (!group) {
                return res.status(404).json({
                    success: false,
                    error: 'Group not found'
                });
            }
            // Verify membership
            const membership = await storage_1.storage.getGroupMember(groupId, req.user.id);
            if (!membership) {
                return res.status(403).json({
                    success: false,
                    error: 'Not a member of this group'
                });
            }
            // Check if already contributed for current cycle
            const existingContribution = await storage_1.storage.getContributions(groupId, group.currentCycle || 1);
            const userContribution = existingContribution.find(c => c.userId === req.user.id);
            if (userContribution && userContribution.status === 'paid') {
                return res.status(400).json({
                    success: false,
                    error: 'Already contributed for this cycle'
                });
            }
            // Validate amount matches group requirement
            if (parseFloat(amount) !== parseFloat(group.contributionAmount)) {
                return res.status(400).json({
                    success: false,
                    error: `Contribution amount must be ${group.contributionAmount} ${group.currency}`
                });
            }
            const contribution = await storage_1.storage.createContribution({
                groupId,
                userId: req.user.id,
                amount,
                cycleNumber: group.currentCycle || 1,
                status: 'paid', // In real implementation, this would be 'pending' until payment confirms
                paymentMethod,
                dueDate: group.nextPaymentDue || new Date(),
                paidAt: new Date()
            });
            res.status(201).json({
                success: true,
                data: { contribution }
            });
        }
        catch (error) {
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    });
    app.get('/api/contributions', auth_2.authenticateToken, async (req, res) => {
        try {
            const contributions = await storage_1.storage.getUserContributions(req.user.id);
            res.json({
                success: true,
                data: { contributions }
            });
        }
        catch (error) {
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    });
    // Payout routes
    app.get('/api/payouts', auth_2.authenticateToken, async (req, res) => {
        try {
            const payouts = await storage_1.storage.getUserPayouts(req.user.id);
            res.json({
                success: true,
                data: { payouts }
            });
        }
        catch (error) {
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    });
    // Notification routes
    app.get('/api/notifications', auth_2.authenticateToken, async (req, res) => {
        try {
            const { unread } = req.query;
            const notifications = await storage_1.storage.getUserNotifications(req.user.id, unread === 'true');
            res.json({
                success: true,
                data: { notifications }
            });
        }
        catch (error) {
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    });
    app.patch('/api/notifications/:id/read', auth_2.authenticateToken, (0, validation_1.validateParams)(validation_1.schemas.uuidParam), async (req, res) => {
        try {
            const { id } = req.params;
            await storage_1.storage.markNotificationRead(id);
            res.json({
                success: true,
                message: 'Notification marked as read'
            });
        }
        catch (error) {
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    });
    // Additional missing endpoints for full functionality
    // Group contribution routes
    app.get('/api/groups/:id/contributions', auth_2.authenticateToken, (0, validation_1.validateParams)(validation_1.schemas.uuidParam), async (req, res) => {
        try {
            const { id: groupId } = req.params;
            const { cycle } = req.query;
            // Verify membership
            const membership = await storage_1.storage.getGroupMember(groupId, req.user.id);
            if (!membership) {
                return res.status(403).json({
                    success: false,
                    error: 'Not a member of this group'
                });
            }
            const contributions = await storage_1.storage.getContributions(groupId, cycle ? parseInt(cycle) : undefined);
            res.json({
                success: true,
                data: { contributions }
            });
        }
        catch (error) {
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    });
    // Group payout routes
    app.get('/api/groups/:id/payouts', auth_2.authenticateToken, (0, validation_1.validateParams)(validation_1.schemas.uuidParam), async (req, res) => {
        try {
            const { id: groupId } = req.params;
            // Verify membership
            const membership = await storage_1.storage.getGroupMember(groupId, req.user.id);
            if (!membership) {
                return res.status(403).json({
                    success: false,
                    error: 'Not a member of this group'
                });
            }
            const payouts = await storage_1.storage.getPayouts(groupId);
            res.json({
                success: true,
                data: { payouts }
            });
        }
        catch (error) {
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    });
    // Request payout
    app.post('/api/groups/:id/payout', auth_2.authenticateToken, auth_2.requireKYC, (0, validation_1.validateParams)(validation_1.schemas.uuidParam), async (req, res) => {
        try {
            const { id: groupId } = req.params;
            const { paymentMethod } = req.body;
            const group = await storage_1.storage.getGroup(groupId);
            if (!group) {
                return res.status(404).json({
                    success: false,
                    error: 'Group not found'
                });
            }
            // Verify membership
            const membership = await storage_1.storage.getGroupMember(groupId, req.user.id);
            if (!membership) {
                return res.status(403).json({
                    success: false,
                    error: 'Not a member of this group'
                });
            }
            // Check if user has already received payout for current cycle
            if (membership.hasReceivedPayout) {
                return res.status(400).json({
                    success: false,
                    error: 'Already received payout for this cycle'
                });
            }
            // Check if all members have contributed
            const members = await storage_1.storage.getGroupMembers(groupId);
            const contributions = await storage_1.storage.getContributions(groupId, group.currentCycle || 1);
            const paidContributions = contributions.filter(c => c.status === 'paid');
            if (paidContributions.length < members.length) {
                return res.status(400).json({
                    success: false,
                    error: `Payout not available. ${paidContributions.length}/${members.length} members have contributed`
                });
            }
            // Calculate payout amount (total contributions for the cycle)
            const totalAmount = paidContributions.reduce((sum, c) => sum + parseFloat(c.amount), 0);
            const payout = await storage_1.storage.createPayout({
                groupId,
                userId: req.user.id,
                cycleNumber: group.currentCycle || 1,
                amount: totalAmount.toString(),
                status: 'pending',
                paymentMethod
            });
            // Mark member as having received payout
            await storage_1.storage.updateGroupMember(membership.id, { hasReceivedPayout: true });
            res.status(201).json({
                success: true,
                data: { payout }
            });
        }
        catch (error) {
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    });
    // Group members management
    app.get('/api/groups/:id/members', auth_2.authenticateToken, (0, validation_1.validateParams)(validation_1.schemas.uuidParam), async (req, res) => {
        try {
            const { id: groupId } = req.params;
            // Verify membership
            const membership = await storage_1.storage.getGroupMember(groupId, req.user.id);
            if (!membership) {
                return res.status(403).json({
                    success: false,
                    error: 'Not a member of this group'
                });
            }
            const members = await storage_1.storage.getGroupMembers(groupId);
            res.json({
                success: true,
                data: { members }
            });
        }
        catch (error) {
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    });
    // Leave group
    app.post('/api/groups/:id/leave', auth_2.authenticateToken, (0, validation_1.validateParams)(validation_1.schemas.uuidParam), async (req, res) => {
        try {
            const { id: groupId } = req.params;
            const group = await storage_1.storage.getGroup(groupId);
            if (!group) {
                return res.status(404).json({
                    success: false,
                    error: 'Group not found'
                });
            }
            // Admin cannot leave their own group
            if (group.adminId === req.user.id) {
                return res.status(400).json({
                    success: false,
                    error: 'Group admin cannot leave the group'
                });
            }
            await storage_1.storage.removeGroupMember(groupId, req.user.id);
            res.json({
                success: true,
                message: 'Successfully left the group'
            });
        }
        catch (error) {
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    });
    // Profile update
    app.patch('/api/auth/profile', auth_2.authenticateToken, async (req, res) => {
        try {
            const updates = req.body;
            const updatedUser = await storage_1.storage.updateUser(req.user.id, updates);
            const { passwordHash, ...userResponse } = updatedUser;
            res.json({
                success: true,
                data: { user: userResponse }
            });
        }
        catch (error) {
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    });
    // Search groups
    app.get('/api/groups/search', auth_2.authenticateToken, async (req, res) => {
        try {
            const { q: query } = req.query;
            if (!query || typeof query !== 'string') {
                return res.status(400).json({
                    success: false,
                    error: 'Search query is required'
                });
            }
            // Simple search implementation - in production, use proper full-text search
            // For now, this is a placeholder that returns empty array
            const groups = [];
            res.json({
                success: true,
                data: { groups }
            });
        }
        catch (error) {
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    });
    // Payout history
    app.get('/api/payouts/history', auth_2.authenticateToken, async (req, res) => {
        try {
            const { groupId } = req.query;
            let payouts;
            if (groupId) {
                // Verify membership if groupId is specified
                const membership = await storage_1.storage.getGroupMember(groupId, req.user.id);
                if (!membership) {
                    return res.status(403).json({
                        success: false,
                        error: 'Not a member of this group'
                    });
                }
                payouts = await storage_1.storage.getPayouts(groupId);
            }
            else {
                payouts = await storage_1.storage.getUserPayouts(req.user.id);
            }
            res.json({
                success: true,
                data: { payouts }
            });
        }
        catch (error) {
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    });
    // Get payout status for a group/cycle
    app.get('/api/groups/:id/payout-status', auth_2.authenticateToken, (0, validation_1.validateParams)(validation_1.schemas.uuidParam), async (req, res) => {
        try {
            const { id: groupId } = req.params;
            const { cycle, userId } = req.query;
            const group = await storage_1.storage.getGroup(groupId);
            if (!group) {
                return res.status(404).json({
                    success: false,
                    error: 'Group not found'
                });
            }
            const targetUserId = userId || req.user.id;
            const cycleNumber = cycle ? parseInt(cycle) : group.currentCycle || 1;
            // Verify membership
            const membership = await storage_1.storage.getGroupMember(groupId, targetUserId);
            if (!membership) {
                return res.status(403).json({
                    success: false,
                    error: 'Not a member of this group'
                });
            }
            const members = await storage_1.storage.getGroupMembers(groupId);
            const contributions = await storage_1.storage.getContributions(groupId, cycleNumber);
            const paidContributions = contributions.filter(c => c.status === 'paid');
            const isEligible = paidContributions.length >= members.length;
            const hasReceived = membership.hasReceivedPayout;
            const expectedAmount = isEligible ? (paidContributions.reduce((sum, c) => sum + parseFloat(c.amount), 0)).toString() : '0';
            res.json({
                success: true,
                data: {
                    isEligible,
                    hasReceived,
                    expectedAmount
                }
            });
        }
        catch (error) {
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    });
    // Create HTTP server
    const httpServer = (0, http_1.createServer)(app);
    // WebSocket server setup
    const wss = new ws_1.WebSocketServer({
        server: httpServer,
        path: '/ws'
    });
    // WebSocket connection handling
    wss.on('connection', (ws, request) => {
        console.log('New WebSocket connection established');
        ws.on('message', async (message) => {
            try {
                const data = JSON.parse(message.toString());
                // Handle different message types
                switch (data.type) {
                    case 'auth':
                        // Authenticate WebSocket connection
                        const user = await auth_1.AuthService.getUserFromToken(data.token);
                        if (user) {
                            ws.userId = user.id;
                            ws.send(JSON.stringify({ type: 'auth_success', userId: user.id }));
                        }
                        else {
                            ws.send(JSON.stringify({ type: 'auth_error', message: 'Invalid token' }));
                        }
                        break;
                    case 'join_group':
                        // Join group room for real-time updates
                        ws.groupId = data.groupId;
                        ws.send(JSON.stringify({ type: 'joined_group', groupId: data.groupId }));
                        break;
                }
            }
            catch (error) {
                console.error('WebSocket message error:', error);
            }
        });
        ws.on('close', () => {
            console.log('WebSocket connection closed');
        });
        ws.on('error', (error) => {
            console.error('WebSocket error:', error);
        });
    });
    // Broadcast function for real-time notifications
    global.broadcastToGroup = (groupId, message) => {
        wss.clients.forEach((client) => {
            if (client.readyState === ws_1.WebSocket.OPEN && client.groupId === groupId) {
                client.send(JSON.stringify(message));
            }
        });
    };
    return httpServer;
}
