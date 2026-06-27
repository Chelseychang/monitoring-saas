/**
 * Analytics Templates Module
 * 提供数据分析报告模版
 */

import { getAnalytics } from './database.js';

/**
 * 生成日报模版
 */
export function generateDailyReport(date = null) {
  const targetDate = date || new Date().toISOString().split('T')[0];
  const startDate = `${targetDate} 00:00:00`;
  const endDate = `${targetDate} 23:59:59`;

  const analytics = getAnalytics(startDate, endDate);
  if (!analytics) return null;

  const { summary, byBrand, byCategory, byHour, aiDecisions, masking, errors } = analytics;

  const report = {
    title: `情报监控日报 - ${targetDate}`,
    period: { date: targetDate },

    // 总览
    overview: {
      totalPushes: summary.total_pushes || 0,
      successRate: summary.total_pushes > 0
        ? ((summary.successful_pushes / summary.total_pushes) * 100).toFixed(1) + '%'
        : '0%',
      avgScore: summary.avg_score ? summary.avg_score.toFixed(1) : '0',
      uniqueBrands: summary.unique_brands || 0,
      uniqueCategories: summary.unique_categories || 0
    },

    // 品牌排行榜
    topBrands: byBrand.slice(0, 5).map((b, i) => ({
      rank: i + 1,
      brand: b.brand || 'Unknown',
      count: b.count,
      avgScore: b.avg_score ? b.avg_score.toFixed(1) : '0',
      successRate: ((b.successful / b.count) * 100).toFixed(1) + '%'
    })),

    // 分类分布
    categoryDistribution: byCategory.map(c => ({
      category: c.category || 'Unknown',
      count: c.count,
      percentage: summary.total_pushes > 0
        ? ((c.count / summary.total_pushes) * 100).toFixed(1) + '%'
        : '0%',
      avgScore: c.avg_score ? c.avg_score.toFixed(1) : '0'
    })),

    // 时间分布（活跃时段）
    hourlyActivity: byHour.reverse().map(h => ({
      hour: h.hour,
      count: h.count,
      avgScore: h.avg_score ? h.avg_score.toFixed(1) : '0'
    })),

    // AI决策统计
    aiDecisions: {
      total: aiDecisions.reduce((sum, d) => sum + d.count, 0),
      breakdown: aiDecisions
    },

    // 数据脱敏统计
    dataSecurity: {
      maskedItems: masking.total_masked || 0
    },

    // 错误统计
    errors: {
      total: errors.reduce((sum, e) => sum + e.count, 0),
      breakdown: errors
    }
  };

  return report;
}

/**
 * 生成周报模版
 */
export function generateWeeklyReport(weekOffset = 0) {
  const now = new Date();
  now.setDate(now.getDate() - weekOffset * 7);

  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0, 0, 0, 0);

  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);
  endOfWeek.setHours(23, 59, 59, 999);

  const startDate = startOfWeek.toISOString().replace('T', ' ').split('.')[0];
  const endDate = endOfWeek.toISOString().replace('T', ' ').split('.')[0];

  const analytics = getAnalytics(startDate, endDate);
  if (!analytics) return null;

  const { summary, byBrand, byCategory, aiDecisions } = analytics;

  return {
    title: `情报监控周报`,
    period: {
      start: startOfWeek.toISOString().split('T')[0],
      end: endOfWeek.toISOString().split('T')[0]
    },

    overview: {
      totalPushes: summary.total_pushes || 0,
      dailyAverage: summary.total_pushes ? (summary.total_pushes / 7).toFixed(1) : '0',
      successRate: summary.total_pushes > 0
        ? ((summary.successful_pushes / summary.total_pushes) * 100).toFixed(1) + '%'
        : '0%',
      avgScore: summary.avg_score ? summary.avg_score.toFixed(1) : '0'
    },

    topBrands: byBrand.slice(0, 10),
    categoryDistribution: byCategory,
    aiDecisions
  };
}

/**
 * 生成趋势分析报告
 */
export function generateTrendReport(days = 7) {
  const reports = [];

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];

    const dayReport = generateDailyReport(dateStr);
    if (dayReport) {
      reports.push({
        date: dateStr,
        totalPushes: dayReport.overview.totalPushes,
        avgScore: parseFloat(dayReport.overview.avgScore),
        successRate: parseFloat(dayReport.overview.successRate)
      });
    }
  }

  // 计算趋势
  const trend = {
    pushVolume: calculateTrend(reports.map(r => r.totalPushes)),
    avgScore: calculateTrend(reports.map(r => r.avgScore)),
    successRate: calculateTrend(reports.map(r => r.successRate))
  };

  return {
    title: `${days}天趋势分析`,
    period: {
      days,
      start: reports[0]?.date,
      end: reports[reports.length - 1]?.date
    },
    dailyData: reports,
    trends: trend
  };
}

/**
 * 生成品牌对比报告
 */
export function generateBrandComparisonReport(brandNames, days = 30) {
  const endDate = new Date().toISOString().replace('T', ' ').split('.')[0];
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  const startDateStr = startDate.toISOString().replace('T', ' ').split('.')[0];

  const analytics = getAnalytics(startDateStr, endDate);
  if (!analytics) return null;

  const brandData = analytics.byBrand.filter(b =>
    brandNames.includes(b.brand)
  );

  return {
    title: '品牌对比分析',
    period: {
      days,
      start: startDate.toISOString().split('T')[0],
      end: new Date().toISOString().split('T')[0]
    },
    brands: brandData.map(b => ({
      brand: b.brand,
      totalPushes: b.count,
      avgScore: b.avg_score ? b.avg_score.toFixed(1) : '0',
      successRate: ((b.successful / b.count) * 100).toFixed(1) + '%',
      dailyAverage: (b.count / days).toFixed(1)
    }))
  };
}

/**
 * 生成分类热力图数据
 */
export function generateCategoryHeatmap(days = 30) {
  const endDate = new Date().toISOString().replace('T', ' ').split('.')[0];
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  const startDateStr = startDate.toISOString().replace('T', ' ').split('.')[0];

  const analytics = getAnalytics(startDateStr, endDate);
  if (!analytics) return null;

  const maxCount = Math.max(...analytics.byCategory.map(c => c.count));

  return {
    title: '分类热力图',
    period: { days },
    categories: analytics.byCategory.map(c => ({
      name: c.category,
      count: c.count,
      intensity: maxCount > 0 ? (c.count / maxCount) : 0,
      avgScore: c.avg_score ? c.avg_score.toFixed(1) : '0'
    }))
  };
}

/**
 * 生成合规审计报告
 */
export function generateComplianceReport(startDate = null, endDate = null) {
  const analytics = getAnalytics(startDate, endDate);
  if (!analytics) return null;

  const { summary, masking, errors } = analytics;

  const totalOperations = summary.total_pushes || 0;
  const maskedOperations = masking.total_masked || 0;
  const errorCount = errors.reduce((sum, e) => sum + e.count, 0);

  return {
    title: '安全合规审计报告',
    period: { startDate, endDate },

    compliance: {
      totalOperations,
      dataMasking: {
        enabled: true,
        maskedOperations,
        coverageRate: totalOperations > 0
          ? ((maskedOperations / totalOperations) * 100).toFixed(1) + '%'
          : '0%'
      },
      auditLog: {
        enabled: true,
        recordedOperations: totalOperations
      },
      errorRate: totalOperations > 0
        ? ((errorCount / totalOperations) * 100).toFixed(2) + '%'
        : '0%'
    },

    errors: {
      total: errorCount,
      breakdown: errors,
      criticalErrors: errors.filter(e =>
        e.error_type?.includes('critical') || e.error_type?.includes('fatal')
      )
    },

    recommendations: generateComplianceRecommendations({
      totalOperations,
      maskedOperations,
      errorCount
    })
  };
}

/**
 * 计算趋势（上升/下降/稳定）
 */
function calculateTrend(values) {
  if (values.length < 2) return 'stable';

  const recentAvg = values.slice(-3).reduce((a, b) => a + b, 0) / 3;
  const olderAvg = values.slice(0, 3).reduce((a, b) => a + b, 0) / 3;

  const change = ((recentAvg - olderAvg) / olderAvg) * 100;

  if (change > 10) return 'increasing';
  if (change < -10) return 'decreasing';
  return 'stable';
}

/**
 * 生成合规建议
 */
function generateComplianceRecommendations({ totalOperations, maskedOperations, errorCount }) {
  const recommendations = [];

  const maskingRate = totalOperations > 0 ? (maskedOperations / totalOperations) : 0;
  const errorRate = totalOperations > 0 ? (errorCount / totalOperations) : 0;

  if (maskingRate < 0.8) {
    recommendations.push({
      level: 'warning',
      message: '数据脱敏覆盖率不足80%，建议检查脱敏配置'
    });
  }

  if (errorRate > 0.05) {
    recommendations.push({
      level: 'critical',
      message: '错误率超过5%，建议立即检查系统稳定性'
    });
  }

  if (totalOperations > 1000 && maskingRate > 0.95 && errorRate < 0.01) {
    recommendations.push({
      level: 'success',
      message: '系统运行良好，合规指标健康'
    });
  }

  return recommendations;
}

/**
 * 导出CSV格式
 */
export function exportToCsv(report, type = 'daily') {
  if (!report) return null;

  let csv = '';

  if (type === 'daily') {
    csv = 'Brand,Count,Avg Score,Success Rate\n';
    report.topBrands.forEach(b => {
      csv += `${b.brand},${b.count},${b.avgScore},${b.successRate}\n`;
    });
  } else if (type === 'trend') {
    csv = 'Date,Total Pushes,Avg Score,Success Rate\n';
    report.dailyData.forEach(d => {
      csv += `${d.date},${d.totalPushes},${d.avgScore},${d.successRate}\n`;
    });
  }

  return csv;
}
