import { useState, useEffect } from 'react';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Calendar, TrendingUp, Globe, FileText, Download, Filter } from 'lucide-react';

const API_URL = import.meta.env.VITE_PUSH_API_URL || 'http://localhost:8787';

const COLORS = ['#2563eb', '#7c3aed', '#f97316', '#10b981', '#f59e0b', '#ef4444', '#6366f1'];

function getRegionLabel(code) {
  const labels = {
    'CN': '🇨🇳 中国大陆',
    'LATAM': '🌎 拉美地区',
    'MENA': '🕌 中东北非',
    'ASIA': '🌏 亚洲其他',
    'EU': '🇪🇺 欧洲',
    'US': '🇺🇸 北美',
    'Global': '🌍 全球'
  };
  return labels[code] || code;
}

export default function ReportsPage() {
  const [period, setPeriod] = useState('daily');
  const [loading, setLoading] = useState(false);
  const [dailyReport, setDailyReport] = useState(null);
  const [weeklyReport, setWeeklyReport] = useState(null);
  const [regionReport, setRegionReport] = useState(null);
  const [trendReport, setTrendReport] = useState(null);
  const [brandCategoryReport, setBrandCategoryReport] = useState(null);
  const [brandRegionReport, setBrandRegionReport] = useState(null);

  // 筛选器状态
  const [brandFilter, setBrandFilter] = useState('all');
  const [availableBrands, setAvailableBrands] = useState([]);

  useEffect(() => {
    fetchBrands();
  }, []);

  useEffect(() => {
    fetchReports();
  }, [period, brandFilter]);

  async function fetchBrands() {
    try {
      const res = await fetch(`${API_URL}/api/analytics/brands`);
      const data = await res.json();
      if (data.ok) setAvailableBrands(data.brands || []);
    } catch (error) {
      console.error('Failed to fetch brands:', error);
    }
  }

  async function fetchReports() {
    setLoading(true);

    try {
      // 获取日报/周报
      if (period === 'daily') {
        const res = await fetch(`${API_URL}/api/analytics/daily`);
        const data = await res.json();
        if (data.ok) setDailyReport(data.report);
      } else if (period === 'weekly') {
        const res = await fetch(`${API_URL}/api/analytics/weekly`);
        const data = await res.json();
        if (data.ok) setWeeklyReport(data.report);
      }

      // 获取品牌类型交叉分析
      const brandParam = brandFilter !== 'all' ? `&brand=${brandFilter}` : '';
      const brandCatRes = await fetch(`${API_URL}/api/analytics/brand-category?${brandParam}`);
      const brandCatData = await brandCatRes.json();
      if (brandCatData.ok) setBrandCategoryReport(brandCatData.report);

      // 获取品牌区域交叉分析
      const brandRegRes = await fetch(`${API_URL}/api/analytics/brand-region?${brandParam}`);
      const brandRegData = await brandRegRes.json();
      if (brandRegData.ok) setBrandRegionReport(brandRegData.report);

      // 获取区域报告
      const regionRes = await fetch(`${API_URL}/api/analytics/region`);
      const regionData = await regionRes.json();
      if (regionData.ok) setRegionReport(regionData.report);

      // 获取趋势报告
      const days = period === 'daily' ? 7 : period === 'weekly' ? 30 : 90;
      const trendRes = await fetch(`${API_URL}/api/analytics/trend?days=${days}`);
      const trendData = await trendRes.json();
      if (trendData.ok) setTrendReport(trendData.report);

    } catch (error) {
      console.error('Failed to fetch reports:', error);
    } finally {
      setLoading(false);
    }
  }

  async function exportCSV(type) {
    try {
      const res = await fetch(`${API_URL}/api/analytics/export/csv?type=${type}`);
      const csvText = await res.text();

      const blob = new Blob([csvText], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `report-${type}-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export failed:', error);
      alert('导出失败');
    }
  }

  const currentReport = period === 'daily' ? dailyReport : weeklyReport;

  return (
    <div className="reportsPage">
      {/* 顶部控制栏 */}
      <div className="topbar">
        <div>
          <div className="eyebrow">
            <FileText size={14} />
            Reports
          </div>
          <h1>竞对分析报告</h1>
          <p>多维度数据分析，洞察竞对动态</p>
        </div>

        <div className="topActions">
          <button className="secondaryBtn" onClick={() => fetchReports()}>
            <TrendingUp size={16} />
            刷新数据
          </button>

          <button className="primaryBtn" onClick={() => exportCSV('brand-category')}>
            <Download size={16} />
            导出 CSV
          </button>
        </div>
      </div>

      {/* 筛选器 */}
      <div className="card" style={{ marginBottom: '16px' }}>
        <div style={{ padding: '16px', display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
          <Filter size={18} />
          <span style={{ fontWeight: 600 }}>筛选条件</span>

          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            style={{
              height: '36px',
              padding: '0 12px',
              borderRadius: '8px',
              border: '1px solid #dbe3ee',
              fontSize: '14px'
            }}
          >
            <option value="daily">日报</option>
            <option value="weekly">周报</option>
            <option value="monthly">月报</option>
          </select>

          <select
            value={brandFilter}
            onChange={(e) => setBrandFilter(e.target.value)}
            style={{
              height: '36px',
              padding: '0 12px',
              borderRadius: '8px',
              border: '1px solid #dbe3ee',
              fontSize: '14px',
              minWidth: '150px'
            }}
          >
            <option value="all">全部品牌</option>
            {availableBrands.map(brand => (
              <option key={brand} value={brand}>{brand}</option>
            ))}
          </select>
        </div>
      </div>

      {loading && <div className="loading">加载中...</div>}

      {!loading && currentReport && (
        <>
          {/* 市场概况 */}
          <div className="card reportCard">
            <div className="cardHeader">
              <h2>市场概况</h2>
              <p>{currentReport.title}</p>
            </div>

            <div className="stats">
              <div className="stat">
                <div>
                  <p>总推送数</p>
                  <h3>{currentReport.overview.totalPushes}</h3>
                </div>
                <Calendar size={48} />
              </div>

              <div className="stat">
                <div>
                  <p>成功率</p>
                  <h3>{currentReport.overview.successRate}</h3>
                </div>
                <TrendingUp size={48} />
              </div>

              <div className="stat">
                <div>
                  <p>平均分</p>
                  <h3>{currentReport.overview.avgScore}</h3>
                </div>
                <FileText size={48} />
              </div>

              <div className="stat">
                <div>
                  <p>活跃品牌数</p>
                  <h3>{currentReport.overview.uniqueBrands}</h3>
                </div>
                <Globe size={48} />
              </div>
            </div>
          </div>

          {/* 品牌类型交叉分析 */}
          {brandCategoryReport && brandCategoryReport.brandSummary && brandCategoryReport.brandSummary.length > 0 && (
            <div className="card reportCard">
              <div className="cardHeader">
                <h2>品牌消息类型分布</h2>
                <p>{brandFilter === 'all' ? '全品牌' : brandFilter} 的消息类型统计</p>
              </div>

              {/* 交叉表格 */}
              <table className="brandTable">
                <thead>
                  <tr>
                    <th>品牌</th>
                    {brandCategoryReport.allCategories.map(cat => (
                      <th key={cat}>{cat}</th>
                    ))}
                    <th>总计</th>
                  </tr>
                </thead>
                <tbody>
                  {brandCategoryReport.brandSummary.map(b => (
                    <tr key={b.brand}>
                      <td className="brandCell"><strong>{b.brand}</strong></td>
                      {brandCategoryReport.allCategories.map(cat => (
                        <td key={cat}>{b.categories[cat] || 0}</td>
                      ))}
                      <td><strong>{b.total}</strong></td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* 堆叠柱状图 */}
              <div style={{ marginTop: '24px', height: '300px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={brandCategoryReport.brandSummary}
                    layout="vertical"
                    margin={{ left: 80 }}
                  >
                    <XAxis type="number" />
                    <YAxis dataKey="brand" type="category" width={80} fontSize={12} />
                    <Tooltip />
                    <Legend />
                    {brandCategoryReport.allCategories.map((cat, index) => (
                      <Bar
                        key={cat}
                        dataKey={`categories.${cat}`}
                        stackId="a"
                        fill={COLORS[index % COLORS.length]}
                        name={cat}
                      />
                    ))}
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* 消息类型总览 */}
          {brandCategoryReport && brandCategoryReport.categorySummary && brandCategoryReport.categorySummary.length > 0 && (
            <div className="grid2">
              <div className="card chartCard">
                <div className="cardHeader">
                  <h2>消息类型总览</h2>
                  <p>全品牌消息类型分布</p>
                </div>

                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={brandCategoryReport.categorySummary}>
                    <XAxis dataKey="category" fontSize={12} />
                    <YAxis fontSize={12} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#2563eb" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="card chartCard">
                <div className="cardHeader">
                  <h2>类型占比</h2>
                  <p>饼图视图</p>
                </div>

                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={brandCategoryReport.categorySummary}
                      dataKey="count"
                      nameKey="category"
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={90}
                      label
                    >
                      {brandCategoryReport.categorySummary.map((entry, index) => (
                        <Cell key={entry.category} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* 品牌区域交叉分析 */}
          {brandRegionReport && brandRegionReport.brandSummary && brandRegionReport.brandSummary.length > 0 && (
            <div className="card reportCard">
              <div className="cardHeader">
                <h2>品牌区域分布</h2>
                <p>{brandFilter === 'all' ? '全品牌' : brandFilter} 在不同区域的活动统计</p>
              </div>

              {/* 交叉表格 */}
              <table className="brandTable">
                <thead>
                  <tr>
                    <th>品牌</th>
                    {brandRegionReport.allRegions.map(reg => (
                      <th key={reg}>{getRegionLabel(reg)}</th>
                    ))}
                    <th>总计</th>
                  </tr>
                </thead>
                <tbody>
                  {brandRegionReport.brandSummary.map(b => (
                    <tr key={b.brand}>
                      <td className="brandCell"><strong>{b.brand}</strong></td>
                      {brandRegionReport.allRegions.map(reg => (
                        <td key={reg}>{b.regions[reg] || 0}</td>
                      ))}
                      <td><strong>{b.total}</strong></td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* 堆叠柱状图 */}
              <div style={{ marginTop: '24px', height: '300px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={brandRegionReport.brandSummary}
                    layout="vertical"
                    margin={{ left: 80 }}
                  >
                    <XAxis type="number" />
                    <YAxis dataKey="brand" type="category" width={80} fontSize={12} />
                    <Tooltip />
                    <Legend />
                    {brandRegionReport.allRegions.map((reg, index) => (
                      <Bar
                        key={reg}
                        dataKey={`regions.${reg}`}
                        stackId="a"
                        fill={COLORS[index % COLORS.length]}
                        name={getRegionLabel(reg)}
                      />
                    ))}
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* 区域活动分布 */}
          {regionReport && regionReport.byRegion && regionReport.byRegion.length > 0 && (
            <div className="card reportCard">
              <div className="cardHeader">
                <h2>区域活动分布</h2>
                <p>竞对在不同地区的活动统计</p>
              </div>

              <div className="regionGrid">
                {regionReport.byRegion.map(r => (
                  <div key={r.region} className="regionCard">
                    <div className="regionHeader">
                      <h3>{getRegionLabel(r.region)}</h3>
                      <span className="regionPercentage">{r.percentage}%</span>
                    </div>
                    <div className="regionStats">
                      <div className="regionStat">
                        <span>消息数</span>
                        <strong>{r.count}</strong>
                      </div>
                      <div className="regionStat">
                        <span>平均分</span>
                        <strong>{r.avgScore}</strong>
                      </div>
                    </div>
                    <div className="regionBar">
                      <div
                        className="regionBarFill"
                        style={{ width: `${r.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              {regionReport.insights && regionReport.insights.length > 0 && (
                <div className="insightsBox">
                  <h4>💡 洞察</h4>
                  <ul>
                    {regionReport.insights.map((insight, i) => (
                      <li key={i}>{insight}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* 品牌活跃度排行 */}
          <div className="card reportCard">
            <div className="cardHeader">
              <h2>品牌活跃度排行</h2>
              <p>Top {currentReport.topBrands.length} 品牌</p>
            </div>

            <table className="brandTable">
              <thead>
                <tr>
                  <th>排名</th>
                  <th>品牌</th>
                  <th>消息数</th>
                  <th>平均分</th>
                  <th>成功率</th>
                </tr>
              </thead>
              <tbody>
                {currentReport.topBrands.map(b => (
                  <tr key={b.rank}>
                    <td className="rankCell">#{b.rank}</td>
                    <td className="brandCell"><strong>{b.brand}</strong></td>
                    <td>{b.count}</td>
                    <td>{b.avgScore}</td>
                    <td>{b.successRate}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {!loading && !currentReport && (
        <div className="empty wide">
          <FileText size={48} />
          <b>暂无报告数据</b>
          <p>请先爬取数据后再查看报告</p>
        </div>
      )}
    </div>
  );
}
