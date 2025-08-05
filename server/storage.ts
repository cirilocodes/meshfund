import { users, groups, groupMembers, contributions, payouts, notifications, disputes, type User, type InsertUser, type Group, type InsertGroup, type GroupMember, type InsertGroupMember, type Contribution, type InsertContribution, type Payout, type InsertPayout, type Notification, type InsertNotification } from "./schema";
import { db } from "./db";
import { eq, and, desc, asc } from "drizzle-orm";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(insertUser: InsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<User>): Promise<User>;
  updateStripeCustomerId(id: string, customerId: string): Promise<User>;
  updateUserStripeInfo(id: string, info: { customerId: string; subscriptionId: string }): Promise<User>;
  
  // Group operations
  createGroup(insertGroup: InsertGroup): Promise<Group>;
  getGroup(id: string): Promise<Group | undefined>;
  getUserGroups(userId: string): Promise<Group[]>;
  updateGroup(id: string, updates: Partial<Group>): Promise<Group>;
  deleteGroup(id: string): Promise<void>;
  
  // Group member operations
  addGroupMember(insertMember: InsertGroupMember): Promise<GroupMember>;
  getGroupMembers(groupId: string): Promise<GroupMember[]>;
  getGroupMember(groupId: string, userId: string): Promise<GroupMember | undefined>;
  updateGroupMember(id: string, updates: Partial<GroupMember>): Promise<GroupMember>;
  removeGroupMember(groupId: string, userId: string): Promise<void>;
  
  // Contribution operations
  createContribution(insertContribution: InsertContribution): Promise<Contribution>;
  getContributions(groupId: string, cycleNumber?: number): Promise<Contribution[]>;
  getUserContributions(userId: string, groupId?: string): Promise<Contribution[]>;
  updateContribution(id: string, updates: Partial<Contribution>): Promise<Contribution>;
  
  // Payout operations
  createPayout(insertPayout: InsertPayout): Promise<Payout>;
  getPayouts(groupId: string): Promise<Payout[]>;
  getUserPayouts(userId: string): Promise<Payout[]>;
  updatePayout(id: string, updates: Partial<Payout>): Promise<Payout>;
  
  // Notification operations
  createNotification(insertNotification: InsertNotification): Promise<Notification>;
  getUserNotifications(userId: string, unreadOnly?: boolean): Promise<Notification[]>;
  markNotificationRead(id: string): Promise<void>;
  markAllNotificationsRead(userId: string): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async updateStripeCustomerId(id: string, customerId: string): Promise<User> {
    return this.updateUser(id, { stripeCustomerId: customerId });
  }

  async updateUserStripeInfo(id: string, info: { customerId: string; subscriptionId: string }): Promise<User> {
    return this.updateUser(id, { 
      stripeCustomerId: info.customerId, 
      stripeSubscriptionId: info.subscriptionId 
    });
  }

  async createGroup(insertGroup: InsertGroup): Promise<Group> {
    const [group] = await db
      .insert(groups)
      .values(insertGroup)
      .returning();
    return group;
  }

  async getGroup(id: string): Promise<Group | undefined> {
    const [group] = await db.select().from(groups).where(eq(groups.id, id));
    return group || undefined;
  }

  async getUserGroups(userId: string): Promise<Group[]> {
    const userGroups = await db
      .select({ group: groups })
      .from(groupMembers)
      .leftJoin(groups, eq(groupMembers.groupId, groups.id))
      .where(and(eq(groupMembers.userId, userId), eq(groupMembers.isActive, true)));
    
    return userGroups.map(ug => ug.group).filter(Boolean) as Group[];
  }

  async updateGroup(id: string, updates: Partial<Group>): Promise<Group> {
    const [group] = await db
      .update(groups)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(groups.id, id))
      .returning();
    return group;
  }

  async deleteGroup(id: string): Promise<void> {
    await db.delete(groups).where(eq(groups.id, id));
  }

  async addGroupMember(insertMember: InsertGroupMember): Promise<GroupMember> {
    const [member] = await db
      .insert(groupMembers)
      .values(insertMember)
      .returning();
    return member;
  }

  async getGroupMembers(groupId: string): Promise<GroupMember[]> {
    return await db
      .select()
      .from(groupMembers)
      .where(and(eq(groupMembers.groupId, groupId), eq(groupMembers.isActive, true)))
      .orderBy(asc(groupMembers.joinedAt));
  }

  async getGroupMember(groupId: string, userId: string): Promise<GroupMember | undefined> {
    const [member] = await db
      .select()
      .from(groupMembers)
      .where(and(
        eq(groupMembers.groupId, groupId),
        eq(groupMembers.userId, userId),
        eq(groupMembers.isActive, true)
      ));
    return member || undefined;
  }

  async updateGroupMember(id: string, updates: Partial<GroupMember>): Promise<GroupMember> {
    const [member] = await db
      .update(groupMembers)
      .set(updates)
      .where(eq(groupMembers.id, id))
      .returning();
    return member;
  }

  async removeGroupMember(groupId: string, userId: string): Promise<void> {
    await db
      .update(groupMembers)
      .set({ isActive: false })
      .where(and(eq(groupMembers.groupId, groupId), eq(groupMembers.userId, userId)));
  }

  async createContribution(insertContribution: InsertContribution): Promise<Contribution> {
    const [contribution] = await db
      .insert(contributions)
      .values(insertContribution)
      .returning();
    return contribution;
  }

  async getContributions(groupId: string, cycleNumber?: number): Promise<Contribution[]> {
    const conditions = [eq(contributions.groupId, groupId)];
    if (cycleNumber !== undefined) {
      conditions.push(eq(contributions.cycleNumber, cycleNumber));
    }
    
    return await db
      .select()
      .from(contributions)
      .where(and(...conditions))
      .orderBy(desc(contributions.createdAt));
  }

  async getUserContributions(userId: string, groupId?: string): Promise<Contribution[]> {
    const conditions = [eq(contributions.userId, userId)];
    if (groupId) {
      conditions.push(eq(contributions.groupId, groupId));
    }
    
    return await db
      .select()
      .from(contributions)
      .where(and(...conditions))
      .orderBy(desc(contributions.createdAt));
  }

  async updateContribution(id: string, updates: Partial<Contribution>): Promise<Contribution> {
    const [contribution] = await db
      .update(contributions)
      .set(updates)
      .where(eq(contributions.id, id))
      .returning();
    return contribution;
  }

  async createPayout(insertPayout: InsertPayout): Promise<Payout> {
    const [payout] = await db
      .insert(payouts)
      .values(insertPayout)
      .returning();
    return payout;
  }

  async getPayouts(groupId: string): Promise<Payout[]> {
    return await db
      .select()
      .from(payouts)
      .where(eq(payouts.groupId, groupId))
      .orderBy(desc(payouts.createdAt));
  }

  async getUserPayouts(userId: string): Promise<Payout[]> {
    return await db
      .select()
      .from(payouts)
      .where(eq(payouts.userId, userId))
      .orderBy(desc(payouts.createdAt));
  }

  async updatePayout(id: string, updates: Partial<Payout>): Promise<Payout> {
    const [payout] = await db
      .update(payouts)
      .set(updates)
      .where(eq(payouts.id, id))
      .returning();
    return payout;
  }

  async createNotification(insertNotification: InsertNotification): Promise<Notification> {
    const [notification] = await db
      .insert(notifications)
      .values(insertNotification)
      .returning();
    return notification;
  }

  async getUserNotifications(userId: string, unreadOnly?: boolean): Promise<Notification[]> {
    const conditions = [eq(notifications.userId, userId)];
    if (unreadOnly) {
      conditions.push(eq(notifications.isRead, false));
    }
    
    return await db
      .select()
      .from(notifications)
      .where(and(...conditions))
      .orderBy(desc(notifications.createdAt));
  }

  async markNotificationRead(id: string): Promise<void> {
    await db
      .update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.id, id));
  }

  async markAllNotificationsRead(userId: string): Promise<void> {
    await db
      .update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.userId, userId));
  }
}

export const storage = new DatabaseStorage();
