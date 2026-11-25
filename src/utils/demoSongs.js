// Menghasilkan file audio WAV murni secara offline (data URI) untuk uji coba player
const createToneWavDataUri = (frequencies, durationSec = 12) => {
  const sampleRate = 22050;
  const numSamples = sampleRate * durationSec;
  const buffer = new ArrayBuffer(44 + numSamples * 2);
  const view = new DataView(buffer);

  const writeString = (offset, str) => {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  };

  // WAV Header
  writeString(0, 'RIFF');
  view.setUint32(4, 36 + numSamples * 2, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, 1, true); // Mono
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeString(36, 'data');
  view.setUint32(40, numSamples * 2, true);

  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    const noteIndex = Math.floor(t * 2) % frequencies.length;
    const freq = frequencies[noteIndex];
    const noteTime = (t * 2) % 1;
    const envelope = Math.exp(-noteTime * 3.5);
    const wave =
      Math.sin(2 * Math.PI * freq * t) * 0.6 +
      Math.sin(2 * Math.PI * (freq * 0.5) * t) * 0.3;
    const sample = Math.max(-1, Math.min(1, wave * envelope * 0.5));
    view.setInt16(44 + i * 2, sample * 32767, true);
  }

  // Konversi ArrayBuffer ke Base64
  const bytes = new Uint8Array(buffer);
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  let base64 = '';
  for (let i = 0; i < bytes.length; i += 3) {
    const b1 = bytes[i];
    const b2 = i + 1 < bytes.length ? bytes[i + 1] : 0;
    const b3 = i + 2 < bytes.length ? bytes[i + 2] : 0;
    base64 += chars[b1 >> 2];
    base64 += chars[((b1 & 3) << 4) | (b2 >> 4)];
    base64 += i + 1 < bytes.length ? chars[((b2 & 15) << 2) | (b3 >> 6)] : '=';
    base64 += i + 2 < bytes.length ? chars[b3 & 63] : '=';
  }

  return `data:audio/wav;base64,${base64}`;
};

export const generateDemoSongs = () => [
  {
    id: 'demo_1',
    title: 'Midnight Lo-Fi Chill (Demo Track)',
    filename: 'Midnight_LoFi_Chill.wav',
    uri: createToneWavDataUri([261.63, 329.63, 392.0, 493.88, 392.0, 329.63], 10),
    size: 3420500,
    mimeType: 'audio/wav',
    createdAt: new Date().toISOString(),
    duration: 10000,
  },
  {
    id: 'demo_2',
    title: 'Sunset Acoustic Breeze (Demo Track)',
    filename: 'Sunset_Acoustic_Breeze.wav',
    uri: createToneWavDataUri([293.66, 369.99, 440.0, 587.33, 440.0, 369.99], 10),
    size: 4180200,
    mimeType: 'audio/wav',
    createdAt: new Date().toISOString(),
    duration: 10000,
  },
  {
    id: 'demo_3',
    title: 'Cyberpunk Night Drive (Demo Track)',
    filename: 'Cyberpunk_Night_Drive.wav',
    uri: createToneWavDataUri([220.0, 261.63, 329.63, 440.0, 392.0, 329.63], 10),
    size: 5120000,
    mimeType: 'audio/wav',
    createdAt: new Date().toISOString(),
    duration: 10000,
  },
];
