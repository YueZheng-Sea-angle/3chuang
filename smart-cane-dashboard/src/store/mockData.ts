import type {
  CaneData,
  ObstacleDetection,
  ASRResult,
  NavigationInfo,
  VoiceBroadcast,
  GPSCoord,
} from '../types';

// ==================== 工具函数 ====================
const rand = (min: number, max: number) =>
  Math.floor(Math.random() * (max - min + 1)) + min;
const randFloat = (min: number, max: number) =>
  Math.round((Math.random() * (max - min) + min) * 10000) / 10000;

let idCounter = 0;
const genId = () => `id_${Date.now()}_${++idCounter}`;

// 上海附近的坐标基准
const BASE_LAT = 31.2304;
const BASE_LNG = 121.4737;

// ==================== 模拟盲杖数据 ====================
export function generateMockCaneData(): CaneData {
  return {
    system: {
      battery: rand(20, 100),
      status: Math.random() > 0.05 ? 'online' : 'offline',
    },
    sensors: {
      distance_cm: rand(10, 400),
      fall_alert: Math.random() > 0.92,
      gps: {
        lat: randFloat(BASE_LAT - 0.005, BASE_LAT + 0.005),
        lng: randFloat(BASE_LNG - 0.005, BASE_LNG + 0.005),
      },
    },
    streams: {
      video_url: 'http://192.168.1.100:8080/?action=stream',
      audio_url: 'http://192.168.1.100:8081/audio.wav',
    },
  };
}

// ==================== 模拟障碍物检测 ====================
const OBSTACLE_LABELS = [
  '行人', '自行车', '汽车', '电线杆', '台阶', '栏杆',
  '垃圾桶', '路锥', '消防栓', '树木', '石墩', '长椅',
];

export function generateMockObstacles(): ObstacleDetection[] {
  const count = rand(1, 4);
  return Array.from({ length: count }, () => ({
    id: genId(),
    label: OBSTACLE_LABELS[rand(0, OBSTACLE_LABELS.length - 1)],
    confidence: randFloat(0.6, 0.99),
    distance_cm: rand(30, 300),
    bbox: {
      x: rand(50, 400),
      y: rand(50, 300),
      w: rand(40, 200),
      h: rand(40, 200),
    },
  }));
}

// ==================== 模拟 ASR 语音识别 ====================
const ASR_COMMANDS = [
  { text: '导航到最近的地铁站', isCommand: true },
  { text: '当前位置在哪里', isCommand: true },
  { text: '前方有什么障碍物', isCommand: true },
  { text: '停止导航', isCommand: true },
  { text: '播报当前路况', isCommand: true },
  { text: '紧急求助', isCommand: true },
  { text: '导航到人民广场', isCommand: true },
  { text: '查询电量', isCommand: true },
  { text: '你好', isCommand: false },
  { text: '谢谢', isCommand: false },
  { text: '今天天气怎么样', isCommand: false },
];

export function generateMockASR(): ASRResult {
  const cmd = ASR_COMMANDS[rand(0, ASR_COMMANDS.length - 1)];
  return {
    text: cmd.text,
    confidence: randFloat(0.7, 0.99),
    timestamp: Date.now(),
    isCommand: cmd.isCommand,
  };
}

// ==================== 模拟导航路线 ====================
export function generateMockNavigation(origin: GPSCoord): NavigationInfo {
  const dest: GPSCoord = {
    lat: randFloat(origin.lat + 0.002, origin.lat + 0.01),
    lng: randFloat(origin.lng + 0.002, origin.lng + 0.01),
  };

  const steps = rand(4, 8);
  const route = Array.from({ length: steps }, (_, i) => {
    const t = i / (steps - 1);
    return {
      lat: origin.lat + (dest.lat - origin.lat) * t + randFloat(-0.001, 0.001),
      lng: origin.lng + (dest.lng - origin.lng) * t + randFloat(-0.001, 0.001),
      instruction: [
        '直行100米',
        '左转进入南京路',
        '直行200米',
        '右转进入西藏路',
        '直行150米',
        '到达目的地左侧',
        '经过人行横道',
        '注意前方路口',
      ][i % 8],
    };
  });

  return {
    origin,
    destination: dest,
    route,
    distance_m: rand(200, 2000),
    duration_s: rand(180, 1800),
    currentStep: route[0].instruction || '出发',
  };
}

// ==================== 模拟语音播报 ====================
export function generateMockBroadcast(caneData: CaneData): VoiceBroadcast {
  const types: Array<'navigation' | 'alert' | 'info'> = ['navigation', 'alert', 'info'];
  const type = types[rand(0, 2)];

  const texts: Record<string, string[]> = {
    navigation: [
      '前方50米左转',
      '继续直行200米',
      '即将到达目的地',
      '前方路口右转',
      '经过人行横道，注意安全',
    ],
    alert: [
      `前方${caneData.sensors.distance_cm}厘米处检测到障碍物`,
      '检测到跌倒风险，请注意',
      '电量不足，请及时充电',
      '前方有台阶，请小心',
      '警告：前方障碍物距离过近',
    ],
    info: [
      `当前电量${caneData.system.battery}%`,
      '设备运行正常',
      `当前GPS坐标：${caneData.sensors.gps.lat.toFixed(4)}, ${caneData.sensors.gps.lng.toFixed(4)}`,
      '已连接服务器',
      '传感器校准完成',
    ],
  };

  const textArr = texts[type];
  return {
    id: genId(),
    text: textArr[rand(0, textArr.length - 1)],
    type,
    timestamp: Date.now(),
    played: false,
  };
}
