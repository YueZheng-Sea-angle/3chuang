import { create } from 'zustand';
import type {
  CaneData,
  ObstacleDetection,
  ASRResult,
  NavigationInfo,
  VoiceBroadcast,
  DistanceRecord,
  AgentMessage,
} from '../types';
import type { LLMConfig } from '../services/llmAgent';
import { DEFAULT_LLM_CONFIG } from '../services/llmAgent';
import { generateMockCaneData, generateMockObstacles, generateMockASR, generateMockNavigation, generateMockBroadcast } from './mockData';

interface AppState {
  // 盲杖核心数据
  caneData: CaneData;
  distanceHistory: DistanceRecord[];

  // 障碍物检测 (ML placeholder)
  obstacles: ObstacleDetection[];

  // ASR 语音识别
  asrResults: ASRResult[];
  isListening: boolean;

  // 导航
  navigation: NavigationInfo | null;
  isNavigating: boolean;

  // 语音播报
  broadcasts: VoiceBroadcast[];
  isSpeaking: boolean;

  // 智能体 (LLM Agent)
  agentMessages: AgentMessage[];
  agentLoading: boolean;
  llmConfig: LLMConfig;

  // 模拟数据控制
  isSimulating: boolean;

  // Actions
  updateCaneData: (data: CaneData) => void;
  addDistanceRecord: (record: DistanceRecord) => void;
  setObstacles: (obs: ObstacleDetection[]) => void;
  addASRResult: (result: ASRResult) => void;
  setListening: (v: boolean) => void;
  setNavigation: (nav: NavigationInfo | null) => void;
  setIsNavigating: (v: boolean) => void;
  addBroadcast: (b: VoiceBroadcast) => void;
  markBroadcastPlayed: (id: string) => void;
  setIsSpeaking: (v: boolean) => void;
  addAgentMessage: (m: AgentMessage) => void;
  setAgentLoading: (v: boolean) => void;
  updateLLMConfig: (config: Partial<LLMConfig>) => void;
  toggleSimulation: () => void;
  simulateTick: () => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  caneData: generateMockCaneData(),
  distanceHistory: [],
  obstacles: [],
  asrResults: [],
  isListening: false,
  navigation: null,
  isNavigating: false,
  broadcasts: [],
  isSpeaking: false,
  agentMessages: [],
  agentLoading: false,
  llmConfig: { ...DEFAULT_LLM_CONFIG },
  isSimulating: true,

  updateCaneData: (data) => set({ caneData: data }),

  addDistanceRecord: (record) =>
    set((s) => ({
      distanceHistory: [...s.distanceHistory.slice(-59), record],
    })),

  setObstacles: (obs) => set({ obstacles: obs }),

  addASRResult: (result) =>
    set((s) => ({
      asrResults: [result, ...s.asrResults].slice(0, 50),
    })),

  setListening: (v) => set({ isListening: v }),

  setNavigation: (nav) => set({ navigation: nav }),
  setIsNavigating: (v) => set({ isNavigating: v }),

  addBroadcast: (b) =>
    set((s) => ({
      broadcasts: [b, ...s.broadcasts].slice(0, 100),
    })),

  markBroadcastPlayed: (id) =>
    set((s) => ({
      broadcasts: s.broadcasts.map((b) =>
        b.id === id ? { ...b, played: true } : b
      ),
    })),

  setIsSpeaking: (v) => set({ isSpeaking: v }),

  addAgentMessage: (m) =>
    set((s) => ({
      agentMessages: [...s.agentMessages, m].slice(-200),
    })),

  setAgentLoading: (v) => set({ agentLoading: v }),

  updateLLMConfig: (config) =>
    set((s) => ({
      llmConfig: { ...s.llmConfig, ...config },
    })),

  toggleSimulation: () => set((s) => ({ isSimulating: !s.isSimulating })),

  simulateTick: () => {
    const state = get();
    if (!state.isSimulating) return;

    const newData = generateMockCaneData();
    const now = new Date();
    const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;

    set({
      caneData: newData,
    });

    state.addDistanceRecord({ time: timeStr, distance: newData.sensors.distance_cm });

    // 随机生成障碍物检测
    if (Math.random() > 0.6) {
      set({ obstacles: generateMockObstacles() });
    }

    // 随机生成 ASR 结果
    if (Math.random() > 0.85) {
      state.addASRResult(generateMockASR());
    }

    // 导航模拟
    if (state.isNavigating && !state.navigation) {
      set({ navigation: generateMockNavigation(newData.sensors.gps) });
    }

    // 语音播报
    if (Math.random() > 0.8) {
      state.addBroadcast(generateMockBroadcast(newData));
    }
  },
}));
