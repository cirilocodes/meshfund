import { create } from 'zustand';
import { GroupService, Group, GroupDetails, CreateGroupRequest } from '../services/groups';

interface GroupState {
  groups: Group[];
  currentGroup: GroupDetails | null;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  loadUserGroups: () => Promise<void>;
  createGroup: (groupData: CreateGroupRequest) => Promise<Group>;
  loadGroupDetails: (groupId: string) => Promise<void>;
  joinGroup: (groupId: string) => Promise<void>;
  leaveGroup: (groupId: string) => Promise<void>;
  updateGroup: (groupId: string, updates: Partial<Group>) => Promise<void>;
  deleteGroup: (groupId: string) => Promise<void>;
  clearCurrentGroup: () => void;
  clearError: () => void;
}

export const useGroupStore = create<GroupState>((set, get) => ({
  groups: [],
  currentGroup: null,
  isLoading: false,
  error: null,

  loadUserGroups: async () => {
    try {
      set({ isLoading: true, error: null });
      
      const groups = await GroupService.getUserGroups();
      
      set({
        groups,
        isLoading: false,
        error: null,
      });
    } catch (error: any) {
      set({
        isLoading: false,
        error: error.message || 'Failed to load groups',
      });
      throw error;
    }
  },

  createGroup: async (groupData: CreateGroupRequest) => {
    try {
      set({ isLoading: true, error: null });
      
      const newGroup = await GroupService.createGroup(groupData);
      
      // Add the new group to the list
      set(state => ({
        groups: [newGroup, ...state.groups],
        isLoading: false,
        error: null,
      }));
      
      return newGroup;
    } catch (error: any) {
      set({
        isLoading: false,
        error: error.message || 'Failed to create group',
      });
      throw error;
    }
  },

  loadGroupDetails: async (groupId: string) => {
    try {
      set({ isLoading: true, error: null });
      
      const groupDetails = await GroupService.getGroupDetails(groupId);
      
      set({
        currentGroup: groupDetails,
        isLoading: false,
        error: null,
      });
    } catch (error: any) {
      set({
        isLoading: false,
        error: error.message || 'Failed to load group details',
        currentGroup: null,
      });
      throw error;
    }
  },

  joinGroup: async (groupId: string) => {
    try {
      set({ isLoading: true, error: null });
      
      await GroupService.joinGroup(groupId);
      
      // Reload user groups to include the new group
      await get().loadUserGroups();
      
      // If we're viewing this group's details, reload them
      if (get().currentGroup?.id === groupId) {
        await get().loadGroupDetails(groupId);
      }
      
      set({
        isLoading: false,
        error: null,
      });
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
      
      await GroupService.leaveGroup(groupId);
      
      // Remove the group from the local list
      set(state => ({
        groups: state.groups.filter(group => group.id !== groupId),
        currentGroup: state.currentGroup?.id === groupId ? null : state.currentGroup,
        isLoading: false,
        error: null,
      }));
    } catch (error: any) {
      set({
        isLoading: false,
        error: error.message || 'Failed to leave group',
      });
      throw error;
    }
  },

  updateGroup: async (groupId: string, updates: Partial<Group>) => {
    try {
      set({ isLoading: true, error: null });
      
      const updatedGroup = await GroupService.updateGroup(groupId, updates);
      
      // Update the group in the local list
      set(state => ({
        groups: state.groups.map(group => 
          group.id === groupId ? updatedGroup : group
        ),
        currentGroup: state.currentGroup?.id === groupId 
          ? { ...state.currentGroup, ...updatedGroup }
          : state.currentGroup,
        isLoading: false,
        error: null,
      }));
    } catch (error: any) {
      set({
        isLoading: false,
        error: error.message || 'Failed to update group',
      });
      throw error;
    }
  },

  deleteGroup: async (groupId: string) => {
    try {
      set({ isLoading: true, error: null });
      
      await GroupService.deleteGroup(groupId);
      
      // Remove the group from the local list
      set(state => ({
        groups: state.groups.filter(group => group.id !== groupId),
        currentGroup: state.currentGroup?.id === groupId ? null : state.currentGroup,
        isLoading: false,
        error: null,
      }));
    } catch (error: any) {
      set({
        isLoading: false,
        error: error.message || 'Failed to delete group',
      });
      throw error;
    }
  },

  clearCurrentGroup: () => {
    set({ currentGroup: null });
  },

  clearError: () => {
    set({ error: null });
  },
}));
