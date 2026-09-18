/**
 * Нативный модуль распознавания речи (Web Speech Recognition API)
 * Позволяет диктовать текст голосом на русском или китайском языке без сторонних сервисов.
 */

// Типизация для браузерного API WebkitSpeechRecognition
type SpeechRecognitionInstance = any;

let currentRecognition: SpeechRecognitionInstance | null = null;

export function isVoiceInputSupported(): boolean {
  if (typeof window === 'undefined') return false;
  return 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
}

export interface VoiceInputOptions {
  lang: 'ru' | 'zh';
  onResult: (transcript: string) => void;
  onError?: (error: string) => void;
  onStart?: () => void;
  onEnd?: () => void;
}

/**
 * Запуск голосового ввода через микрофон
 */
export function startVoiceRecognition(options: VoiceInputOptions): () => void {
  if (!isVoiceInputSupported()) {
    options.onError?.('Голосовой ввод не поддерживается данным браузером (рекомендуется Chrome / Edge / Safari).');
    return () => {};
  }

  // Если уже слушаем — останавливаем предыдущую сессию
  stopVoiceRecognition();

  try {
    const SpeechRecognitionClass =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition: SpeechRecognitionInstance = new SpeechRecognitionClass();

    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = options.lang === 'zh' ? 'zh-CN' : 'ru-RU';
    recognition.maxAlternatives = 1;

    let finalTranscript = '';

    recognition.onstart = () => {
      options.onStart?.();
    };

    recognition.onresult = (event: any) => {
      let interim = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        const item = event.results[i];
        if (item.isFinal) {
          finalTranscript += item[0].transcript;
        } else {
          interim += item[0].transcript;
        }
      }
      const combined = (finalTranscript || interim).trim();
      if (combined) {
        options.onResult(combined);
      }
    };

    recognition.onerror = (event: any) => {
      console.warn('[Voice Recognition Error]:', event.error);
      if (event.error === 'not-allowed') {
        options.onError?.('Доступ к микрофону заблокирован. Разрешите микрофон в настройках браузера.');
      } else if (event.error !== 'no-speech') {
        options.onError?.(`Ошибка микрофона: ${event.error}`);
      }
      options.onEnd?.();
    };

    recognition.onend = () => {
      currentRecognition = null;
      options.onEnd?.();
    };

    currentRecognition = recognition;
    recognition.start();

    return () => {
      stopVoiceRecognition();
    };
  } catch (err: any) {
    options.onError?.(`Не удалось запустить микрофон: ${err.message || err}`);
    options.onEnd?.();
    return () => {};
  }
}

/**
 * Остановка текущего голосового ввода
 */
export function stopVoiceRecognition(): void {
  if (currentRecognition) {
    try {
      currentRecognition.stop();
    } catch {
      // ignore
    }
    currentRecognition = null;
  }
}
