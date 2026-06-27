import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Power, PowerOff, TestTube, CheckCircle, XCircle, AlertCircle, Sparkles } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8787';

export default function ChannelsPage() {
  const [telegramChannels, setTelegramChannels] = useState([]);
  const [webCrawlers, setWebCrawlers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('telegram'); // 'telegram' or 'web'
  const [editingItem, setEditingItem] = useState(null);
  const [testResults, setTestResults] = useState({}); // { id: { status, message, count } }
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchChannels();
  }, []);

  async function fetchChannels() {
    try {
      const [telegramRes, webRes] = await Promise.all([
        fetch(`${API_BASE}/api/admin/channels/telegram`),
        fetch(`${API_BASE}/api/admin/crawlers/web`)
      ]);

      const telegramData = await telegramRes.json();
      const webData = await webRes.json();

      if (telegramData.ok) setTelegramChannels(telegramData.channels);
      if (webData.ok) setWebCrawlers(webData.crawlers);
    } catch (error) {
      console.error('Failed to fetch channels:', error);
    }
  }

  function openAddModal(type) {
    setModalType(type);
    setEditingItem(null);
    setShowModal(true);
  }

  function openEditModal(item, type) {
    setModalType(type);
    setEditingItem(item);
    setShowModal(true);
  }

  async function handleDelete(id, type) {
    if (!confirm('确定要删除这个监听源吗？')) return;

    const endpoint = type === 'telegram'
      ? `${API_BASE}/api/admin/channels/telegram/${id}`
      : `${API_BASE}/api/admin/crawlers/web/${id}`;

    try {
      const res = await fetch(endpoint, { method: 'DELETE' });
      const data = await res.json();

      if (data.ok) {
        fetchChannels();
      } else {
        alert('删除失败：' + data.error);
      }
    } catch (error) {
      alert('删除失败：' + error.message);
    }
  }

  async function handleToggleEnabled(id, currentEnabled, type) {
    const endpoint = type === 'telegram'
      ? `${API_BASE}/api/admin/channels/telegram/${id}`
      : `${API_BASE}/api/admin/crawlers/web/${id}`;

    try {
      const res = await fetch(endpoint, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: currentEnabled ? 0 : 1 })
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }

      const data = await res.json();
      if (data.ok) {
        fetchChannels();
      } else {
        alert('更新失败：' + (data.error || '未知错误'));
      }
    } catch (error) {
      console.error('Toggle enabled error:', error);
      alert('更新失败：' + error.message);
    }
  }

  async function handleTest(item, type) {
    const testId = item.id;
    setTestResults(prev => ({ ...prev, [testId]: { status: 'testing', message: '测试中...' } }));

    try {
      const endpoint = type === 'telegram'
        ? `${API_BASE}/api/admin/channels/telegram/test`
        : `${API_BASE}/api/admin/crawlers/web/test`;

      const body = type === 'telegram'
        ? { handle: item.handle }
        : { url: item.url, crawler_type: item.crawler_type, selector: item.selector || '' };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      const data = await res.json();

      if (data.ok) {
        setTestResults(prev => ({
          ...prev,
          [testId]: {
            status: data.status,
            message: type === 'telegram'
              ? `获取 ${data.messageCount} 条消息`
              : `获取 ${data.itemCount} 条数据`,
            count: type === 'telegram' ? data.messageCount : data.itemCount
          }
        }));
      } else {
        setTestResults(prev => ({
          ...prev,
          [testId]: {
            status: 'failed',
            message: data.error || '测试失败'
          }
        }));
      }
    } catch (error) {
      setTestResults(prev => ({
        ...prev,
        [testId]: {
          status: 'failed',
          message: error.message
        }
      }));
    }
  }

  return (
    <div className="channelsPage">
      <header className="topbar">
        <div>
          <h1>监听源管理</h1>
          <p>管理 Telegram 频道和网站爬虫配置</p>
        </div>
        <div className="topActions">
          <button className="secondaryBtn" onClick={() => openAddModal('telegram')}>
            <Plus size={16} />
            添加 Telegram 频道
          </button>
          <button className="secondaryBtn" onClick={() => openAddModal('web')}>
            <Plus size={16} />
            添加网站爬虫
          </button>
        </div>
      </header>

      {/* Telegram Channels Section */}
      <section className="channelsSection">
        <h2>Telegram 频道 ({telegramChannels.length})</h2>
        <div className="channelGrid">
          {telegramChannels.map(ch => (
            <div key={ch.id} className={`channelCard ${ch.enabled ? '' : 'disabled'}`}>
              <div className="channelHeader">
                <div>
                  <h3>{ch.brand}</h3>
                  <p className="channelHandle">@{ch.handle}</p>
                </div>
                <span className={`badge ${ch.level}`}>{ch.level}</span>
              </div>

              <div className="channelActions">
                <button
                  className="iconBtn"
                  onClick={() => handleToggleEnabled(ch.id, ch.enabled, 'telegram')}
                  title={ch.enabled ? '禁用' : '启用'}
                >
                  {ch.enabled ? <Power size={16} /> : <PowerOff size={16} />}
                </button>
                <button
                  className="iconBtn"
                  onClick={() => handleTest(ch, 'telegram')}
                  title="测试连接"
                >
                  <TestTube size={16} />
                </button>
                <button
                  className="iconBtn"
                  onClick={() => openEditModal(ch, 'telegram')}
                  title="编辑"
                >
                  <Edit size={16} />
                </button>
                <button
                  className="iconBtn deleteIcon"
                  onClick={() => handleDelete(ch.id, 'telegram')}
                  title="删除"
                >
                  <Trash2 size={16} />
                </button>
              </div>

              {testResults[ch.id] && (
                <div className={`testResult ${testResults[ch.id].status}`}>
                  {testResults[ch.id].status === 'testing' && <AlertCircle size={14} />}
                  {testResults[ch.id].status === 'active' && <CheckCircle size={14} />}
                  {testResults[ch.id].status === 'failed' && <XCircle size={14} />}
                  <span>{testResults[ch.id].message}</span>
                </div>
              )}
            </div>
          ))}

          {telegramChannels.length === 0 && (
            <div className="empty">
              <p>暂无 Telegram 频道</p>
            </div>
          )}
        </div>
      </section>

      {/* Web Crawlers Section */}
      <section className="channelsSection">
        <h2>网站爬虫 ({webCrawlers.length})</h2>
        <div className="channelGrid">
          {webCrawlers.map(cr => (
            <div key={cr.id} className={`channelCard ${cr.enabled ? '' : 'disabled'}`}>
              <div className="channelHeader">
                <div>
                  <h3>{cr.name}</h3>
                  <p className="channelHandle">{cr.url}</p>
                </div>
                <span className="badge">{cr.crawler_type}</span>
              </div>

              <div className="channelActions">
                <button
                  className="iconBtn"
                  onClick={() => handleToggleEnabled(cr.id, cr.enabled, 'web')}
                  title={cr.enabled ? '禁用' : '启用'}
                >
                  {cr.enabled ? <Power size={16} /> : <PowerOff size={16} />}
                </button>
                <button
                  className="iconBtn"
                  onClick={() => handleTest(cr, 'web')}
                  title="测试连接"
                >
                  <TestTube size={16} />
                </button>
                <button
                  className="iconBtn"
                  onClick={() => openEditModal(cr, 'web')}
                  title="编辑"
                >
                  <Edit size={16} />
                </button>
                <button
                  className="iconBtn deleteIcon"
                  onClick={() => handleDelete(cr.id, 'web')}
                  title="删除"
                >
                  <Trash2 size={16} />
                </button>
              </div>

              {testResults[cr.id] && (
                <div className={`testResult ${testResults[cr.id].status}`}>
                  {testResults[cr.id].status === 'testing' && <AlertCircle size={14} />}
                  {testResults[cr.id].status === 'active' && <CheckCircle size={14} />}
                  {testResults[cr.id].status === 'failed' && <XCircle size={14} />}
                  <span>{testResults[cr.id].message}</span>
                </div>
              )}
            </div>
          ))}

          {webCrawlers.length === 0 && (
            <div className="empty">
              <p>暂无网站爬虫</p>
            </div>
          )}
        </div>
      </section>

      {/* Add/Edit Modal */}
      {showModal && (
        <AddEditModal
          type={modalType}
          item={editingItem}
          onClose={() => setShowModal(false)}
          onSuccess={() => {
            setShowModal(false);
            fetchChannels();
          }}
        />
      )}
    </div>
  );
}

function AddEditModal({ type, item, onClose, onSuccess }) {
  const isEdit = !!item;

  // 初始化表单数据，确保所有字段都有默认值
  const initialFormData = item
    ? {
        // 编辑模式：使用现有数据，但确保字段完整
        ...item,
        selector: item.selector || '',  // null 转为空字符串
        level: item.level || (type === 'telegram' ? 'High' : 'Medium'),
        crawler_type: item.crawler_type || 'tradingview'
      }
    : (type === 'telegram'
        ? { brand: '', handle: '', level: 'High' }
        : { name: '', url: '', crawler_type: 'tradingview', selector: '', level: 'Medium' });

  const [formData, setFormData] = useState(initialFormData);
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState(null);

  async function handleAnalyze() {
    if (!formData.url) {
      alert('请先输入 URL');
      return;
    }

    setAnalyzing(true);
    try {
      const res = await fetch(`${API_BASE}/api/admin/crawlers/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: formData.url })
      });

      const data = await res.json();

      console.log('Analysis response:', data);

      // 必须同时满足：ok + analyzed + 有推荐结果
      if (data.ok && data.analysis?.analyzed && data.analysis?.recommendation) {
        setAnalysis(data.analysis);
        // 自动填充推荐的 Selector
        setFormData({
          ...formData,
          selector: data.analysis.recommendation.selector || ''
        });
      } else {
        // 显示更详细的错误信息
        let message = '智能分析未找到合适的 Selector';
        if (data.analysis?.error) {
          message += `\n错误: ${data.analysis.error}`;
        }
        if (data.analysis?.selectors?.length > 0) {
          const firstSelector = data.analysis.selectors[0];
          message += `\n\n建议手动使用: ${firstSelector.selector}`;
          message += `\n(${firstSelector.reason})`;

          // 自动填充第一个候选
          setFormData({
            ...formData,
            selector: firstSelector.selector || ''
          });
          setAnalysis(data.analysis);
        } else {
          message += '\n\n建议留空，让爬虫自动识别';
        }
        alert(message);
      }
    } catch (error) {
      alert('分析失败：' + error.message);
    } finally {
      setAnalyzing(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);

    try {
      const endpoint = type === 'telegram'
        ? `${API_BASE}/api/admin/channels/telegram${isEdit ? `/${item.id}` : ''}`
        : `${API_BASE}/api/admin/crawlers/web${isEdit ? `/${item.id}` : ''}`;

      console.log('Submitting to:', endpoint, 'Data:', formData);

      const res = await fetch(endpoint, {
        method: isEdit ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      console.log('Response status:', res.status);

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`HTTP ${res.status}: ${errorText}`);
      }

      const data = await res.json();

      if (data.ok) {
        onSuccess();
      } else {
        alert('保存失败：' + (data.error || '未知错误'));
      }
    } catch (error) {
      console.error('Submit error:', error);
      alert('保存失败：' + error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="modalBackdrop" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <button className="iconBtn close" onClick={onClose}>
          <XCircle size={20} />
        </button>

        <h2>{isEdit ? '编辑' : '添加'}{type === 'telegram' ? 'Telegram 频道' : '网站爬虫'}</h2>

        <form onSubmit={handleSubmit}>
          {type === 'telegram' ? (
            <>
              <div className="formField">
                <label>品牌名称 *</label>
                <input
                  type="text"
                  value={formData.brand}
                  onChange={e => setFormData({ ...formData, brand: e.target.value })}
                  required
                  placeholder="例如：Binance"
                />
              </div>

              <div className="formField">
                <label>频道 Handle *</label>
                <input
                  type="text"
                  value={formData.handle}
                  onChange={e => setFormData({ ...formData, handle: e.target.value })}
                  required
                  placeholder="例如：binance（不含@）"
                />
              </div>

              <div className="formField">
                <label>优先级</label>
                <select
                  value={formData.level}
                  onChange={e => setFormData({ ...formData, level: e.target.value })}
                >
                  <option value="Critical">Critical</option>
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                </select>
              </div>
            </>
          ) : (
            <>
              <div className="formField">
                <label>爬虫名称 *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  required
                  placeholder="例如：TradingView News"
                />
              </div>

              <div className="formField">
                <label>URL *</label>
                <input
                  type="url"
                  value={formData.url}
                  onChange={e => setFormData({ ...formData, url: e.target.value })}
                  required
                  placeholder="https://..."
                />
              </div>

              <div className="formField">
                <label>爬虫类型</label>
                <select
                  value={formData.crawler_type}
                  onChange={e => setFormData({ ...formData, crawler_type: e.target.value })}
                >
                  <option value="tradingview">TradingView</option>
                  <option value="generic">通用</option>
                </select>
              </div>

              <div className="formField">
                <label>优先级</label>
                <select
                  value={formData.level || 'Medium'}
                  onChange={e => setFormData({ ...formData, level: e.target.value })}
                >
                  <option value="Critical">Critical</option>
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                </select>
              </div>

              {formData.crawler_type === 'generic' && (
                <>
                  <div className="formField">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <label>CSS Selector（可选）</label>
                      <button
                        type="button"
                        className="secondaryBtn"
                        onClick={handleAnalyze}
                        disabled={analyzing || !formData.url}
                        style={{ height: '32px', padding: '0 12px', fontSize: '13px' }}
                      >
                        <Sparkles size={14} style={{ marginRight: '4px' }} />
                        {analyzing ? '分析中...' : '智能分析'}
                      </button>
                    </div>
                    <input
                      type="text"
                      value={formData.selector || ''}
                      onChange={e => setFormData({ ...formData, selector: e.target.value })}
                      placeholder="留空自动识别，或输入 .news-item"
                    />
                    <p style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                      点击"智能分析"自动推荐最佳 Selector，或手动输入
                    </p>
                  </div>

                  {analysis && analysis.recommendation && (
                    <div className="analysisResult">
                      <h4>✨ 推荐 Selector</h4>
                      <div className="recommendedSelector">
                        <code>{analysis.recommendation.selector}</code>
                        <span className="confidence">
                          置信度: {(analysis.recommendation.confidence * 100).toFixed(0)}%
                        </span>
                      </div>
                      <p className="reason">{analysis.recommendation.reason}</p>
                      <div className="preview">
                        <strong>找到 {analysis.recommendation.count} 个元素，预览：</strong>
                        {analysis.recommendation.preview.slice(0, 2).map((item, i) => (
                          <div key={i} className="previewItem">
                            <div className="previewTitle">{item.title}</div>
                            <div className="previewText">{item.text.substring(0, 100)}...</div>
                          </div>
                        ))}
                      </div>

                      {analysis.selectors.length > 1 && (
                        <details style={{ marginTop: '12px' }}>
                          <summary style={{ cursor: 'pointer', fontSize: '13px', color: '#64748b' }}>
                            查看其他 {analysis.selectors.length - 1} 个备选方案
                          </summary>
                          <div style={{ marginTop: '8px' }}>
                            {analysis.selectors.slice(1).map((sel, i) => (
                              <div key={i} className="alternativeSelector">
                                <code>{sel.selector}</code>
                                <span>({sel.count} 个元素, {(sel.confidence * 100).toFixed(0)}%)</span>
                                <button
                                  type="button"
                                  onClick={() => setFormData({ ...formData, selector: sel.selector })}
                                  style={{ fontSize: '12px', padding: '2px 8px' }}
                                >
                                  使用
                                </button>
                              </div>
                            ))}
                          </div>
                        </details>
                      )}
                    </div>
                  )}
                </>
              )}
            </>
          )}

          <div className="modalActions">
            <button type="button" className="secondaryBtn" onClick={onClose}>
              取消
            </button>
            <button type="submit" className="primaryBtn" disabled={loading}>
              {loading ? '保存中...' : '保存'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
