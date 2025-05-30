/**
 * Dashboard용 사용자 통계 계산 유틸리티
 * integrations 페이지의 데이터 구조와 일관성 유지
 */

// 타입 정의 (기존 구조와 일관성 유지)
export interface ChatSession {
  id: string;
  title: string;
  url: string;
  summary?: string;
  metadata?: {
    messageCount?: number;
    mainCategory?: string;
    enhancedAt?: string;
    [key: string]: any;
  };
  created_at: string;
  user_id?: string;
}

export interface UserStats {
  totalChats: number;
  totalCategories: number;
  recentActivityCount: number;
  averageMessagesPerChat: number;
  mostActiveCategory: string;
  activityStreak: number;
}

export interface CategoryDistribution {
  [category: string]: {
    count: number;
    percentage: number;
    lastActivity: string;
  };
}

export interface ActivityTrend {
  date: string;
  chatCount: number;
  messageCount: number;
  categories: string[];
}

export interface RecentActivity {
  id: string;
  title: string;
  category: string;
  messageCount: number;
  createdAt: string;
  summary?: string;
}

/**
 * 사용자의 전체 통계를 계산합니다
 */
export function calculateUserStats(sessions: Partial<ChatSession>[]): UserStats {
  if (!sessions || sessions.length === 0) {
    return {
      totalChats: 0,
      totalCategories: 0,
      recentActivityCount: 0,
      averageMessagesPerChat: 0,
      mostActiveCategory: '기타',
      activityStreak: 0
    };
  }

  // 기본 통계 계산
  const totalChats = sessions.length;
  
  // 카테고리 분포 계산
  const categoryMap = new Map<string, number>();
  let totalMessages = 0;
  
  sessions.forEach(session => {
    const category = session.metadata?.mainCategory || '기타';
    categoryMap.set(category, (categoryMap.get(category) || 0) + 1);
    
    const messageCount = session.metadata?.messageCount || 0;
    totalMessages += messageCount;
  });

  const totalCategories = categoryMap.size;
  const averageMessagesPerChat = totalChats > 0 ? Math.round(totalMessages / totalChats) : 0;

  // 가장 활성화된 카테고리 찾기
  let mostActiveCategory = '기타';
  let maxCount = 0;
  categoryMap.forEach((count, category) => {
    if (count > maxCount) {
      maxCount = count;
      mostActiveCategory = category;
    }
  });

  // 최근 7일 활동 수 계산
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  
  const recentActivityCount = sessions.filter(session => {
    const createdAt = new Date(session.created_at || '');
    return createdAt >= sevenDaysAgo;
  }).length;

  // 활동 연속일 수 계산 (간단한 버전)
  const activityStreak = calculateActivityStreak(sessions);

  return {
    totalChats,
    totalCategories,
    recentActivityCount,
    averageMessagesPerChat,
    mostActiveCategory,
    activityStreak
  };
}

/**
 * 카테고리별 분포를 계산합니다
 */
export function getCategoryDistribution(sessions: Partial<ChatSession>[]): CategoryDistribution {
  const distribution: CategoryDistribution = {};
  const totalChats = sessions.length;

  if (totalChats === 0) {
    return distribution;
  }

  // 카테고리별 통계 수집
  const categoryStats = new Map<string, {
    count: number;
    lastActivity: string;
  }>();

  sessions.forEach(session => {
    const category = session.metadata?.mainCategory || '기타';
    const createdAt = session.created_at || '';
    
    const existing = categoryStats.get(category);
    if (!existing) {
      categoryStats.set(category, {
        count: 1,
        lastActivity: createdAt
      });
    } else {
      existing.count += 1;
      // 더 최근 날짜로 업데이트
      if (new Date(createdAt) > new Date(existing.lastActivity)) {
        existing.lastActivity = createdAt;
      }
    }
  });

  // 퍼센티지 계산하여 반환
  categoryStats.forEach((stats, category) => {
    distribution[category] = {
      count: stats.count,
      percentage: Math.round((stats.count / totalChats) * 100),
      lastActivity: stats.lastActivity
    };
  });

  return distribution;
}

/**
 * 시간별 활동 트렌드를 계산합니다 (최근 30일)
 */
export function getActivityTrend(sessions: Partial<ChatSession>[]): ActivityTrend[] {
  const trends: ActivityTrend[] = [];
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  // 날짜별로 그룹화
  const dailyActivity = new Map<string, {
    chatCount: number;
    messageCount: number;
    categories: Set<string>;
  }>();

  sessions.forEach(session => {
    const createdAt = new Date(session.created_at || '');
    if (createdAt < thirtyDaysAgo) return;

    const dateKey = createdAt.toISOString().split('T')[0]; // YYYY-MM-DD 형식
    const category = session.metadata?.mainCategory || '기타';
    const messageCount = session.metadata?.messageCount || 0;

    const existing = dailyActivity.get(dateKey);
    if (!existing) {
      dailyActivity.set(dateKey, {
        chatCount: 1,
        messageCount: messageCount,
        categories: new Set([category])
      });
    } else {
      existing.chatCount += 1;
      existing.messageCount += messageCount;
      existing.categories.add(category);
    }
  });

  // 결과 변환
  dailyActivity.forEach((activity, date) => {
    trends.push({
      date,
      chatCount: activity.chatCount,
      messageCount: activity.messageCount,
      categories: Array.from(activity.categories)
    });
  });

  // 날짜 순 정렬
  return trends.sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * 최근 활동 목록을 가져옵니다
 */
export function getRecentActivity(sessions: Partial<ChatSession>[], limit: number = 5): RecentActivity[] {
  const recentSessions = [...sessions]
    .sort((a, b) => {
      const dateA = new Date(a.created_at || '').getTime();
      const dateB = new Date(b.created_at || '').getTime();
      return dateB - dateA; // 최신순 정렬
    })
    .slice(0, limit);

  return recentSessions.map(session => ({
    id: session.id || '',
    title: session.title || '제목 없음',
    category: session.metadata?.mainCategory || '기타',
    messageCount: session.metadata?.messageCount || 0,
    createdAt: session.created_at || '',
    summary: session.summary || ''
  }));
}

/**
 * 활동 연속일 수를 계산합니다
 */
function calculateActivityStreak(sessions: Partial<ChatSession>[]): number {
  if (sessions.length === 0) return 0;

  // 날짜별로 활동이 있었는지 확인
  const activityDates = new Set<string>();
  sessions.forEach(session => {
    const date = new Date(session.created_at || '');
    const dateKey = date.toISOString().split('T')[0];
    activityDates.add(dateKey);
  });

  const sortedDates = Array.from(activityDates).sort();
  
  // 연속일 수 계산 (오늘부터 역순으로)
  const today = new Date().toISOString().split('T')[0];
  let streak = 0;
  let checkDate = new Date(today);

  while (true) {
    const dateKey = checkDate.toISOString().split('T')[0];
    if (sortedDates.includes(dateKey)) {
      streak += 1;
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      break;
    }
  }

  return streak;
}

/**
 * Dashboard UI에서 사용할 수 있는 형태로 통계를 포맷팅합니다
 */
export function formatStatsForDashboard(stats: UserStats): {
  totalChats: { value: number; label: string; trend: 'up' | 'down' | 'stable' };
  totalCategories: { value: number; label: string; trend: 'up' | 'down' | 'stable' };
  recentActivity: { value: number; label: string; trend: 'up' | 'down' | 'stable' };
} {
  return {
    totalChats: {
      value: stats.totalChats,
      label: `총 대화 수 | 평균 ${stats.averageMessagesPerChat}개 메시지`,
      trend: stats.recentActivityCount > 0 ? 'up' : 'stable'
    },
    totalCategories: {
      value: stats.totalCategories,
      label: `활성 카테고리 | 주요: ${stats.mostActiveCategory}`,
      trend: stats.totalCategories > 1 ? 'up' : 'stable'
    },
    recentActivity: {
      value: stats.recentActivityCount,
      label: `최근 7일 활동 | ${stats.activityStreak}일 연속`,
      trend: stats.recentActivityCount > 0 ? 'up' : 'down'
    }
  };
} 