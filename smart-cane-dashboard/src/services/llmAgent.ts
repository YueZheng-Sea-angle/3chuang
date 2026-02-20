/**
 * LLM 智能体服务
 * -----------------------------------------------
 * 职责：
 *   1. 将设备上下文打包为 AgentRequest JSON
 *   2. 调用 LLM API（当前为模拟，预留真实接口）
 *   3. 解析 AgentResponse 并返回
 * -----------------------------------------------
 * 未来接入方式：
 *   - 替换 mockLLMCall() 为真实 HTTP 请求即可
 *   - 支持 OpenAI / 通义千问 / 百度文心 / DeepSeek 等
 */

import type {
  AgentRequest,
  AgentResponse,
  AgentDirective,
  CaneData,
  ObstacleDetection,
  NavigationInfo,
  ASRResult,
} from '../types';

// ==================== 配置 ====================

export interface LLMConfig {
  /** API 基础地址，如 https://api.openai.com/v1 */
  baseUrl: string;
  /** API Key */
  apiKey: string;
  /** 模型名称，如 gpt-4o, qwen-turbo, deepseek-chat */
  model: string;
  /** 系统提示词 */
  systemPrompt: string;
  /** 请求超时 (ms) */
  timeout: number;
}

const DEFAULT_SYSTEM_PROMPT = `你是一位智能盲杖的AI导航助手。你的职责是：
1. 根据设备传感器数据（GPS位置、超声波距离、跌倒状态、电量）为视障用户提供安全出行指引
2. 结合障碍物检测结果，用简洁清晰的中文语音提示用户注意安全
3. 根据用户语音指令，提供导航、查询、紧急求助等服务
4. 所有回复必须简短（不超过50字）、清晰、适合语音播报

请以JSON格式回复，包含以下字段：
- speech_text: 播报给用户的文字
- action: navigate/alert/info/emergency/chat
- confidence: 0-1的置信度
- directives: 可选的附加指令数组
- reasoning: 你的推理过程（调试用）`;

export const DEFAULT_LLM_CONFIG: LLMConfig = {
  baseUrl: '',
  apiKey: '',
  model: 'mock',
  systemPrompt: DEFAULT_SYSTEM_PROMPT,
  timeout: 10000,
};

// ==================== 上下文打包 ====================

let requestCounter = 0;

export function buildAgentRequest(
  userIntent: string,
  caneData: CaneData,
  obstacles: ObstacleDetection[],
  navigation: NavigationInfo | null,
  recentASR: ASRResult[]
): AgentRequest {
  return {
    request_id: `req_${Date.now()}_${++requestCounter}`,
    timestamp: new Date().toISOString(),
    user_intent: userIntent,
    device_context: {
      battery: caneData.system.battery,
      status: caneData.system.status,
      gps: caneData.sensors.gps,
      distance_cm: caneData.sensors.distance_cm,
      fall_alert: caneData.sensors.fall_alert,
    },
    obstacles: obstacles.map((o) => ({
      label: o.label,
      distance_cm: o.distance_cm,
      confidence: o.confidence,
    })),
    navigation: navigation
      ? {
          destination: '目的地',
          remaining_distance_m: navigation.distance_m,
          current_step: navigation.currentStep,
        }
      : undefined,
    recent_asr: recentASR.slice(0, 5).map((a) => a.text),
  };
}

// ==================== 模拟 LLM 调用 ====================

const MOCK_RESPONSES: Array<{
  match: RegExp;
  speech: string;
  action: AgentResponse['action'];
  directives?: AgentDirective[];
}> = [
  {
    match: /导航|地铁|去|到/,
    speech: '好的，正在为您规划到最近地铁站的路线，预计步行8分钟',
    action: 'navigate',
    directives: [{ type: 'set_destination', params: { name: '最近地铁站' } }],
  },
  {
    match: /障碍|前方|什么/,
    speech: '前方约{distance}厘米处检测到障碍物，请注意绕行',
    action: 'alert',
  },
  {
    match: /位置|在哪|哪里/,
    speech: '您当前位于坐标{lat}, {lng}附近，GPS定位正常',
    action: 'info',
  },
  {
    match: /紧急|求助|帮助|救/,
    speech: '紧急求助已触发，正在通知紧急联系人并发送您的位置信息',
    action: 'emergency',
    directives: [{ type: 'call_emergency', params: { level: 'high' } }],
  },
  {
    match: /电量|电池|充电/,
    speech: '当前设备电量{battery}%，{batteryAdvice}',
    action: 'info',
  },
  {
    match: /停止|取消/,
    speech: '已停止当前导航，如需帮助请随时告诉我',
    action: 'info',
  },
  {
    match: /路况|路线|怎么走/,
    speech: '当前路线畅通，请继续沿当前方向前行，前方50米后左转',
    action: 'navigate',
  },
];

const FALLBACK_RESPONSES = [
  '好的，我了解了。如需导航或查询请告诉我目的地。',
  '收到，目前设备运行正常，前方道路畅通。',
  '我在这里，随时为您提供出行帮助。',
  '已记录您的请求，如有安全提示我会第一时间播报。',
];

async function mockLLMCall(request: AgentRequest): Promise<AgentResponse> {
  // 模拟网络延迟
  await new Promise((r) => setTimeout(r, 600 + Math.random() * 800));

  const intent = request.user_intent.toLowerCase();
  const ctx = request.device_context;

  // 匹配意图
  let matched = MOCK_RESPONSES.find((r) => r.match.test(intent));

  let speechText: string;
  let action: AgentResponse['action'];
  let directives: AgentDirective[] | undefined;

  if (matched) {
    speechText = matched.speech
      .replace('{distance}', String(ctx.distance_cm))
      .replace('{lat}', ctx.gps.lat.toFixed(4))
      .replace('{lng}', ctx.gps.lng.toFixed(4))
      .replace('{battery}', String(ctx.battery))
      .replace('{batteryAdvice}', ctx.battery < 30 ? '电量较低，建议尽快充电' : '电量充足');
    action = matched.action;
    directives = matched.directives;
  } else {
    speechText = FALLBACK_RESPONSES[Math.floor(Math.random() * FALLBACK_RESPONSES.length)];
    action = 'chat';
  }

  // 如果跌倒警报触发，优先返回紧急
  if (ctx.fall_alert) {
    speechText = '检测到跌倒！已自动触发紧急求助，请保持冷静，援助即将到达。';
    action = 'emergency';
    directives = [{ type: 'call_emergency', params: { reason: 'fall_detected' } }];
  }

  // 如果距离过近，附加安全提醒
  if (ctx.distance_cm < 50 && action !== 'emergency') {
    speechText = `注意！前方${ctx.distance_cm}厘米处有障碍物，请停步或绕行。` + speechText;
    action = 'alert';
  }

  return {
    request_id: request.request_id,
    timestamp: new Date().toISOString(),
    speech_text: speechText,
    action,
    confidence: 0.75 + Math.random() * 0.24,
    directives,
    reasoning: `[Mock] 匹配意图: "${intent}", 设备距离: ${ctx.distance_cm}cm, 电量: ${ctx.battery}%, 跌倒: ${ctx.fall_alert}`,
  };
}

// ==================== 真实 LLM 调用（预留） ====================

async function realLLMCall(request: AgentRequest, config: LLMConfig): Promise<AgentResponse> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), config.timeout);

  try {
    const response = await fetch(`${config.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify({
        model: config.model,
        messages: [
          { role: 'system', content: config.systemPrompt },
          {
            role: 'user',
            content: JSON.stringify(request, null, 2),
          },
        ],
        temperature: 0.3,
        max_tokens: 300,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`LLM API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';

    // 尝试解析 LLM 返回的 JSON
    try {
      const parsed = JSON.parse(content);
      return {
        request_id: request.request_id,
        timestamp: new Date().toISOString(),
        speech_text: parsed.speech_text || '抱歉，我没有理解您的意思。',
        action: parsed.action || 'chat',
        confidence: parsed.confidence || 0.5,
        directives: parsed.directives,
        reasoning: parsed.reasoning,
      };
    } catch {
      // LLM 返回非 JSON，直接作为播报文本
      return {
        request_id: request.request_id,
        timestamp: new Date().toISOString(),
        speech_text: content.slice(0, 200),
        action: 'chat',
        confidence: 0.5,
      };
    }
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

// ==================== 统一入口 ====================

export async function callAgent(
  request: AgentRequest,
  config: LLMConfig = DEFAULT_LLM_CONFIG
): Promise<AgentResponse> {
  if (!config.apiKey || config.model === 'mock') {
    return mockLLMCall(request);
  }
  return realLLMCall(request, config);
}
