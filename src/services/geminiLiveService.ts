import { GoogleGenAI, LiveServerMessage, Modality } from "@google/genai";

export class GeminiLiveService {
  private ai: GoogleGenAI;
  private session: any;
  private audioContext: AudioContext | null = null;
  private nextStartTime: number = 0;
  private isConnected: boolean = false;

  constructor() {
    this.ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }

  async connect(callbacks: {
    onOpen?: () => void;
    onMessage?: (message: LiveServerMessage) => void;
    onError?: (error: any) => void;
    onClose?: () => void;
    onTranscription?: (text: string, isModel: boolean) => void;
  }) {
    if (this.isConnected) return;

    try {
      this.session = await this.ai.live.connect({
        model: "gemini-2.5-flash-native-audio-preview-12-2025",
        callbacks: {
          onopen: () => {
            this.isConnected = true;
            this.setupAudioInput();
            callbacks.onOpen?.();
          },
          onmessage: async (message: LiveServerMessage) => {
            if (message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data) {
              const base64Audio = message.serverContent.modelTurn.parts[0].inlineData.data;
              this.playAudio(base64Audio);
            }

            if (message.serverContent?.interrupted) {
              this.stopAudio();
            }

            if (message.serverContent?.modelTurn?.parts?.[0]?.text) {
              callbacks.onTranscription?.(message.serverContent.modelTurn.parts[0].text, true);
            }

            callbacks.onMessage?.(message);
          },
          onerror: (error) => {
            console.error("Gemini Live Error:", error);
            callbacks.onError?.(error);
          },
          onclose: () => {
            this.isConnected = false;
            callbacks.onClose?.();
          },
        },
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: "Zephyr" } },
          },
          systemInstruction: "You are the Luxa Wach Concierge. You are sophisticated, knowledgeable about luxury watches, and helpful. You help users find timepieces, explain complications, and provide bespoke service advice.",
        },
      });
    } catch (error) {
      console.error("Failed to connect to Gemini Live:", error);
      throw error;
    }
  }

  private async setupAudioInput() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.audioContext = new AudioContext({ sampleRate: 16000 });
      const source = this.audioContext.createMediaStreamSource(stream);
      const processor = this.audioContext.createScriptProcessor(4096, 1, 1);

      source.connect(processor);
      processor.connect(this.audioContext.destination);

      processor.onaudioprocess = (e) => {
        if (!this.isConnected) return;
        const inputData = e.inputBuffer.getChannelData(0);
        const pcmData = this.floatTo16BitPCM(inputData);
        const base64Data = btoa(String.fromCharCode(...new Uint8Array(pcmData.buffer)));
        
        this.session.sendRealtimeInput({
          audio: { data: base64Data, mimeType: 'audio/pcm;rate=16000' }
        });
      };
    } catch (error) {
      console.error("Error setting up audio input:", error);
    }
  }

  private floatTo16BitPCM(input: Float32Array) {
    const output = new Int16Array(input.length);
    for (let i = 0; i < input.length; i++) {
      const s = Math.max(-1, Math.min(1, input[i]));
      output[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
    }
    return output;
  }

  private async playAudio(base64Data: string) {
    if (!this.audioContext) return;
    
    const binaryString = atob(base64Data);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    
    const pcmData = new Int16Array(bytes.buffer);
    const floatData = new Float32Array(pcmData.length);
    for (let i = 0; i < pcmData.length; i++) {
      floatData[i] = pcmData[i] / 32768.0;
    }

    const buffer = this.audioContext.createBuffer(1, floatData.length, 24000);
    buffer.getChannelData(0).set(floatData);

    const source = this.audioContext.createBufferSource();
    source.buffer = buffer;
    source.connect(this.audioContext.destination);

    const currentTime = this.audioContext.currentTime;
    if (this.nextStartTime < currentTime) {
      this.nextStartTime = currentTime;
    }
    source.start(this.nextStartTime);
    this.nextStartTime += buffer.duration;
  }

  private stopAudio() {
    // Basic implementation to stop audio playback
    this.nextStartTime = 0;
  }

  disconnect() {
    this.isConnected = false;
    this.session?.close();
    this.audioContext?.close();
  }
}
