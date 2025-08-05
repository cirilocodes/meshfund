import { create } from 'zustand';
import { apiClient } from '../services/api';

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

export interface Contribution {
  id: string;
  groupId: string;
  userId: string;
  amount: string;
  cycleNumber: number;
  status: 'pending' | 'paid' | 'missed' | 'late';
  paymentMethod?: string;
  transactionId?: string;
  paidAt?: string;
  dueDate: string;
  createdAt: string;
}

interface GroupState {
  groups: Group[];
  currentGroup: Group | null;
  groupMembers: GroupMember[];
  contributions: Contribution[];
  isLoading: boolean;
  error: string | null;

  // Actions
  loadUserGroups: () => Promise<void>;
  loadGroup: (groupId: string) => Promise<void>;
  createGroup: (groupData: Partial<Group>) => Promise<Group>;
  joinGroup: (groupId: string) => Promise<void>;
  leaveGroup: (groupId: string) => Promise<void>;
  makeContribution: (groupId: string, amount: string, paymentMethod: string) => Promise<void>;
  loadContributions: (groupId: string) => Promise<void>;
  clearError: () => void;
}

export const useGroupStore = create<GroupState>((set, get) => ({
  groups: [],
  currentGroup: null,
  groupMembers: [],
  contributions: [],
  isLoading: false,
  error: null,

  loadUserGroups: async () => {
    try {
      set({ isLoading: true, error: null });
      
      const response = await apiClient.get<{ groups: Group[] }>('/groups');
      
      if (response.success && response.data) {
        set({
          groups: response.data.groups,
          isLoading: false,
        });
      } else {
        throw new Error(response.error || 'Failed to load groups');
      }
    } catch (error: any) {
      set({
        isLoading: false,
        error: error.message || 'Failed to load groups',
      });
      throw error;
    }
  },

  loadGroup: async (groupId: string) => {
    try {
      set({ isLoading: true, error: null });
      
      const response = await apiClient.get<{
        group: Group;
        members: GroupMember[];
        contributions: Contribution[];
      }>(`/groups/${groupId}`);
      
      if (response.success && response.data) {
        set({
          currentGroup: response.data.group,
          groupMembers: response.data.members,
          contributions: response.data.contributions,
          isLoading: false,
        });
      } else {
        throw new Error(response.error || 'Failed to load group');
      }
    } catch (error: any) {
      set({
        isLoading: false,
        error: error.message || 'Failed to load group',
      });
      throw error;
    }
  },

  createGroup: async (groupData: Partial<Group>) => {
    try {
      set({ isLoading: true, error: null });
      
      const response = await apiClient.post<{ group: Group }>('/groups', groupData);
      
      if (response.success && response.data) {
        const newGroup = response.data.group;
        
        set((state) => ({
          groups: [...state.groups, newGroup],
          isLoading: false,
        }));
        
        return newGroup;
      } else {
        throw new Error(response.error || 'Failed to create group');
      }
    } catch (error: any) {
      set({
        isLoading: false,
        error: error.message || 'Failed to create group',
      });
      throw error;
    }
  },

  joinGroup: async (groupId: string) => {
    try {
      set({ isLoading: true, error: null });
      
      const response = await apiClient.post(`/groups/${groupId}/join`);
      
      if (response.success) {
        // Reload user groups to get updated list
        await get().loadUserGroups();
      } else {
        throw new Error(response.error || 'Failed to join group');
      }
    } catch (error: any) {
      set({
        isLoading: false,
        error: error.message || 'Failed to join group',
      });
      throw error;
    }
  },

  leaveGroup: async (groupId: string) => {
    try {
      set({ isLoading: true, error: null });
      
      const response = await apiClient.post(`/groups/${groupId}/leave`);
      
      if (response.success) {
        set((state) => ({
          groups: state.groups.filter(group => group.id !== groupId),
          isLoading: false,
        }));
      } else {
        throw new Error(response.error || 'Failed to leave group');
      }
    } catch (error: any) {
      set({
        isLoading: false,
        error: error.message || 'Failed to leave group',
      });
      throw error;
    }
  },

  makeContribution: async (groupId: string, amount: string, paymentMethod: string) => {
    try {
      set({ isLoading: true, error: null });
      
      const response = await apiClient.post<{ contribution: Contribution }>(
        `/groups/${groupId}/contributions`,
        { amount, paymentMethod }
      );
      
      if (response.success && response.data) {
        set((state) => ({
          contributions: [...state.contributions, response.data!.contribution],
          isLoading: false,
        }));
      } else {
        throw new Error(response.error || 'Failed to make contribution');
      }
    } catch (error: any) {
      set({
        isLoading: false,
        error: error.message || 'Failed to make contribution',
      });
      throw error;
    }
  },

  loadContributions: async (groupId: string) => {
    try {
      set({ isLoading: true, error: null });
      
      const response = await apiClient.get<{ contributions: Contribution[] }>(
        `/groups/${groupId}/contributions`
      );
      
      if (response.success && response.data) {
        set({
          contributions: response.data.contributions,
          isLoading: false,
        });
      } else {
        throw new Error(response.error || 'Failed to load contributions');
      }
    } catch (error: any) {
      set({
        isLoading: false,
        error: error.message || 'Failed to load contributions',
      });
      throw error;
    }
  },

  clearError: () => {
    set({ error: null });
  },
}));