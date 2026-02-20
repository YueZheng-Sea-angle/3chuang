// ==================== 数据类型定义 ====================

/** 系统信息 */
export interface SystemInfo {
  battery: number;
  status: 'online' | 'offline' | 'error';
}

/** GPS 坐标 */
export interface GPSCoord {
  lat: number;
  lng: number;
}

/** 传感器数据 */
export interface SensorData {
  distance_cm: number;
  fall_alert: boolean;
  gps: GPSCoord;
}

/** 数据流 URL */
export interface StreamURLs {
  video_url: string;
  audio_url: string;
}

/** 盲杖完整数据 */
export interface CaneData {
  system: SystemInfo;
  sensors: SensorData;
  streams: StreamURLs;
}

/** 障碍物检测结果 (ML placeholder) */
export interface ObstacleDetection {
  id: string;
  label: string;
  confidence: number;
  distance_cm: number;
  bbox?: { x: number; y: number; w: number; h: number };
}

/** ASR 识别结果 */
export interface ASRResult {
  text: string;
  confidence: number;
  timestamp: number;
  isCommand: boolean;
}

/** 导航路线点 */
export interface RoutePoint {
  lat: number;
  lng: number;
  instruction?: string;
}

/** 导航信息 */
export interface NavigationInfo {
  origin: GPSCoord;
  destination: GPSCoord;
  route: RoutePoint[];
  distance_m: number;
  duration_s: number;
  currentStep: string;
}

/** 语音播报条目 */
export interface VoiceBroadcast {
  id: string;
  text: string;
  type: 'navigation' | 'alert' | 'info';
  timestamp: number;
  played: boolean;
}

// ==================== 智能体（LLM Agent）通信协议 ====================

/** 智能体请求：将设备上下文打包发给 LLM */
export interface AgentRequest {
  /** 请求唯一 ID */
  request_id: string;
  /** 时间戳 (ISO 8601) */
  timestamp: string;
  /** 用户意图 / 语音指令原文 */
  user_intent: string;
  /** 设备上下文快照 */
  device_context: {
    battery: number;
    status: string;
    gps: GPSCoord;
    distance_cm: number;
    fall_alert: boolean;
  };
  /** 最近的障碍物列表 */
  obstacles: Array<{
    label: string;
    distance_cm: number;
    confidence: number;
  }>;
  /** 当前导航信息（可选） */
  navigation?: {
    destination: string;
    remaining_distance_m: number;
    current_step: string;
  };
  /** 最近 ASR 识别文本列表 */
  recent_asr: string[];
}

/** 智能体响应：LLM 返回的结构化指令 */
export interface AgentResponse {
  request_id: string;
  timestamp: string;
  /** LLM 生成的播报文本 */
  speech_text: string;
  /** 响应类型 */
  action: 'navigate' | 'alert' | 'info' | 'emergency' | 'chat';
  /** 置信度 0-1 */
  confidence: number;
  /** 附加指令（可选） */
  directives?: AgentDirective[];
  /** LLM 原始推理（调试用） */
  reasoning?: string;
}

/** 智能体附加指令 */
export interface AgentDirective {
  type: 'set_destination' | 'trigger_alert' | 'adjust_speed' | 'call_emergency' | 'play_sound';
  params: Record<string, unknown>;
}

/** 智能体对话历史条目 */
export interface AgentMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  /** 关联的完整请求/响应（可折叠查看） */
  agentRequest?: AgentRequest;
  agentResponse?: AgentResponse;
}

/** 距离历史记录 */
export interface DistanceRecord {
  time: string;
  distance: number;
}
