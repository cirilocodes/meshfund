import { pgTable, uuid, varchar, text, decimal, integer, boolean, timestamp, json, pgEnum } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Enums
export const contributionStatusEnum = pgEnum('contribution_status', ['pending', 'paid', 'missed', 'late']);
export const payoutStatusEnum = pgEnum('payout_status', ['pending', 'completed', 'failed']);
export const frequencyEnum = pgEnum('frequency', ['weekly', 'monthly', 'bi-weekly']);
export const notificationTypeEnum = pgEnum('notification_type', ['payment_reminder', 'payout_success', 'group_update', 'dispute']);
export const disputeStatusEnum = pgEnum('dispute_status', ['open', 'investigating', 'resolved', 'closed']);

// Users table
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  passwordHash: varchar('password_hash', { length: 255 }).notNull(),
  fullName: varchar('full_name', { length: 255 }).notNull(),
  phoneNumber: varchar('phone_number', { length: 20 }),
  isEmailVerified: boolean('is_email_verified').default(false),
  isPhoneVerified: boolean('is_phone_verified').default(false),
  kycStatus: varchar('kyc_status', { length: 50 }).default('pending'),
  kycDocuments: json('kyc_documents'),
  reputationScore: integer('reputation_score').default(100),
  stripeCustomerId: varchar('stripe_customer_id', { length: 255 }),
  stripeSubscriptionId: varchar('stripe_subscription_id', { length: 255 }),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

// Groups table
export const groups = pgTable('groups', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  adminId: uuid('admin_id').references(() => users.id).notNull(),
  contributionAmount: decimal('contribution_amount', { precision: 10, scale: 2 }).notNull(),
  frequency: frequencyEnum('frequency').notNull(),
  payoutOrder: json('payout_order').$type<string[]>(),
  isLocked: boolean('is_locked').default(false),
  currentCycle: integer('current_cycle').default(1),
  maxMembers: integer('max_members').notNull(),
  currency: varchar('currency', { length: 3 }).default('USD'),
  rules: json('rules').$type<Record<string, any>>(),
  nextPaymentDue: timestamp('next_payment_due'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

// Group members table
export const groupMembers = pgTable('group_members', {
  id: uuid('id').primaryKey().defaultRandom(),
  groupId: uuid('group_id').references(() => groups.id).notNull(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  joinedAt: timestamp('joined_at').defaultNow(),
  isActive: boolean('is_active').default(true),
  reputationScore: integer('reputation_score').default(100),
  payoutPosition: integer('payout_position'),
  hasReceivedPayout: boolean('has_received_payout').default(false)
});

// Contributions table
export const contributions = pgTable('contributions', {
  id: uuid('id').primaryKey().defaultRandom(),
  groupId: uuid('group_id').references(() => groups.id).notNull(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  amount: decimal('amount', { precision: 10, scale: 2 }).notNull(),
  cycleNumber: integer('cycle_number').notNull(),
  status: contributionStatusEnum('status').default('pending'),
  paymentMethod: varchar('payment_method', { length: 50 }),
  transactionId: varchar('transaction_id', { length: 255 }),
  paidAt: timestamp('paid_at'),
  dueDate: timestamp('due_date').notNull(),
  createdAt: timestamp('created_at').defaultNow()
});

// Payouts table
export const payouts = pgTable('payouts', {
  id: uuid('id').primaryKey().defaultRandom(),
  groupId: uuid('group_id').references(() => groups.id).notNull(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  cycleNumber: integer('cycle_number').notNull(),
  amount: decimal('amount', { precision: 10, scale: 2 }).notNull(),
  status: payoutStatusEnum('status').default('pending'),
  paymentMethod: varchar('payment_method', { length: 50 }),
  transactionId: varchar('transaction_id', { length: 255 }),
  paidAt: timestamp('paid_at'),
  createdAt: timestamp('created_at').defaultNow()
});

// Notifications table
export const notifications = pgTable('notifications', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  groupId: uuid('group_id').references(() => groups.id),
  type: notificationTypeEnum('type').notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  message: text('message').notNull(),
  isRead: boolean('is_read').default(false),
  data: json('data').$type<NotificationData>(),
  createdAt: timestamp('created_at').defaultNow()
});

// Disputes table
export const disputes = pgTable('disputes', {
  id: uuid('id').primaryKey().defaultRandom(),
  groupId: uuid('group_id').references(() => groups.id).notNull(),
  reporterId: uuid('reporter_id').references(() => users.id).notNull(),
  accusedId: uuid('accused_id').references(() => users.id).notNull(),
  type: varchar('type', { length: 50 }).notNull(),
  description: text('description').notNull(),
  status: disputeStatusEnum('status').default('open'),
  evidence: json('evidence'),
  resolution: text('resolution'),
  resolvedAt: timestamp('resolved_at'),
  createdAt: timestamp('created_at').defaultNow()
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  groupsAdmined: many(groups),
  groupMemberships: many(groupMembers),
  contributions: many(contributions),
  payouts: many(payouts),
  notifications: many(notifications),
  disputesReported: many(disputes, { relationName: 'reporter' }),
  disputesAccused: many(disputes, { relationName: 'accused' })
}));

export const groupsRelations = relations(groups, ({ one, many }) => ({
  admin: one(users, {
    fields: [groups.adminId],
    references: [users.id]
  }),
  members: many(groupMembers),
  contributions: many(contributions),
  payouts: many(payouts),
  notifications: many(notifications),
  disputes: many(disputes)
}));

export const groupMembersRelations = relations(groupMembers, ({ one }) => ({
  group: one(groups, {
    fields: [groupMembers.groupId],
    references: [groups.id]
  }),
  user: one(users, {
    fields: [groupMembers.userId],
    references: [users.id]
  })
}));

export const contributionsRelations = relations(contributions, ({ one }) => ({
  group: one(groups, {
    fields: [contributions.groupId],
    references: [groups.id]
  }),
  user: one(users, {
    fields: [contributions.userId],
    references: [users.id]
  })
}));

export const payoutsRelations = relations(payouts, ({ one }) => ({
  group: one(groups, {
    fields: [payouts.groupId],
    references: [groups.id]
  }),
  user: one(users, {
    fields: [payouts.userId],
    references: [users.id]
  })
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id]
  }),
  group: one(groups, {
    fields: [notifications.groupId],
    references: [groups.id]
  })
}));

export const disputesRelations = relations(disputes, ({ one }) => ({
  group: one(groups, {
    fields: [disputes.groupId],
    references: [groups.id]
  }),
  reporter: one(users, {
    fields: [disputes.reporterId],
    references: [users.id],
    relationName: 'reporter'
  }),
  accused: one(users, {
    fields: [disputes.accusedId],
    references: [users.id],
    relationName: 'accused'
  })
}));

// Type exports
export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type Group = typeof groups.$inferSelect;
export type InsertGroup = typeof groups.$inferInsert;
export type GroupMember = typeof groupMembers.$inferSelect;
export type InsertGroupMember = typeof groupMembers.$inferInsert;
export type Contribution = typeof contributions.$inferSelect;
export type InsertContribution = typeof contributions.$inferInsert;
export type Payout = typeof payouts.$inferSelect;
export type InsertPayout = typeof payouts.$inferInsert;
export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = typeof notifications.$inferInsert;
export type Dispute = typeof disputes.$inferSelect;
export type InsertDispute = typeof disputes.$inferInsert;

export interface NotificationData {
  groupId?: string;
  groupName?: string;
  amount?: string;
  dueDate?: string;
}
