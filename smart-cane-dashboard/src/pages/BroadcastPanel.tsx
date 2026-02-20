import { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Volume2,
  VolumeX,
  Play,
  Pause,
  Navigation,
  AlertTriangle,
  Info,
  Settings,
  Bell,
  Bot,
  Send,
  Loader2,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Key,
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import GlassCard from '../components/GlassCard';
import { buildAgentRequest, callAgent } from '../services/llmAgent';
import type { AgentMessage } from '../types';

const typeConfig = {
  navigation: { icon: Navigation, color: '#10b981', label: '导航', emoji: '🟢' },
  alert: { icon: AlertTriangle, color: '#ef4444', label: '警报', emoji: '🔴' },
  info: { icon: Info, color: '#6366f1', label: '信息', emoji: '🔵' },
};

const actionColorMap: Record<string, string> = {
  navigate: '#10b981',
  alert: '#ef4444',
  info: '#6366f1',
  emergency: '#dc2626',
  chat: '#8b5cf6',
};

export default function BroadcastPanel() {
  const broadcasts = useAppStore((s) => s.broadcasts);
  const isSpeaking = useAppStore((s) => s.isSpeaking);
  const setIsSpeaking = useAppStore((s) => s.setIsSpeaking);
  const markBroadcastPlayed = useAppStore((s) => s.markBroadcastPlayed);
  const caneData = useAppStore((s) => s.caneData);
  const obstacles = useAppStore((s) => s.obstacles);
  const navigation = useAppStore((s) => s.navigation);
  const asrResults = useAppStore((s) => s.asrResults);
  const agentMessages = useAppStore((s) => s.agentMessages);
  const agentLoading = useAppStore((s) => s.agentLoading);
  const addAgentMessage = useAppStore((s) => s.addAgentMessage);
  const setAgentLoading = useAppStore((s) => s.setAgentLoading);
  const llmConfig = useAppStore((s) => s.llmConfig);
  const updateLLMConfig = useAppStore((s) => s.updateLLMConfig);

  const [volume, setVolume] = useState(80);
  const [speed, setSpeed] = useState(1.0);
  const [autoPlay, setAutoPlay] = useState(true);
  const [filter, setFilter] = useState<'all' | 'navigation' | 'alert' | 'info'>('all');
  const [chatInput, setChatInput] = useState('');
  const [showConfig, setShowConfig] = useState(false);
  const [expandedMsg, setExpandedMsg] = useState<string | null>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    synthRef.current = window.speechSynthesis;
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [agentMessages]);

  useEffect(() => {
    if (!autoPlay || !broadcasts.length) return;
    const latest = broadcasts[0];
    if (!latest.played) {
      speak(latest.text);
      markBroadcastPlayed(latest.id);
    }
  }, [broadcasts, autoPlay]);

  const speak = useCallback(
    (text: string) => {
      if (!synthRef.current) return;
      synthRef.current.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'zh-CN';
      utterance.volume = volume / 100;
      utterance.rate = speed;
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      synthRef.current.speak(utterance);
    },
    [volume, speed, setIsSpeaking]
  );

  const stopSpeaking = () => {
    synthRef.current?.cancel();
    setIsSpeaking(false);
  };

  // 调用智能体
  const sendToAgent = useCallback(async (text: string) => {
    if (!text.trim() || agentLoading) return;

    const userMsg: AgentMessage = {
      id: `msg_${Date.now()}_u`,
      role: 'user',
      content: text,
      timestamp: Date.now(),
    };
    addAgentMessage(userMsg);
    setChatInput('');
    setAgentLoading(true);

    try {
      const request = buildAgentRequest(text, caneData, obstacles, navigation, asrResults);
      const response = await callAgent(request, llmConfig);

      const assistantMsg: AgentMessage = {
        id: `msg_${Date.now()}_a`,
        role: 'assistant',
        content: response.speech_text,
        timestamp: Date.now(),
        agentRequest: request,
        agentResponse: response,
      };
      addAgentMessage(assistantMsg);

      if (autoPlay) {
        speak(response.speech_text);
      }
    } catch (err) {
      addAgentMessage({
        id: `msg_${Date.now()}_e`,
        role: 'system',
        content: '智能体调用失败: ' + (err instanceof Error ? err.message : '未知错误'),
        timestamp: Date.now(),
      });
    } finally {
      setAgentLoading(false);
    }
  }, [agentLoading, caneData, obstacles, navigation, asrResults, llmConfig, autoPlay, speak, addAgentMessage, setAgentLoading]);

  const filteredBroadcasts =
    filter === 'all' ? broadcasts : broadcasts.filter((b) => b.type === filter);

  const alertCount = broadcasts.filter((b) => b.type === 'alert').length;
  const navCount = broadcasts.filter((b) => b.type === 'navigation').length;
  const infoCount = broadcasts.filter((b) => b.type === 'info').length;

  return (
    <div className="broadcast-page">
      <div className="broadcast-grid">
        {/* Left Sidebar: Controls */}
        <div className="broadcast-sidebar">
          <GlassCard
            title="播报控制"
            icon={<Settings size={18} />}
            accent="#8b5cf6"
            className="broadcast-controls"
          >
            <div className="control-section">
              <label className="control-label">
                <Volume2 size={14} /> 音量: {volume}%
              </label>
              <input type="range" min="0" max="100" value={volume}
                onChange={(e) => setVolume(Number(e.target.value))} className="slider" />
            </div>
            <div className="control-section">
              <label className="control-label">
                <Play size={14} /> 语速: {speed.toFixed(1)}x
              </label>
              <input type="range" min="0.5" max="2.0" step="0.1" value={speed}
                onChange={(e) => setSpeed(Number(e.target.value))} className="slider" />
            </div>
            <div className="control-section">
              <label className="control-toggle">
                <input type="checkbox" checked={autoPlay}
                  onChange={(e) => setAutoPlay(e.target.checked)} />
                <span className="toggle-slider" /> 自动播报
              </label>
            </div>
            <div className="control-section">
              {isSpeaking ? (
                <button className="ctrl-btn danger" onClick={stopSpeaking}>
                  <VolumeX size={16} /> 停止播报
                </button>
              ) : (
                <button className="ctrl-btn primary"
                  onClick={() => broadcasts[0] && speak(broadcasts[0].text)}
                  disabled={!broadcasts.length}>
                  <Play size={16} /> 播放最新
                </button>
              )}
            </div>
            <AnimatePresence>
              {isSpeaking && (
                <motion.div className="speaking-indicator"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}>
                  <div className="speaking-waves">
                    {[...Array(5)].map((_, i) => (
                      <motion.div key={i} className="speaking-bar"
                        animate={{ height: [8, 24, 8] }}
                        transition={{ repeat: Infinity, duration: 0.6, delay: i * 0.1 }} />
                    ))}
                  </div>
                  <span>正在播报...</span>
                </motion.div>
              )}
            </AnimatePresence>
          </GlassCard>

          {/* LLM Config */}
          <GlassCard
            title="智能体配置"
            icon={<Key size={18} />}
            accent="#f59e0b"
            className="agent-config-card"
          >
            <button className="config-toggle-btn" onClick={() => setShowConfig(!showConfig)}>
              {showConfig ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              <span>{showConfig ? '收起' : '展开'} API 配置</span>
            </button>
            <AnimatePresence>
              {showConfig && (
                <motion.div className="config-fields"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}>
                  <div className="config-field">
                    <label>模型</label>
                    <select value={llmConfig.model}
                      onChange={(e) => updateLLMConfig({ model: e.target.value })}>
                      <option value="mock">模拟模式</option>
                      <option value="gpt-4o">GPT-4o</option>
                      <option value="gpt-4o-mini">GPT-4o-mini</option>
                      <option value="deepseek-chat">DeepSeek</option>
                      <option value="qwen-turbo">通义千问</option>
                    </select>
                  </div>
                  <div className="config-field">
                    <label>API Base URL</label>
                    <input type="text" placeholder="https://api.openai.com/v1"
                      value={llmConfig.baseUrl}
                      onChange={(e) => updateLLMConfig({ baseUrl: e.target.value })} />
                  </div>
                  <div className="config-field">
                    <label>API Key</label>
                    <input type="password" placeholder="sk-..."
                      value={llmConfig.apiKey}
                      onChange={(e) => updateLLMConfig({ apiKey: e.target.value })} />
                  </div>
                  <div className="config-status">
                    <Sparkles size={12} />
                    <span>{llmConfig.model === 'mock' ? '当前为模拟模式' : `已配置 ${llmConfig.model}`}</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </GlassCard>

          {/* Stats */}
          <GlassCard title="播报统计" icon={<Bell size={18} />} accent="#06b6d4" className="broadcast-stats">
            <div className="stats-grid">
              <div className="stat-item" onClick={() => setFilter('all')}>
                <span className="stat-num">{broadcasts.length}</span>
                <span className="stat-name">全部</span>
              </div>
              <div className="stat-item alert" onClick={() => setFilter('alert')}>
                <span className="stat-num">{broadcasts.filter((b) => b.type === 'alert').length}</span>
                <span className="stat-name">警报</span>
              </div>
              <div className="stat-item nav" onClick={() => setFilter('navigation')}>
                <span className="stat-num">{broadcasts.filter((b) => b.type === 'navigation').length}</span>
                <span className="stat-name">导航</span>
              </div>
              <div className="stat-item info" onClick={() => setFilter('info')}>
                <span className="stat-num">{broadcasts.filter((b) => b.type === 'info').length}</span>
                <span className="stat-name">信息</span>
              </div>
            </div>
          </GlassCard>
        </div>

        {/* Right: Agent Chat + Broadcast List */}
        <div className="broadcast-main">
          {/* Agent Chat */}
          <GlassCard title="AI 智能助手" icon={<Bot size={18} />} accent="#8b5cf6" className="agent-chat-card">
            <div className="agent-chat-messages">
              {agentMessages.length === 0 && (
                <div className="empty-state">
                  <Bot size={40} />
                  <p>向 AI 助手发送指令</p>
                  <small>例如："导航到最近的地铁站"、"前方有什么障碍物"</small>
                  <div className="quick-commands">
                    {['导航到最近地铁站', '前方有什么', '查询电量', '紧急求助'].map((cmd) => (
                      <button key={cmd} className="quick-cmd" onClick={() => sendToAgent(cmd)}>
                        {cmd}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              <AnimatePresence>
                {agentMessages.map((msg) => (
                  <motion.div key={msg.id} className={`agent-msg ${msg.role}`}
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                    <div className="agent-msg-header">
                      <span className="agent-msg-role">
                        {msg.role === 'user' ? '👤 用户' : msg.role === 'assistant' ? '🤖 AI助手' : '⚙️ 系统'}
                      </span>
                      <span className="agent-msg-time">
                        {new Date(msg.timestamp).toLocaleTimeString('zh-CN', {
                          hour: '2-digit', minute: '2-digit', second: '2-digit',
                        })}
                      </span>
                    </div>
                    <p className="agent-msg-text">{msg.content}</p>
                    {msg.agentResponse && (
                      <div className="agent-msg-meta">
                        <span className="agent-action-badge"
                          style={{ color: actionColorMap[msg.agentResponse.action] || '#8b5cf6' }}>
                          {msg.agentResponse.action}
                        </span>
                        <span className="agent-conf">
                          置信度: {(msg.agentResponse.confidence * 100).toFixed(0)}%
                        </span>
                        <button className="expand-btn"
                          onClick={() => setExpandedMsg(expandedMsg === msg.id ? null : msg.id)}>
                          {expandedMsg === msg.id ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                          JSON
                        </button>
                        {msg.role === 'assistant' && (
                          <button className="agent-play-btn" onClick={() => speak(msg.content)}>
                            <Play size={12} /> 播放
                          </button>
                        )}
                      </div>
                    )}
                    <AnimatePresence>
                      {expandedMsg === msg.id && msg.agentRequest && (
                        <motion.pre className="agent-json"
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}>
                          <code>{JSON.stringify({ request: msg.agentRequest, response: msg.agentResponse }, null, 2)}</code>
                        </motion.pre>
                      )}
                    </AnimatePresence>
                  </motion.div>
                ))}
              </AnimatePresence>
              {agentLoading && (
                <motion.div className="agent-msg assistant loading"
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <Loader2 size={16} className="spin" /> AI 思考中...
                </motion.div>
              )}
              <div ref={chatEndRef} />
            </div>
            <div className="agent-chat-input">
              <input type="text" placeholder="输入语音指令或问题..."
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && sendToAgent(chatInput)}
                disabled={agentLoading} />
              <button onClick={() => sendToAgent(chatInput)} disabled={agentLoading || !chatInput.trim()}>
                {agentLoading ? <Loader2 size={16} className="spin" /> : <Send size={16} />}
              </button>
            </div>
          </GlassCard>

          {/* Broadcast List */}
          <GlassCard title="播报记录" icon={<Volume2 size={18} />} accent="#06b6d4"
            className="broadcast-list-card"
            headerRight={
              <div className="filter-tabs">
                {(['all', 'navigation', 'alert', 'info'] as const).map((f) => (
                  <button key={f} className={`filter-tab ${filter === f ? 'active' : ''}`}
                    onClick={() => setFilter(f)}>
                    {f === 'all' ? '全部' : typeConfig[f].label}
                  </button>
                ))}
              </div>
            }>
            {filteredBroadcasts.length === 0 ? (
              <div className="empty-state">
                <Volume2 size={40} />
                <p>暂无播报记录</p>
              </div>
            ) : (
              <div className="broadcast-list">
                <AnimatePresence>
                  {filteredBroadcasts.map((b) => {
                    const cfg = typeConfig[b.type];
                    const Icon = cfg.icon;
                    return (
                      <motion.div className={`broadcast-item ${b.type}`} key={b.id}
                        initial={{ opacity: 0, x: 20, height: 0 }}
                        animate={{ opacity: 1, x: 0, height: 'auto' }}
                        exit={{ opacity: 0, x: -20, height: 0 }}
                        transition={{ duration: 0.3 }} layout>
                        <div className="bi-icon" style={{ backgroundColor: `${cfg.color}20`, color: cfg.color }}>
                          <Icon size={18} />
                        </div>
                        <div className="bi-content">
                          <span className="bi-text">{b.text}</span>
                          <div className="bi-meta">
                            <span className="bi-type" style={{ color: cfg.color }}>{cfg.emoji} {cfg.label}</span>
                            <span className="bi-time">
                              {new Date(b.timestamp).toLocaleTimeString('zh-CN', {
                                hour: '2-digit', minute: '2-digit', second: '2-digit',
                              })}
                            </span>
                          </div>
                        </div>
                        <div className="bi-actions">
                          <button className="bi-play" onClick={() => speak(b.text)} title="播放">
                            {isSpeaking ? <Pause size={14} /> : <Play size={14} />}
                          </button>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            )}
          </GlassCard>
        </div>
      </div>
    </div>
  );
}
