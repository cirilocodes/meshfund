import { Group, GroupMember } from '../store/groupStore';
import { Contribution } from './contributions';

export interface BusinessRuleValidation {
  isValid: boolean;
  message?: string;
}

export class BusinessRulesService {
  // Rule 1: Groups should lock when full
  static validateGroupCapacity(group: Group, members: GroupMember[]): BusinessRuleValidation {
    const activeMembers = members.filter(member => member.isActive);
    
    if (activeMembers.length >= group.maxMembers) {
      return {
        isValid: false,
        message: `Group is full (${group.maxMembers} members maximum)`
      };
    }
    
    return { isValid: true };
  }

  // Rule 2: Contributions only once per cycle per user
  static validateContributionEligibility(
    userId: string, 
    groupId: string, 
    cycleNumber: number, 
    contributions: Contribution[]
  ): BusinessRuleValidation {
    const userContributionThisCycle = contributions.find(
      contribution => 
        contribution.userId === userId && 
        contribution.groupId === groupId && 
        contribution.cycleNumber === cycleNumber &&
        contribution.status === 'paid'
    );

    if (userContributionThisCycle) {
      return {
        isValid: false,
        message: `You have already contributed for cycle ${cycleNumber}`
      };
    }

    return { isValid: true };
  }

  // Rule 3: Payout only after all members contribute
  static validatePayoutEligibility(
    group: Group, 
    members: GroupMember[], 
    contributions: Contribution[], 
    cycleNumber: number
  ): BusinessRuleValidation {
    const activeMembers = members.filter(member => member.isActive);
    const paidContributionsThisCycle = contributions.filter(
      contribution => 
        contribution.groupId === group.id &&
        contribution.cycleNumber === cycleNumber &&
        contribution.status === 'paid'
    );

    if (paidContributionsThisCycle.length < activeMembers.length) {
      return {
        isValid: false,
        message: `Payout not available. ${paidContributionsThisCycle.length}/${activeMembers.length} members have contributed this cycle`
      };
    }

    return { isValid: true };
  }

  // Rule 4: Check if user has already received payout
  static validatePayoutReceived(member: GroupMember, cycleNumber: number): BusinessRuleValidation {
    if (member.hasReceivedPayout) {
      return {
        isValid: false,
        message: 'You have already received your payout for this cycle'
      };
    }

    return { isValid: true };
  }

  // Rule 5: Validate contribution amount matches group requirement
  static validateContributionAmount(group: Group, amount: string): BusinessRuleValidation {
    const contributionAmount = parseFloat(amount);
    const requiredAmount = parseFloat(group.contributionAmount);

    if (contributionAmount !== requiredAmount) {
      return {
        isValid: false,
        message: `Contribution must be exactly ${group.currency} ${group.contributionAmount}`
      };
    }

    return { isValid: true };
  }

  // Rule 6: Validate group admin permissions
  static validateAdminPermissions(userId: string, group: Group): BusinessRuleValidation {
    if (userId !== group.adminId) {
      return {
        isValid: false,
        message: 'Only group admin can perform this action'
      };
    }

    return { isValid: true };
  }

  // Rule 7: Validate cycle timing based on frequency
  static validateCycleTiming(group: Group, lastContributionDate?: Date): BusinessRuleValidation {
    if (!lastContributionDate) return { isValid: true };

    const now = new Date();
    const daysSinceLastContribution = Math.floor(
      (now.getTime() - lastContributionDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    let requiredDays: number;
    switch (group.frequency) {
      case 'weekly':
        requiredDays = 7;
        break;
      case 'bi-weekly':
        requiredDays = 14;
        break;
      case 'monthly':
        requiredDays = 30;
        break;
      default:
        return { isValid: true };
    }

    if (daysSinceLastContribution < requiredDays) {
      return {
        isValid: false,
        message: `Next cycle starts in ${requiredDays - daysSinceLastContribution} days`
      };
    }

    return { isValid: true };
  }

  // Rule 8: Validate payout position/order
  static validatePayoutPosition(
    member: GroupMember, 
    group: Group, 
    cycleNumber: number
  ): BusinessRuleValidation {
    if (!group.payoutOrder || group.payoutOrder.length === 0) {
      return { isValid: true }; // No specific order set
    }

    const expectedPosition = cycleNumber % group.payoutOrder.length;
    const expectedUserId = group.payoutOrder[expectedPosition];

    if (member.userId !== expectedUserId) {
      return {
        isValid: false,
        message: `It's not your turn for payout this cycle. Check the payout order.`
      };
    }

    return { isValid: true };
  }

  // Rule 9: Validate group is not locked
  static validateGroupNotLocked(group: Group): BusinessRuleValidation {
    if (group.isLocked) {
      return {
        isValid: false,
        message: 'Group is locked and not accepting new actions'
      };
    }

    return { isValid: true };
  }

  // Rule 10: Validate user reputation score
  static validateReputationScore(member: GroupMember, minimumScore: number = 50): BusinessRuleValidation {
    if (member.reputationScore < minimumScore) {
      return {
        isValid: false,
        message: `Reputation score too low (${member.reputationScore}). Minimum required: ${minimumScore}`
      };
    }

    return { isValid: true };
  }

  // Comprehensive validation for joining a group
  static validateJoinGroup(group: Group, members: GroupMember[], userReputationScore: number = 100): BusinessRuleValidation {
    // Check if group is locked
    const lockValidation = this.validateGroupNotLocked(group);
    if (!lockValidation.isValid) return lockValidation;

    // Check group capacity
    const capacityValidation = this.validateGroupCapacity(group, members);
    if (!capacityValidation.isValid) return capacityValidation;

    // Check reputation (for new members)
    const mockMember = { reputationScore: userReputationScore } as GroupMember;
    const reputationValidation = this.validateReputationScore(mockMember);
    if (!reputationValidation.isValid) return reputationValidation;

    return { isValid: true };
  }

  // Comprehensive validation for making a contribution
  static validateMakeContribution(
    userId: string,
    group: Group,
    members: GroupMember[],
    contributions: Contribution[],
    amount: string,
    cycleNumber: number
  ): BusinessRuleValidation {
    // Check if group is locked
    const lockValidation = this.validateGroupNotLocked(group);
    if (!lockValidation.isValid) return lockValidation;

    // Check contribution amount
    const amountValidation = this.validateContributionAmount(group, amount);
    if (!amountValidation.isValid) return amountValidation;

    // Check if user already contributed this cycle
    const eligibilityValidation = this.validateContributionEligibility(userId, group.id, cycleNumber, contributions);
    if (!eligibilityValidation.isValid) return eligibilityValidation;

    // Check user is an active member
    const member = members.find(m => m.userId === userId && m.isActive);
    if (!member) {
      return {
        isValid: false,
        message: 'You are not an active member of this group'
      };
    }

    return { isValid: true };
  }

  // Comprehensive validation for requesting a payout
  static validateRequestPayout(
    userId: string,
    group: Group,
    members: GroupMember[],
    contributions: Contribution[],
    cycleNumber: number
  ): BusinessRuleValidation {
    // Find user's membership
    const member = members.find(m => m.userId === userId && m.isActive);
    if (!member) {
      return {
        isValid: false,
        message: 'You are not an active member of this group'
      };
    }

    // Check if all members have contributed
    const payoutEligibilityValidation = this.validatePayoutEligibility(group, members, contributions, cycleNumber);
    if (!payoutEligibilityValidation.isValid) return payoutEligibilityValidation;

    // Check if user already received payout
    const payoutReceivedValidation = this.validatePayoutReceived(member, cycleNumber);
    if (!payoutReceivedValidation.isValid) return payoutReceivedValidation;

    // Check payout position if order is defined
    const positionValidation = this.validatePayoutPosition(member, group, cycleNumber);
    if (!positionValidation.isValid) return positionValidation;

    return { isValid: true };
  }
}