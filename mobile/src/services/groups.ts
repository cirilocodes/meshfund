import { apiClient } from './api';

export interface Group {
  id: string;
  name: string;
  description?: string;
  adminId: string;
  contributionAmount: string;
  frequency: 'weekly' | 'monthly' | 'bi-weekly';
  payoutOrder?: string[];
  isLocked: boolean;
  currentCycle: number;
  maxMembers: number;
  currency: string;
  rules?: Record<string, any>;
  nextPaymentDue?: string;
  createdAt: string;
  updatedAt: string;
}

export interface GroupMember {
  id: string;
  groupId: string;
  userId: string;
  joinedAt: string;
  isActive: boolean;
  reputationScore: number;
  payoutPosition?: number;
  hasReceivedPayout: boolean;
}

export interface CreateGroupRequest {
  name: string;
  description?: string;
  contributionAmount: string;
  frequency: 'weekly' | 'monthly' | 'bi-weekly';
  maxMembers: number;
  currency: string;
}

export interface GroupDetails extends Group {
  members: GroupMember[];
  contributions: any[];
}

export class GroupService {
  static async createGroup(groupData: CreateGroupRequest): Promise<Group> {
    const response = await apiClient.post<{ group: Group }>('/groups', groupData);
    
    if (response.success && response.data) {
      return response.data.group;
    }
    
    throw new Error(response.error || 'Failed to create group');
  }

  static async getUserGroups(): Promise<Group[]> {
    const response = await apiClient.get<{ groups: Group[] }>('/groups');
    
    if (response.success && response.data) {
      return response.data.groups;
    }
    
    throw new Error(response.error || 'Failed to fetch groups');
  }

  static async getGroupDetails(groupId: string): Promise<GroupDetails> {
    const response = await apiClient.get<GroupDetails>(`/groups/${groupId}`);
    
    if (response.success && response.data) {
      return response.data;
    }
    
    throw new Error(response.error || 'Failed to fetch group details');
  }

  static async joinGroup(groupId: string): Promise<GroupMember> {
    const response = await apiClient.post<{ membership: GroupMember }>(`/groups/${groupId}/join`);
    
    if (response.success && response.data) {
      return response.data.membership;
    }
    
    throw new Error(response.error || 'Failed to join group');
  }

  static async leaveGroup(groupId: string): Promise<void> {
    const response = await apiClient.delete(`/groups/${groupId}/leave`);
    
    if (!response.success) {
      throw new Error(response.error || 'Failed to leave group');
    }
  }

  static async updateGroup(groupId: string, updates: Partial<Group>): Promise<Group> {
    const response = await apiClient.patch<{ group: Group }>(`/groups/${groupId}`, updates);
    
    if (response.success && response.data) {
      return response.data.group;
    }
    
    throw new Error(response.error || 'Failed to update group');
  }

  static async deleteGroup(groupId: string): Promise<void> {
    const response = await apiClient.delete(`/groups/${groupId}`);
    
    if (!response.success) {
      throw new Error(response.error || 'Failed to delete group');
    }
  }

  static async getGroupMembers(groupId: string): Promise<GroupMember[]> {
    const response = await apiClient.get<{ members: GroupMember[] }>(`/groups/${groupId}/members`);
    
    if (response.success && response.data) {
      return response.data.members;
    }
    
    throw new Error(response.error || 'Failed to fetch group members');
  }

  static async removeMember(groupId: string, userId: string): Promise<void> {
    const response = await apiClient.delete(`/groups/${groupId}/members/${userId}`);
    
    if (!response.success) {
      throw new Error(response.error || 'Failed to remove member');
    }
  }

  static async updateMember(groupId: string, userId: string, updates: Partial<GroupMember>): Promise<GroupMember> {
    const response = await apiClient.patch<{ member: GroupMember }>(`/groups/${groupId}/members/${userId}`, updates);
    
    if (response.success && response.data) {
      return response.data.member;
    }
    
    throw new Error(response.error || 'Failed to update member');
  }

  static async inviteToGroup(groupId: string, email: string): Promise<void> {
    const response = await apiClient.post(`/groups/${groupId}/invite`, { email });
    
    if (!response.success) {
      throw new Error(response.error || 'Failed to send invitation');
    }
  }

  static async searchGroups(query: string): Promise<Group[]> {
    const response = await apiClient.get<{ groups: Group[] }>(`/groups/search?q=${encodeURIComponent(query)}`);
    
    if (response.success && response.data) {
      return response.data.groups;
    }
    
    throw new Error(response.error || 'Failed to search groups');
  }
}
