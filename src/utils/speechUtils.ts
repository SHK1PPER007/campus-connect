export function isSpeechSupported(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
}

export function speakCampusText(text: string, lang: 'ru' | 'zh' = 'ru'): void {
  if (!isSpeechSupported()) {
    console.warn('Speech synthesis is not supported in this browser.');
    return;
  }

  window.speechSynthesis.cancel();

  const cleanText = text
    .replace(/\[.*?\]/g, '')
    .replace(/\(.*?\)/g, '')
    .replace(/[#*`]/g, '')
    .trim();

  if (!cleanText) return;

  const utterance = new SpeechSynthesisUtterance(cleanText);
  utterance.lang = lang === 'zh' ? 'zh-CN' : 'ru-RU';
  utterance.rate = 0.92;
  utterance.pitch = 1.0;

  const voices = window.speechSynthesis.getVoices();
  const targetLangPrefix = lang === 'zh' ? 'zh' : 'ru';
  const matchedVoice = voices.find((v) => v.lang.toLowerCase().startsWith(targetLangPrefix));
  if (matchedVoice) {
    utterance.voice = matchedVoice;
  }

  window.speechSynthesis.speak(utterance);
}

export function stopSpeaking(): void {
  if (isSpeechSupported()) {
    window.speechSynthesis.cancel();
  }
}
