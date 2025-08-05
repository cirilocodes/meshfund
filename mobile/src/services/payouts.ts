import { apiClient } from './api';

export interface Payout {
  id: string;
  groupId: string;
  userId: string;
  cycleNumber: number;
  amount: string;
  status: 'pending' | 'completed' | 'failed';
  paymentMethod?: string;
  transactionId?: string;
  paidAt?: string;
  createdAt: string;
}

export interface CreatePayoutRequest {
  groupId: string;
  userId: string;
  cycleNumber: number;
  amount: string;
  paymentMethod?: string;
}

export class PayoutService {
  static async getUserPayouts(userId?: string): Promise<Payout[]> {
    const endpoint = userId ? `/payouts/user/${userId}` : '/payouts/me';
    const response = await apiClient.get<{ payouts: Payout[] }>(endpoint);
    
    if (response.success && response.data) {
      return response.data.payouts;
    }
    
    throw new Error(response.error || 'Failed to fetch payouts');
  }

  static async getGroupPayouts(groupId: string): Promise<Payout[]> {
    const response = await apiClient.get<{ payouts: Payout[] }>(`/groups/${groupId}/payouts`);
    
    if (response.success && response.data) {
      return response.data.payouts;
    }
    
    throw new Error(response.error || 'Failed to fetch group payouts');
  }

  static async createPayout(payoutData: CreatePayoutRequest): Promise<Payout> {
    const response = await apiClient.post<{ payout: Payout }>('/payouts', payoutData);
    
    if (response.success && response.data) {
      return response.data.payout;
    }
    
    throw new Error(response.error || 'Failed to create payout');
  }

  static async updatePayoutStatus(payoutId: string, status: 'pending' | 'completed' | 'failed', transactionId?: string): Promise<Payout> {
    const response = await apiClient.patch<{ payout: Payout }>(`/payouts/${payoutId}`, {
      status,
      ...(transactionId && { transactionId }),
      ...(status === 'completed' && { paidAt: new Date().toISOString() })
    });
    
    if (response.success && response.data) {
      return response.data.payout;
    }
    
    throw new Error(response.error || 'Failed to update payout status');
  }

  static async getPayoutHistory(groupId?: string): Promise<Payout[]> {
    const endpoint = groupId ? `/payouts/history?groupId=${groupId}` : '/payouts/history';
    const response = await apiClient.get<{ payouts: Payout[] }>(endpoint);
    
    if (response.success && response.data) {
      return response.data.payouts;
    }
    
    throw new Error(response.error || 'Failed to fetch payout history');
  }

  static async getPayoutStatus(groupId: string, cycleNumber: number, userId?: string): Promise<{
    isEligible: boolean;
    hasReceived: boolean;
    expectedAmount: string;
    nextPayoutDate?: string;
    position?: number;
  }> {
    const endpoint = `/groups/${groupId}/payout-status?cycle=${cycleNumber}${userId ? `&userId=${userId}` : ''}`;
    const response = await apiClient.get<{
      isEligible: boolean;
      hasReceived: boolean;
      expectedAmount: string;
      nextPayoutDate?: string;
      position?: number;
    }>(endpoint);
    
    if (response.success && response.data) {
      return response.data;
    }
    
    throw new Error(response.error || 'Failed to fetch payout status');
  }

  static async processPendigPayouts(groupId: string, cycleNumber: number): Promise<{ success: boolean; message: string }> {
    const response = await apiClient.post<{ success: boolean; message: string }>(`/groups/${groupId}/process-payouts`, {
      cycleNumber
    });
    
    if (response.success && response.data) {
      return response.data;
    }
    
    throw new Error(response.error || 'Failed to process payouts');
  }
}