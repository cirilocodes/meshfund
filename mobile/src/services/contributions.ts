import { apiClient } from './api';

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

export interface MakeContributionRequest {
  amount: string;
  paymentMethod: string;
}

export interface PaymentMethod {
  id: string;
  type: 'card' | 'bank' | 'paypal' | 'crypto' | 'mobile_money';
  name: string;
  details: string;
  isDefault: boolean;
}

export class ContributionService {
  static async makeContribution(groupId: string, data: MakeContributionRequest): Promise<Contribution> {
    const response = await apiClient.post<{ contribution: Contribution }>(`/groups/${groupId}/contributions`, data);
    
    if (response.success && response.data) {
      return response.data.contribution;
    }
    
    throw new Error(response.error || 'Failed to make contribution');
  }

  static async getUserContributions(groupId?: string): Promise<Contribution[]> {
    const endpoint = groupId ? `/contributions?groupId=${groupId}` : '/contributions';
    const response = await apiClient.get<{ contributions: Contribution[] }>(endpoint);
    
    if (response.success && response.data) {
      return response.data.contributions;
    }
    
    throw new Error(response.error || 'Failed to fetch contributions');
  }

  static async getGroupContributions(groupId: string, cycleNumber?: number): Promise<Contribution[]> {
    const endpoint = cycleNumber 
      ? `/groups/${groupId}/contributions?cycle=${cycleNumber}`
      : `/groups/${groupId}/contributions`;
    
    const response = await apiClient.get<{ contributions: Contribution[] }>(endpoint);
    
    if (response.success && response.data) {
      return response.data.contributions;
    }
    
    throw new Error(response.error || 'Failed to fetch group contributions');
  }

  static async getUserPayouts(): Promise<Payout[]> {
    const response = await apiClient.get<{ payouts: Payout[] }>('/payouts');
    
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

  static async requestPayout(groupId: string, paymentMethod: string): Promise<Payout> {
    const response = await apiClient.post<{ payout: Payout }>(`/groups/${groupId}/payout`, {
      paymentMethod,
    });
    
    if (response.success && response.data) {
      return response.data.payout;
    }
    
    throw new Error(response.error || 'Failed to request payout');
  }

  static async getPaymentMethods(): Promise<PaymentMethod[]> {
    const response = await apiClient.get<{ paymentMethods: PaymentMethod[] }>('/payment-methods');
    
    if (response.success && response.data) {
      return response.data.paymentMethods;
    }
    
    throw new Error(response.error || 'Failed to fetch payment methods');
  }

  static async addPaymentMethod(method: Omit<PaymentMethod, 'id'>): Promise<PaymentMethod> {
    const response = await apiClient.post<{ paymentMethod: PaymentMethod }>('/payment-methods', method);
    
    if (response.success && response.data) {
      return response.data.paymentMethod;
    }
    
    throw new Error(response.error || 'Failed to add payment method');
  }

  static async removePaymentMethod(methodId: string): Promise<void> {
    const response = await apiClient.delete(`/payment-methods/${methodId}`);
    
    if (!response.success) {
      throw new Error(response.error || 'Failed to remove payment method');
    }
  }

  static async setDefaultPaymentMethod(methodId: string): Promise<void> {
    const response = await apiClient.patch(`/payment-methods/${methodId}/default`);
    
    if (!response.success) {
      throw new Error(response.error || 'Failed to set default payment method');
    }
  }

  // Stripe payment integration
  static async createStripePaymentIntent(amount: string, currency: string = 'USD', metadata?: Record<string, any>) {
    const response = await apiClient.post('/stripe/create-payment-intent', {
      amount,
      currency,
      metadata,
    });
    
    if (response.success && response.data) {
      return response.data.clientSecret;
    }
    
    throw new Error(response.error || 'Failed to create payment intent');
  }

  // PayPal payment integration
  static async createPayPalOrder(amount: string, currency: string = 'USD', intent: string = 'CAPTURE') {
    const response = await apiClient.post('/paypal/order', {
      amount,
      currency,
      intent,
    });
    
    if (response.success && response.data) {
      return response.data;
    }
    
    throw new Error(response.error || 'Failed to create PayPal order');
  }

  static async capturePayPalOrder(orderId: string) {
    const response = await apiClient.post(`/paypal/order/${orderId}/capture`);
    
    if (response.success && response.data) {
      return response.data;
    }
    
    throw new Error(response.error || 'Failed to capture PayPal order');
  }
}
