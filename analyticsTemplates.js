/**
 * Analytics Templates Module
 * 提供数据分析报告模版
 */

import { getAnalytics, getBrandCategoryMatrix, getBrandRegionMatrix } from './database.js';

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
      avgScore: summary.avg_score ? summary.avg_score.toFixed(1) : '0',
      uniqueBrands: summary.unique_brands || 0
    },

    topBrands: byBrand.slice(0, 10).map((b, i) => ({
      rank: i + 1,
      brand: b.brand || 'Unknown',
      count: b.count,
      avgScore: b.avg_score ? b.avg_score.toFixed(1) : '0',
      successRate: ((b.successful / b.count) * 100).toFixed(1) + '%'
    })),
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
 * 生成区域活动分析报告
 */
export function generateRegionReport(startDate = null, endDate = null) {
  const analytics = getAnalytics(startDate, endDate);
  if (!analytics) return null;

  const { summary, byRegion } = analytics;

  if (!byRegion || byRegion.length === 0) {
    return {
      title: '区域活动分析',
      period: { startDate, endDate },
      byRegion: [],
      insights: ['暂无区域数据']
    };
  }

  const total = summary.total_pushes || 1;

  const regionData = byRegion.map(r => ({
    region: r.region || 'Global',
    count: r.count,
    percentage: ((r.count / total) * 100).toFixed(1),
    avgScore: r.avg_score ? r.avg_score.toFixed(1) : '0'
  })).sort((a, b) => b.count - a.count);

  const insights = generateRegionInsights(regionData, total);

  return {
    title: '区域活动分析',
    period: { startDate, endDate },
    byRegion: regionData,
    insights
  };
}

/**
 * 生成区域洞察
 */
function generateRegionInsights(regionData, total) {
  const insights = [];

  const regionLabels = {
    'CN': '中国大陆',
    'LATAM': '拉美地区',
    'MENA': '中东北非',
    'ASIA': '亚洲其他',
    'EU': '欧洲',
    'US': '北美',
    'Global': '全球'
  };

  if (regionData.length === 0) {
    return ['暂无区域数据'];
  }

  // 主要活动区域
  const top = regionData[0];
  if (top && parseFloat(top.percentage) > 30) {
    insights.push(`${regionLabels[top.region] || top.region}是主要活动区域，占比 ${top.percentage}%`);
  } else if (top) {
    insights.push(`${regionLabels[top.region] || top.region}活动最活跃，占比 ${top.percentage}%`);
  }

  // 活动较少的区域
  const low = regionData.filter(r => parseFloat(r.percentage) < 5);
  if (low.length > 0 && low.length < regionData.length) {
    const lowNames = low.map(r => regionLabels[r.region] || r.region).join('、');
    insights.push(`${lowNames}等区域活动较少，占比不足 5%`);
  }

  // 区域多样性
  if (regionData.length >= 4) {
    insights.push(`竞对在 ${regionData.length} 个区域均有活动，市场布局较为多元化`);
  } else if (regionData.length >= 2) {
    insights.push(`竞对主要聚焦于 ${regionData.length} 个区域市场`);
  } else {
    insights.push('竞对活动主要集中在单一区域');
  }

  // 评分洞察
  const highScore = regionData.filter(r => parseFloat(r.avgScore) >= 75);
  if (highScore.length > 0) {
    const highNames = highScore.map(r => regionLabels[r.region] || r.region).join('、');
    insights.push(`${highNames}等区域的消息质量较高（平均分 ≥ 75）`);
  }

  return insights;
}

/**
 * 生成品牌类型交叉分析报告
 */
export function generateBrandCategoryReport(startDate = null, endDate = null, brandFilter = null) {
  const matrix = getBrandCategoryMatrix(startDate, endDate, brandFilter);

  if (!matrix || matrix.length === 0) {
    return {
      title: '品牌类型分析',
      period: { startDate, endDate, brandFilter },
      matrix: [],
      brandSummary: [],
      categorySummary: []
    };
  }

  // 按品牌聚合
  const brandMap = new Map();
  const categoryMap = new Map();

  matrix.forEach(item => {
    // 品牌维度统计
    if (!brandMap.has(item.brand)) {
      brandMap.set(item.brand, { brand: item.brand, categories: {}, total: 0 });
    }
    const brandData = brandMap.get(item.brand);
    brandData.categories[item.category] = item.count;
    brandData.total += item.count;

    // 类型维度统计
    if (!categoryMap.has(item.category)) {
      categoryMap.set(item.category, 0);
    }
    categoryMap.set(item.category, categoryMap.get(item.category) + item.count);
  });

  // 品牌汇总（带百分比）
  const brandSummary = Array.from(brandMap.values()).map(b => ({
    ...b,
    categories: b.categories
  })).sort((a, b) => b.total - a.total);

  // 类型汇总
  const categorySummary = Array.from(categoryMap.entries()).map(([category, count]) => ({
    category,
    count
  })).sort((a, b) => b.count - a.count);

  // 获取所有类型用于表格列
  const allCategories = Array.from(categoryMap.keys());

  return {
    title: '品牌类型分析',
    period: { startDate, endDate, brandFilter },
    matrix,
    brandSummary,
    categorySummary,
    allCategories
  };
}

/**
 * 生成品牌区域交叉分析报告
 */
export function generateBrandRegionReport(startDate = null, endDate = null, brandFilter = null, regionFilter = null) {
  const matrix = getBrandRegionMatrix(startDate, endDate, brandFilter, regionFilter);

  if (!matrix || matrix.length === 0) {
    return {
      title: '品牌区域分析',
      period: { startDate, endDate, brandFilter, regionFilter },
      matrix: [],
      brandSummary: [],
      regionSummary: [],
      allRegions: []
    };
  }

  // 按品牌聚合
  const brandMap = new Map();
  const regionMap = new Map();

  matrix.forEach(item => {
    // 品牌维度统计
    if (!brandMap.has(item.brand)) {
      brandMap.set(item.brand, { brand: item.brand, regions: {}, total: 0 });
    }
    const brandData = brandMap.get(item.brand);
    brandData.regions[item.region] = item.count;
    brandData.total += item.count;

    // 区域维度统计
    if (!regionMap.has(item.region)) {
      regionMap.set(item.region, 0);
    }
    regionMap.set(item.region, regionMap.get(item.region) + item.count);
  });

  // 品牌汇总（按总数排序）
  const brandSummary = Array.from(brandMap.values()).map(b => ({
    ...b,
    regions: b.regions
  })).sort((a, b) => b.total - a.total);

  // 区域汇总
  const regionSummary = Array.from(regionMap.entries()).map(([region, count]) => ({
    region,
    count
  })).sort((a, b) => b.count - a.count);

  // 获取所有区域用于表格列
  const allRegions = Array.from(regionMap.keys());

  return {
    title: '品牌区域分析',
    period: { startDate, endDate, brandFilter, regionFilter },
    matrix,
    brandSummary,
    regionSummary,
    allRegions
  };
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
  } else if (type === 'region') {
    csv = 'Region,Count,Percentage,Avg Score\n';
    report.byRegion.forEach(r => {
      csv += `${r.region},${r.count},${r.percentage}%,${r.avgScore}\n`;
    });
  } else if (type === 'brand-category') {
    // 品牌类型交叉表导出
    if (report.brandSummary && report.allCategories) {
      csv = 'Brand,' + report.allCategories.join(',') + ',Total\n';
      report.brandSummary.forEach(b => {
        const row = [b.brand];
        report.allCategories.forEach(cat => {
          row.push(b.categories[cat] || 0);
        });
        row.push(b.total);
        csv += row.join(',') + '\n';
      });
    }
  } else if (type === 'brand-region') {
    // 品牌区域交叉表导出
    if (report.brandSummary && report.allRegions) {
      csv = 'Brand,' + report.allRegions.join(',') + ',Total\n';
      report.brandSummary.forEach(b => {
        const row = [b.brand];
        report.allRegions.forEach(reg => {
          row.push(b.regions[reg] || 0);
        });
        row.push(b.total);
        csv += row.join(',') + '\n';
      });
    }
  }

  return csv;
}
