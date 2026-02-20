import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mic,
  MicOff,
  MessageSquare,
  Command,
  Volume2,
  AudioLines,
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import GlassCard from '../components/GlassCard';

// 模拟ASR处理函数
async function simulateASR(audioBlob: Blob): Promise<{ text: string; confidence: number }> {
  // Placeholder: 实际项目中接入 Web Speech API 或 Whisper/Vosk 等 ASR 库
  console.log('Processing audio blob:', audioBlob.size, 'bytes');
  const commands = [
    '导航到最近的地铁站',
    '当前位置在哪里',
    '前方有什么障碍物',
    '停止导航',
    '播报当前路况',
  ];
  await new Promise((r) => setTimeout(r, 800));
  return {
    text: commands[Math.floor(Math.random() * commands.length)],
    confidence: 0.7 + Math.random() * 0.29,
  };
}

export default function VoiceControl() {
  const isListening = useAppStore((s) => s.isListening);
  const setListening = useAppStore((s) => s.setListening);
  const asrResults = useAppStore((s) => s.asrResults);
  const addASRResult = useAppStore((s) => s.addASRResult);
  const [processing, setProcessing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const [waveAmplitude, setWaveAmplitude] = useState<number[]>(
    Array.from({ length: 32 }, () => 0)
  );

  const startListening = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      // Visualize audio
      const audioCtx = new AudioContext();
      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 64;
      source.connect(analyser);

      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      const updateWave = () => {
        if (!mediaRecorderRef.current || mediaRecorderRef.current.state !== 'recording') return;
        analyser.getByteFrequencyData(dataArray);
        setWaveAmplitude(Array.from(dataArray));
        requestAnimationFrame(updateWave);
      };

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        audioCtx.close();
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        setProcessing(true);
        try {
          const result = await simulateASR(blob);
          addASRResult({
            text: result.text,
            confidence: result.confidence,
            timestamp: Date.now(),
            isCommand: true,
          });
        } finally {
          setProcessing(false);
        }
      };

      mediaRecorder.start();
      setListening(true);
      updateWave();
    } catch {
      console.warn('Microphone access denied, using mock data');
      // Fallback: simulate
      setListening(true);
      const mockWave = () => {
        if (!useAppStore.getState().isListening) return;
        setWaveAmplitude(
          Array.from({ length: 32 }, () => Math.random() * 200)
        );
        requestAnimationFrame(mockWave);
      };
      mockWave();

      setTimeout(() => {
        stopListening();
      }, 3000);
    }
  }, [addASRResult, setListening]);

  const stopListening = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    } else {
      // Mock mode
      setProcessing(true);
      setTimeout(() => {
        const commands = [
          '导航到最近的地铁站',
          '当前位置在哪里',
          '前方有什么障碍物',
        ];
        addASRResult({
          text: commands[Math.floor(Math.random() * commands.length)],
          confidence: 0.7 + Math.random() * 0.29,
          timestamp: Date.now(),
          isCommand: true,
        });
        setProcessing(false);
      }, 800);
    }
    setListening(false);
    setWaveAmplitude(Array.from({ length: 32 }, () => 0));
  }, [addASRResult, setListening]);

  return (
    <div className="voice-page">
      <div className="voice-grid">
        {/* Recording Section */}
        <GlassCard
          title="语音识别"
          icon={<Mic size={18} />}
          accent="#8b5cf6"
          className="voice-recorder"
        >
          <div className="recorder-area">
            {/* Waveform Visualization */}
            <div className="waveform-container">
              {waveAmplitude.map((amp, i) => (
                <motion.div
                  key={i}
                  className="wave-bar"
                  animate={{
                    height: isListening ? Math.max(4, amp * 0.4) : 4,
                    backgroundColor: isListening
                      ? `hsl(${260 + amp * 0.3}, 80%, 60%)`
                      : 'rgba(255,255,255,0.2)',
                  }}
                  transition={{ duration: 0.1 }}
                />
              ))}
            </div>

            {/* Record Button */}
            <div className="record-btn-area">
              <motion.button
                className={`record-btn ${isListening ? 'recording' : ''} ${processing ? 'processing' : ''}`}
                onClick={isListening ? stopListening : startListening}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                disabled={processing}
              >
                <motion.div
                  className="record-btn-inner"
                  animate={{
                    scale: isListening ? [1, 1.2, 1] : 1,
                    boxShadow: isListening
                      ? [
                          '0 0 0 0 rgba(139,92,246,0.4)',
                          '0 0 0 20px rgba(139,92,246,0)',
                          '0 0 0 0 rgba(139,92,246,0.4)',
                        ]
                      : '0 0 0 0 rgba(139,92,246,0)',
                  }}
                  transition={{ repeat: isListening ? Infinity : 0, duration: 1.5 }}
                >
                  {processing ? (
                    <div className="spinner" />
                  ) : isListening ? (
                    <MicOff size={32} />
                  ) : (
                    <Mic size={32} />
                  )}
                </motion.div>
              </motion.button>
              <p className="record-hint">
                {processing
                  ? '识别中...'
                  : isListening
                    ? '正在录音，点击停止'
                    : '点击开始语音输入'}
              </p>
            </div>

            {/* ASR Info */}
            <div className="asr-info">
              <div className="asr-info-item">
                <AudioLines size={16} />
                <span>ASR 引擎: Web Speech API / Whisper (预留接口)</span>
              </div>
              <div className="asr-info-item">
                <Command size={16} />
                <span>支持语音指令: 导航、查询、紧急求助等</span>
              </div>
            </div>
          </div>
        </GlassCard>

        {/* Results */}
        <GlassCard
          title="识别历史"
          icon={<MessageSquare size={18} />}
          accent="#06b6d4"
          className="voice-results"
          headerRight={
            <span className="result-count">{asrResults.length} 条记录</span>
          }
        >
          {asrResults.length === 0 ? (
            <div className="empty-state">
              <Volume2 size={40} />
              <p>暂无识别记录</p>
              <small>开始录音后将显示语音识别结果</small>
            </div>
          ) : (
            <div className="asr-list">
              <AnimatePresence>
                {asrResults.map((r, i) => (
                  <motion.div
                    className={`asr-item ${r.isCommand ? 'command' : 'text'}`}
                    key={`${r.timestamp}-${i}`}
                    initial={{ opacity: 0, x: 30, height: 0 }}
                    animate={{ opacity: 1, x: 0, height: 'auto' }}
                    exit={{ opacity: 0, x: -30 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="asr-item-icon">
                      {r.isCommand ? (
                        <Command size={16} />
                      ) : (
                        <MessageSquare size={16} />
                      )}
                    </div>
                    <div className="asr-item-content">
                      <span className="asr-text">{r.text}</span>
                      <div className="asr-meta">
                        <span className="asr-conf">
                          置信度: {(r.confidence * 100).toFixed(1)}%
                        </span>
                        <span className="asr-time">
                          {new Date(r.timestamp).toLocaleTimeString('zh-CN')}
                        </span>
                      </div>
                    </div>
                    {r.isCommand && (
                      <span className="command-badge">指令</span>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </GlassCard>
      </div>
    </div>
  );
}
