"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.storage = exports.DatabaseStorage = void 0;
const schema_1 = require("./schema");
const db_1 = require("./db");
const drizzle_orm_1 = require("drizzle-orm");
class DatabaseStorage {
    async getUser(id) {
        const [user] = await db_1.db.select().from(schema_1.users).where((0, drizzle_orm_1.eq)(schema_1.users.id, id));
        return user || undefined;
    }
    async getUserByEmail(email) {
        const [user] = await db_1.db.select().from(schema_1.users).where((0, drizzle_orm_1.eq)(schema_1.users.email, email));
        return user || undefined;
    }
    async createUser(insertUser) {
        const [user] = await db_1.db
            .insert(schema_1.users)
            .values(insertUser)
            .returning();
        return user;
    }
    async updateUser(id, updates) {
        const [user] = await db_1.db
            .update(schema_1.users)
            .set({ ...updates, updatedAt: new Date() })
            .where((0, drizzle_orm_1.eq)(schema_1.users.id, id))
            .returning();
        return user;
    }
    async updateStripeCustomerId(id, customerId) {
        return this.updateUser(id, { stripeCustomerId: customerId });
    }
    async updateUserStripeInfo(id, info) {
        return this.updateUser(id, {
            stripeCustomerId: info.customerId,
            stripeSubscriptionId: info.subscriptionId
        });
    }
    async createGroup(insertGroup) {
        const [group] = await db_1.db
            .insert(schema_1.groups)
            .values(insertGroup)
            .returning();
        return group;
    }
    async getGroup(id) {
        const [group] = await db_1.db.select().from(schema_1.groups).where((0, drizzle_orm_1.eq)(schema_1.groups.id, id));
        return group || undefined;
    }
    async getUserGroups(userId) {
        const userGroups = await db_1.db
            .select({ group: schema_1.groups })
            .from(schema_1.groupMembers)
            .leftJoin(schema_1.groups, (0, drizzle_orm_1.eq)(schema_1.groupMembers.groupId, schema_1.groups.id))
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.groupMembers.userId, userId), (0, drizzle_orm_1.eq)(schema_1.groupMembers.isActive, true)));
        return userGroups.map(ug => ug.group).filter(Boolean);
    }
    async updateGroup(id, updates) {
        const [group] = await db_1.db
            .update(schema_1.groups)
            .set({ ...updates, updatedAt: new Date() })
            .where((0, drizzle_orm_1.eq)(schema_1.groups.id, id))
            .returning();
        return group;
    }
    async deleteGroup(id) {
        await db_1.db.delete(schema_1.groups).where((0, drizzle_orm_1.eq)(schema_1.groups.id, id));
    }
    async addGroupMember(insertMember) {
        const [member] = await db_1.db
            .insert(schema_1.groupMembers)
            .values(insertMember)
            .returning();
        return member;
    }
    async getGroupMembers(groupId) {
        return await db_1.db
            .select()
            .from(schema_1.groupMembers)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.groupMembers.groupId, groupId), (0, drizzle_orm_1.eq)(schema_1.groupMembers.isActive, true)))
            .orderBy((0, drizzle_orm_1.asc)(schema_1.groupMembers.joinedAt));
    }
    async getGroupMember(groupId, userId) {
        const [member] = await db_1.db
            .select()
            .from(schema_1.groupMembers)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.groupMembers.groupId, groupId), (0, drizzle_orm_1.eq)(schema_1.groupMembers.userId, userId), (0, drizzle_orm_1.eq)(schema_1.groupMembers.isActive, true)));
        return member || undefined;
    }
    async updateGroupMember(id, updates) {
        const [member] = await db_1.db
            .update(schema_1.groupMembers)
            .set(updates)
            .where((0, drizzle_orm_1.eq)(schema_1.groupMembers.id, id))
            .returning();
        return member;
    }
    async removeGroupMember(groupId, userId) {
        await db_1.db
            .update(schema_1.groupMembers)
            .set({ isActive: false })
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.groupMembers.groupId, groupId), (0, drizzle_orm_1.eq)(schema_1.groupMembers.userId, userId)));
    }
    async createContribution(insertContribution) {
        const [contribution] = await db_1.db
            .insert(schema_1.contributions)
            .values(insertContribution)
            .returning();
        return contribution;
    }
    async getContributions(groupId, cycleNumber) {
        const conditions = [(0, drizzle_orm_1.eq)(schema_1.contributions.groupId, groupId)];
        if (cycleNumber !== undefined) {
            conditions.push((0, drizzle_orm_1.eq)(schema_1.contributions.cycleNumber, cycleNumber));
        }
        return await db_1.db
            .select()
            .from(schema_1.contributions)
            .where((0, drizzle_orm_1.and)(...conditions))
            .orderBy((0, drizzle_orm_1.desc)(schema_1.contributions.createdAt));
    }
    async getUserContributions(userId, groupId) {
        const conditions = [(0, drizzle_orm_1.eq)(schema_1.contributions.userId, userId)];
        if (groupId) {
            conditions.push((0, drizzle_orm_1.eq)(schema_1.contributions.groupId, groupId));
        }
        return await db_1.db
            .select()
            .from(schema_1.contributions)
            .where((0, drizzle_orm_1.and)(...conditions))
            .orderBy((0, drizzle_orm_1.desc)(schema_1.contributions.createdAt));
    }
    async updateContribution(id, updates) {
        const [contribution] = await db_1.db
            .update(schema_1.contributions)
            .set(updates)
            .where((0, drizzle_orm_1.eq)(schema_1.contributions.id, id))
            .returning();
        return contribution;
    }
    async createPayout(insertPayout) {
        const [payout] = await db_1.db
            .insert(schema_1.payouts)
            .values(insertPayout)
            .returning();
        return payout;
    }
    async getPayouts(groupId) {
        return await db_1.db
            .select()
            .from(schema_1.payouts)
            .where((0, drizzle_orm_1.eq)(schema_1.payouts.groupId, groupId))
            .orderBy((0, drizzle_orm_1.desc)(schema_1.payouts.createdAt));
    }
    async getUserPayouts(userId) {
        return await db_1.db
            .select()
            .from(schema_1.payouts)
            .where((0, drizzle_orm_1.eq)(schema_1.payouts.userId, userId))
            .orderBy((0, drizzle_orm_1.desc)(schema_1.payouts.createdAt));
    }
    async updatePayout(id, updates) {
        const [payout] = await db_1.db
            .update(schema_1.payouts)
            .set(updates)
            .where((0, drizzle_orm_1.eq)(schema_1.payouts.id, id))
            .returning();
        return payout;
    }
    async createNotification(insertNotification) {
        const [notification] = await db_1.db
            .insert(schema_1.notifications)
            .values(insertNotification)
            .returning();
        return notification;
    }
    async getUserNotifications(userId, unreadOnly) {
        const conditions = [(0, drizzle_orm_1.eq)(schema_1.notifications.userId, userId)];
        if (unreadOnly) {
            conditions.push((0, drizzle_orm_1.eq)(schema_1.notifications.isRead, false));
        }
        return await db_1.db
            .select()
            .from(schema_1.notifications)
            .where((0, drizzle_orm_1.and)(...conditions))
            .orderBy((0, drizzle_orm_1.desc)(schema_1.notifications.createdAt));
    }
    async markNotificationRead(id) {
        await db_1.db
            .update(schema_1.notifications)
            .set({ isRead: true })
            .where((0, drizzle_orm_1.eq)(schema_1.notifications.id, id));
    }
    async markAllNotificationsRead(userId) {
        await db_1.db
            .update(schema_1.notifications)
            .set({ isRead: true })
            .where((0, drizzle_orm_1.eq)(schema_1.notifications.userId, userId));
    }
}
exports.DatabaseStorage = DatabaseStorage;
exports.storage = new DatabaseStorage();
