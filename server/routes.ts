import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from 'ws';
import Stripe from "stripe";
import rateLimit from 'express-rate-limit';
import { z } from 'zod';

import { storage } from "./storage";
import { AuthService } from "./auth";
import { NotificationService } from "./services/notifications";
import { authenticateToken, requireKYC, requireEmailVerification, type AuthenticatedRequest } from "./middleware/auth";
import { validateBody, validateParams, schemas } from "./middleware/validation";
import { createPaypalOrder, capturePaypalOrder, loadPaypalDefault } from "./paypal";

// Stripe setup
const stripeSecretKey = process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder';
if (!process.env.STRIPE_SECRET_KEY) {
  console.warn('Missing STRIPE_SECRET_KEY - Stripe payments will be disabled');
}
const stripe = new Stripe(stripeSecretKey, {
  apiVersion: "2023-10-16",
});

// Rate limiting
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per window
  message: { error: 'Too many authentication attempts, please try again later.' }
});

const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
  message: { error: 'Too many requests, please try again later.' }
});

export async function registerRoutes(app: Express): Promise<Server> {
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
  app.post('/api/auth/register', authLimiter, validateBody(schemas.register), async (req, res) => {
    try {
      const { email, password, fullName, phoneNumber } = req.body;
      const { user, token } = await AuthService.register(email, password, fullName, phoneNumber);
      
      // Remove password hash from response
      const { passwordHash, ...userResponse } = user;
      
      res.status(201).json({
        success: true,
        data: { user: userResponse, token }
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  });

  app.post('/api/auth/login', authLimiter, validateBody(schemas.login), async (req, res) => {
    try {
      const { email, password } = req.body;
      const { user, token } = await AuthService.login(email, password);
      
      // Remove password hash from response
      const { passwordHash, ...userResponse } = user;
      
      res.json({
        success: true,
        data: { user: userResponse, token }
      });
    } catch (error: any) {
      res.status(401).json({
        success: false,
        error: error.message
      });
    }
  });

  app.get('/api/auth/me', authenticateToken, async (req: AuthenticatedRequest, res) => {
    const { passwordHash, ...userResponse } = req.user!;
    res.json({
      success: true,
      data: { user: userResponse }
    });
  });

  // PayPal routes
  app.get("/api/paypal/setup", async (req, res) => {
    await loadPaypalDefault(req, res);
  });

  app.post("/api/paypal/order", async (req, res) => {
    await createPaypalOrder(req, res);
  });

  app.post("/api/paypal/order/:orderID/capture", async (req, res) => {
    await capturePaypalOrder(req, res);
  });

  // Stripe payment routes
  app.post("/api/stripe/create-payment-intent", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const { amount, currency = 'USD', metadata = {} } = req.body;
      
      if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
        return res.status(400).json({ error: "Invalid amount" });
      }

      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(parseFloat(amount) * 100), // Convert to cents
        currency: currency.toLowerCase(),
        metadata: {
          userId: req.user!.id,
          ...metadata
        }
      });

      res.json({ 
        success: true,
        data: { clientSecret: paymentIntent.client_secret }
      });
    } catch (error: any) {
      res.status(500).json({ 
        success: false,
        error: "Error creating payment intent: " + error.message 
      });
    }
  });

  // Group management routes
  app.post('/api/groups', authenticateToken, requireEmailVerification, validateBody(schemas.createGroup), async (req: AuthenticatedRequest, res) => {
    try {
      const { name, description, contributionAmount, frequency, maxMembers, currency } = req.body;
      
      const group = await storage.createGroup({
        name,
        description,
        adminId: req.user!.id,
        contributionAmount,
        frequency,
        maxMembers,
        currency,
        currentCycle: 1,
        isLocked: false
      });

      // Add admin as first member
      await storage.addGroupMember({
        groupId: group.id,
        userId: req.user!.id,
        payoutPosition: 1
      });

      res.status(201).json({
        success: true,
        data: { group }
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  });

  app.get('/api/groups', authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const groups = await storage.getUserGroups(req.user!.id);
      res.json({
        success: true,
        data: { groups }
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  app.get('/api/groups/:id', authenticateToken, validateParams(schemas.uuidParam), async (req: AuthenticatedRequest, res) => {
    try {
      const { id } = req.params;
      const group = await storage.getGroup(id);
      
      if (!group) {
        return res.status(404).json({
          success: false,
          error: 'Group not found'
        });
      }

      // Check if user is a member
      const membership = await storage.getGroupMember(id, req.user!.id);
      if (!membership) {
        return res.status(403).json({
          success: false,
          error: 'Access denied'
        });
      }

      const members = await storage.getGroupMembers(id);
      const contributions = await storage.getContributions(id, group.currentCycle || 1);
      
      res.json({
        success: true,
        data: { 
          group,
          members,
          contributions
        }
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  app.post('/api/groups/:id/join', authenticateToken, requireEmailVerification, validateParams(schemas.uuidParam), async (req: AuthenticatedRequest, res) => {
    try {
      const { id } = req.params;
      const group = await storage.getGroup(id);
      
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

      const currentMembers = await storage.getGroupMembers(id);
      if (currentMembers.length >= group.maxMembers) {
        return res.status(400).json({
          success: false,
          error: 'Group is full'
        });
      }

      // Check if already a member
      const existingMembership = await storage.getGroupMember(id, req.user!.id);
      if (existingMembership) {
        return res.status(400).json({
          success: false,
          error: 'Already a member of this group'
        });
      }

      const membership = await storage.addGroupMember({
        groupId: id,
        userId: req.user!.id,
        payoutPosition: currentMembers.length + 1
      });

      // Notify other members
      await NotificationService.notifyGroupMembers(
        id,
        'New Member Joined',
        `${req.user!.fullName} has joined the group`,
        req.user!.id
      );

      res.status(201).json({
        success: true,
        data: { membership }
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  // Contribution routes
  app.post('/api/groups/:id/contributions', authenticateToken, requireKYC, validateParams(schemas.uuidParam), validateBody(schemas.makeContribution), async (req: AuthenticatedRequest, res) => {
    try {
      const { id: groupId } = req.params;
      const { amount, paymentMethod } = req.body;
      
      const group = await storage.getGroup(groupId);
      if (!group) {
        return res.status(404).json({
          success: false,
          error: 'Group not found'
        });
      }

      // Verify membership
      const membership = await storage.getGroupMember(groupId, req.user!.id);
      if (!membership) {
        return res.status(403).json({
          success: false,
          error: 'Not a member of this group'
        });
      }

      // Check if already contributed for current cycle
      const existingContribution = await storage.getContributions(groupId, group.currentCycle || 1);
      const userContribution = existingContribution.find(c => c.userId === req.user!.id);
      
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

      const contribution = await storage.createContribution({
        groupId,
        userId: req.user!.id,
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
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  app.get('/api/contributions', authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const contributions = await storage.getUserContributions(req.user!.id);
      res.json({
        success: true,
        data: { contributions }
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  // Payout routes
  app.get('/api/payouts', authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const payouts = await storage.getUserPayouts(req.user!.id);
      res.json({
        success: true,
        data: { payouts }
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  // Notification routes
  app.get('/api/notifications', authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const { unread } = req.query;
      const notifications = await storage.getUserNotifications(
        req.user!.id, 
        unread === 'true'
      );
      
      res.json({
        success: true,
        data: { notifications }
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  app.patch('/api/notifications/:id/read', authenticateToken, validateParams(schemas.uuidParam), async (req: AuthenticatedRequest, res) => {
    try {
      const { id } = req.params;
      await storage.markNotificationRead(id);
      
      res.json({
        success: true,
        message: 'Notification marked as read'
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  // Additional missing endpoints for full functionality
  
  // Group contribution routes
  app.get('/api/groups/:id/contributions', authenticateToken, validateParams(schemas.uuidParam), async (req: AuthenticatedRequest, res) => {
    try {
      const { id: groupId } = req.params;
      const { cycle } = req.query;
      
      // Verify membership
      const membership = await storage.getGroupMember(groupId, req.user!.id);
      if (!membership) {
        return res.status(403).json({
          success: false,
          error: 'Not a member of this group'
        });
      }

      const contributions = await storage.getContributions(groupId, cycle ? parseInt(cycle as string) : undefined);
      
      res.json({
        success: true,
        data: { contributions }
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  // Group payout routes
  app.get('/api/groups/:id/payouts', authenticateToken, validateParams(schemas.uuidParam), async (req: AuthenticatedRequest, res) => {
    try {
      const { id: groupId } = req.params;
      
      // Verify membership
      const membership = await storage.getGroupMember(groupId, req.user!.id);
      if (!membership) {
        return res.status(403).json({
          success: false,
          error: 'Not a member of this group'
        });
      }

      const payouts = await storage.getPayouts(groupId);
      
      res.json({
        success: true,
        data: { payouts }
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  // Request payout
  app.post('/api/groups/:id/payout', authenticateToken, requireKYC, validateParams(schemas.uuidParam), async (req: AuthenticatedRequest, res) => {
    try {
      const { id: groupId } = req.params;
      const { paymentMethod } = req.body;
      
      const group = await storage.getGroup(groupId);
      if (!group) {
        return res.status(404).json({
          success: false,
          error: 'Group not found'
        });
      }

      // Verify membership
      const membership = await storage.getGroupMember(groupId, req.user!.id);
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
      const members = await storage.getGroupMembers(groupId);
      const contributions = await storage.getContributions(groupId, group.currentCycle || 1);
      const paidContributions = contributions.filter(c => c.status === 'paid');

      if (paidContributions.length < members.length) {
        return res.status(400).json({
          success: false,
          error: `Payout not available. ${paidContributions.length}/${members.length} members have contributed`
        });
      }

      // Calculate payout amount (total contributions for the cycle)
      const totalAmount = paidContributions.reduce((sum, c) => sum + parseFloat(c.amount), 0);

      const payout = await storage.createPayout({
        groupId,
        userId: req.user!.id,
        cycleNumber: group.currentCycle || 1,
        amount: totalAmount.toString(),
        status: 'pending',
        paymentMethod
      });

      // Mark member as having received payout
      await storage.updateGroupMember(membership.id, { hasReceivedPayout: true });

      res.status(201).json({
        success: true,
        data: { payout }
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  // Group members management
  app.get('/api/groups/:id/members', authenticateToken, validateParams(schemas.uuidParam), async (req: AuthenticatedRequest, res) => {
    try {
      const { id: groupId } = req.params;
      
      // Verify membership
      const membership = await storage.getGroupMember(groupId, req.user!.id);
      if (!membership) {
        return res.status(403).json({
          success: false,
          error: 'Not a member of this group'
        });
      }

      const members = await storage.getGroupMembers(groupId);
      
      res.json({
        success: true,
        data: { members }
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  // Leave group
  app.post('/api/groups/:id/leave', authenticateToken, validateParams(schemas.uuidParam), async (req: AuthenticatedRequest, res) => {
    try {
      const { id: groupId } = req.params;
      
      const group = await storage.getGroup(groupId);
      if (!group) {
        return res.status(404).json({
          success: false,
          error: 'Group not found'
        });
      }

      // Admin cannot leave their own group
      if (group.adminId === req.user!.id) {
        return res.status(400).json({
          success: false,
          error: 'Group admin cannot leave the group'
        });
      }

      await storage.removeGroupMember(groupId, req.user!.id);

      res.json({
        success: true,
        message: 'Successfully left the group'
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  // Profile update
  app.patch('/api/auth/profile', authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const updates = req.body;
      const updatedUser = await storage.updateUser(req.user!.id, updates);
      
      const { passwordHash, ...userResponse } = updatedUser;
      
      res.json({
        success: true,
        data: { user: userResponse }
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  // Search groups
  app.get('/api/groups/search', authenticateToken, async (req: AuthenticatedRequest, res) => {
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
      const groups: any[] = [];
      
      res.json({
        success: true,
        data: { groups }
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  // Payout history
  app.get('/api/payouts/history', authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const { groupId } = req.query;
      
      let payouts;
      if (groupId) {
        // Verify membership if groupId is specified
        const membership = await storage.getGroupMember(groupId as string, req.user!.id);
        if (!membership) {
          return res.status(403).json({
            success: false,
            error: 'Not a member of this group'
          });
        }
        payouts = await storage.getPayouts(groupId as string);
      } else {
        payouts = await storage.getUserPayouts(req.user!.id);
      }
      
      res.json({
        success: true,
        data: { payouts }
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  // Get payout status for a group/cycle
  app.get('/api/groups/:id/payout-status', authenticateToken, validateParams(schemas.uuidParam), async (req: AuthenticatedRequest, res) => {
    try {
      const { id: groupId } = req.params;
      const { cycle, userId } = req.query;
      
      const group = await storage.getGroup(groupId);
      if (!group) {
        return res.status(404).json({
          success: false,
          error: 'Group not found'
        });
      }

      const targetUserId = userId as string || req.user!.id;
      const cycleNumber = cycle ? parseInt(cycle as string) : group.currentCycle || 1;
      
      // Verify membership
      const membership = await storage.getGroupMember(groupId, targetUserId);
      if (!membership) {
        return res.status(403).json({
          success: false,
          error: 'Not a member of this group'
        });
      }

      const members = await storage.getGroupMembers(groupId);
      const contributions = await storage.getContributions(groupId, cycleNumber);
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
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  // Create HTTP server
  const httpServer = createServer(app);

  // WebSocket server setup
  const wss = new WebSocketServer({ 
    server: httpServer, 
    path: '/ws' 
  });

  // WebSocket connection handling
  wss.on('connection', (ws: WebSocket, request) => {
    console.log('New WebSocket connection established');

    ws.on('message', async (message) => {
      try {
        const data = JSON.parse(message.toString());
        
        // Handle different message types
        switch (data.type) {
          case 'auth':
            // Authenticate WebSocket connection
            const user = await AuthService.getUserFromToken(data.token);
            if (user) {
              (ws as any).userId = user.id;
              ws.send(JSON.stringify({ type: 'auth_success', userId: user.id }));
            } else {
              ws.send(JSON.stringify({ type: 'auth_error', message: 'Invalid token' }));
            }
            break;
            
          case 'join_group':
            // Join group room for real-time updates
            (ws as any).groupId = data.groupId;
            ws.send(JSON.stringify({ type: 'joined_group', groupId: data.groupId }));
            break;
        }
      } catch (error) {
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
  (global as any).broadcastToGroup = (groupId: string, message: any) => {
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN && (client as any).groupId === groupId) {
        client.send(JSON.stringify(message));
      }
    });
  };

  return httpServer;
}
