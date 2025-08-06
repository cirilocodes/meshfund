"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.disputesRelations = exports.notificationsRelations = exports.payoutsRelations = exports.contributionsRelations = exports.groupMembersRelations = exports.groupsRelations = exports.usersRelations = exports.disputes = exports.notifications = exports.payouts = exports.contributions = exports.groupMembers = exports.groups = exports.users = exports.disputeStatusEnum = exports.notificationTypeEnum = exports.frequencyEnum = exports.payoutStatusEnum = exports.contributionStatusEnum = void 0;
const pg_core_1 = require("drizzle-orm/pg-core");
const drizzle_orm_1 = require("drizzle-orm");
// Enums
exports.contributionStatusEnum = (0, pg_core_1.pgEnum)('contribution_status', ['pending', 'paid', 'missed', 'late']);
exports.payoutStatusEnum = (0, pg_core_1.pgEnum)('payout_status', ['pending', 'completed', 'failed']);
exports.frequencyEnum = (0, pg_core_1.pgEnum)('frequency', ['weekly', 'monthly', 'bi-weekly']);
exports.notificationTypeEnum = (0, pg_core_1.pgEnum)('notification_type', ['payment_reminder', 'payout_success', 'group_update', 'dispute']);
exports.disputeStatusEnum = (0, pg_core_1.pgEnum)('dispute_status', ['open', 'investigating', 'resolved', 'closed']);
// Users table
exports.users = (0, pg_core_1.pgTable)('users', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    email: (0, pg_core_1.varchar)('email', { length: 255 }).notNull().unique(),
    passwordHash: (0, pg_core_1.varchar)('password_hash', { length: 255 }).notNull(),
    fullName: (0, pg_core_1.varchar)('full_name', { length: 255 }).notNull(),
    phoneNumber: (0, pg_core_1.varchar)('phone_number', { length: 20 }),
    isEmailVerified: (0, pg_core_1.boolean)('is_email_verified').default(false),
    isPhoneVerified: (0, pg_core_1.boolean)('is_phone_verified').default(false),
    kycStatus: (0, pg_core_1.varchar)('kyc_status', { length: 50 }).default('pending'),
    kycDocuments: (0, pg_core_1.json)('kyc_documents'),
    reputationScore: (0, pg_core_1.integer)('reputation_score').default(100),
    stripeCustomerId: (0, pg_core_1.varchar)('stripe_customer_id', { length: 255 }),
    stripeSubscriptionId: (0, pg_core_1.varchar)('stripe_subscription_id', { length: 255 }),
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at').defaultNow()
});
// Groups table
exports.groups = (0, pg_core_1.pgTable)('groups', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    name: (0, pg_core_1.varchar)('name', { length: 255 }).notNull(),
    description: (0, pg_core_1.text)('description'),
    adminId: (0, pg_core_1.uuid)('admin_id').references(() => exports.users.id).notNull(),
    contributionAmount: (0, pg_core_1.decimal)('contribution_amount', { precision: 10, scale: 2 }).notNull(),
    frequency: (0, exports.frequencyEnum)('frequency').notNull(),
    payoutOrder: (0, pg_core_1.json)('payout_order').$type(),
    isLocked: (0, pg_core_1.boolean)('is_locked').default(false),
    currentCycle: (0, pg_core_1.integer)('current_cycle').default(1),
    maxMembers: (0, pg_core_1.integer)('max_members').notNull(),
    currency: (0, pg_core_1.varchar)('currency', { length: 3 }).default('USD'),
    rules: (0, pg_core_1.json)('rules').$type(),
    nextPaymentDue: (0, pg_core_1.timestamp)('next_payment_due'),
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at').defaultNow()
});
// Group members table
exports.groupMembers = (0, pg_core_1.pgTable)('group_members', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    groupId: (0, pg_core_1.uuid)('group_id').references(() => exports.groups.id).notNull(),
    userId: (0, pg_core_1.uuid)('user_id').references(() => exports.users.id).notNull(),
    joinedAt: (0, pg_core_1.timestamp)('joined_at').defaultNow(),
    isActive: (0, pg_core_1.boolean)('is_active').default(true),
    reputationScore: (0, pg_core_1.integer)('reputation_score').default(100),
    payoutPosition: (0, pg_core_1.integer)('payout_position'),
    hasReceivedPayout: (0, pg_core_1.boolean)('has_received_payout').default(false)
});
// Contributions table
exports.contributions = (0, pg_core_1.pgTable)('contributions', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    groupId: (0, pg_core_1.uuid)('group_id').references(() => exports.groups.id).notNull(),
    userId: (0, pg_core_1.uuid)('user_id').references(() => exports.users.id).notNull(),
    amount: (0, pg_core_1.decimal)('amount', { precision: 10, scale: 2 }).notNull(),
    cycleNumber: (0, pg_core_1.integer)('cycle_number').notNull(),
    status: (0, exports.contributionStatusEnum)('status').default('pending'),
    paymentMethod: (0, pg_core_1.varchar)('payment_method', { length: 50 }),
    transactionId: (0, pg_core_1.varchar)('transaction_id', { length: 255 }),
    paidAt: (0, pg_core_1.timestamp)('paid_at'),
    dueDate: (0, pg_core_1.timestamp)('due_date').notNull(),
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow()
});
// Payouts table
exports.payouts = (0, pg_core_1.pgTable)('payouts', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    groupId: (0, pg_core_1.uuid)('group_id').references(() => exports.groups.id).notNull(),
    userId: (0, pg_core_1.uuid)('user_id').references(() => exports.users.id).notNull(),
    cycleNumber: (0, pg_core_1.integer)('cycle_number').notNull(),
    amount: (0, pg_core_1.decimal)('amount', { precision: 10, scale: 2 }).notNull(),
    status: (0, exports.payoutStatusEnum)('status').default('pending'),
    paymentMethod: (0, pg_core_1.varchar)('payment_method', { length: 50 }),
    transactionId: (0, pg_core_1.varchar)('transaction_id', { length: 255 }),
    paidAt: (0, pg_core_1.timestamp)('paid_at'),
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow()
});
// Notifications table
exports.notifications = (0, pg_core_1.pgTable)('notifications', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    userId: (0, pg_core_1.uuid)('user_id').references(() => exports.users.id).notNull(),
    groupId: (0, pg_core_1.uuid)('group_id').references(() => exports.groups.id),
    type: (0, exports.notificationTypeEnum)('type').notNull(),
    title: (0, pg_core_1.varchar)('title', { length: 255 }).notNull(),
    message: (0, pg_core_1.text)('message').notNull(),
    isRead: (0, pg_core_1.boolean)('is_read').default(false),
    data: (0, pg_core_1.json)('data').$type(),
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow()
});
// Disputes table
exports.disputes = (0, pg_core_1.pgTable)('disputes', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    groupId: (0, pg_core_1.uuid)('group_id').references(() => exports.groups.id).notNull(),
    reporterId: (0, pg_core_1.uuid)('reporter_id').references(() => exports.users.id).notNull(),
    accusedId: (0, pg_core_1.uuid)('accused_id').references(() => exports.users.id).notNull(),
    type: (0, pg_core_1.varchar)('type', { length: 50 }).notNull(),
    description: (0, pg_core_1.text)('description').notNull(),
    status: (0, exports.disputeStatusEnum)('status').default('open'),
    evidence: (0, pg_core_1.json)('evidence'),
    resolution: (0, pg_core_1.text)('resolution'),
    resolvedAt: (0, pg_core_1.timestamp)('resolved_at'),
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow()
});
// Relations
exports.usersRelations = (0, drizzle_orm_1.relations)(exports.users, ({ many }) => ({
    groupsAdmined: many(exports.groups),
    groupMemberships: many(exports.groupMembers),
    contributions: many(exports.contributions),
    payouts: many(exports.payouts),
    notifications: many(exports.notifications),
    disputesReported: many(exports.disputes, { relationName: 'reporter' }),
    disputesAccused: many(exports.disputes, { relationName: 'accused' })
}));
exports.groupsRelations = (0, drizzle_orm_1.relations)(exports.groups, ({ one, many }) => ({
    admin: one(exports.users, {
        fields: [exports.groups.adminId],
        references: [exports.users.id]
    }),
    members: many(exports.groupMembers),
    contributions: many(exports.contributions),
    payouts: many(exports.payouts),
    notifications: many(exports.notifications),
    disputes: many(exports.disputes)
}));
exports.groupMembersRelations = (0, drizzle_orm_1.relations)(exports.groupMembers, ({ one }) => ({
    group: one(exports.groups, {
        fields: [exports.groupMembers.groupId],
        references: [exports.groups.id]
    }),
    user: one(exports.users, {
        fields: [exports.groupMembers.userId],
        references: [exports.users.id]
    })
}));
exports.contributionsRelations = (0, drizzle_orm_1.relations)(exports.contributions, ({ one }) => ({
    group: one(exports.groups, {
        fields: [exports.contributions.groupId],
        references: [exports.groups.id]
    }),
    user: one(exports.users, {
        fields: [exports.contributions.userId],
        references: [exports.users.id]
    })
}));
exports.payoutsRelations = (0, drizzle_orm_1.relations)(exports.payouts, ({ one }) => ({
    group: one(exports.groups, {
        fields: [exports.payouts.groupId],
        references: [exports.groups.id]
    }),
    user: one(exports.users, {
        fields: [exports.payouts.userId],
        references: [exports.users.id]
    })
}));
exports.notificationsRelations = (0, drizzle_orm_1.relations)(exports.notifications, ({ one }) => ({
    user: one(exports.users, {
        fields: [exports.notifications.userId],
        references: [exports.users.id]
    }),
    group: one(exports.groups, {
        fields: [exports.notifications.groupId],
        references: [exports.groups.id]
    })
}));
exports.disputesRelations = (0, drizzle_orm_1.relations)(exports.disputes, ({ one }) => ({
    group: one(exports.groups, {
        fields: [exports.disputes.groupId],
        references: [exports.groups.id]
    }),
    reporter: one(exports.users, {
        fields: [exports.disputes.reporterId],
        references: [exports.users.id],
        relationName: 'reporter'
    }),
    accused: one(exports.users, {
        fields: [exports.disputes.accusedId],
        references: [exports.users.id],
        relationName: 'accused'
    })
}));
