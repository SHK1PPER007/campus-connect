import React, { useState, useEffect } from 'react';
import { X, Sparkles, Key, Check, AlertCircle, ExternalLink, ShieldCheck, RefreshCw } from 'lucide-react';
import { AiConfig, getAiConfig, saveAiConfig, testAiConnection } from '../services/aiServices';

interface AiSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfigSaved?: () => void;
  activeLanguage?: 'ru' | 'zh';
}

export const AiSettingsModal: React.FC<AiSettingsModalProps> = ({
  isOpen,
  onClose,
  onConfigSaved,
  activeLanguage = 'ru',
}) => {
  const [apiKey, setApiKey] = useState('');
  const [model, setModel] = useState('deepseek-ai/DeepSeek-V4-Flash-0731');
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
    preview?: string;
  } | null>(null);
  const [isSaved, setIsSaved] = useState(false);

  const isZh = activeLanguage === 'zh';

  useEffect(() => {
    if (isOpen) {
      const config = getAiConfig();
      setApiKey(config.apiKey || '');
      setModel(config.model || 'deepseek-ai/DeepSeek-V4-Flash-0731');
      setTestResult(null);
      setIsSaved(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleTest = async () => {
    setIsTesting(true);
    setTestResult(null);

    const config: AiConfig = {
      provider: 'huggingface',
      apiKey: apiKey.trim(),
      model: model.trim(),
    };

    const res = await testAiConnection(config);
    setTestResult(res);
    setIsTesting(false);
  };

  const handleSave = () => {
    const config: AiConfig = {
      provider: apiKey.trim() ? 'huggingface' : 'mock',
      apiKey: apiKey.trim(),
      model: model.trim() || 'deepseek-ai/DeepSeek-V4-Flash-0731',
    };

    saveAiConfig(config);
    setIsSaved(true);
    if (onConfigSaved) onConfigSaved();
    setTimeout(() => {
      onClose();
    }, 600);
  };

  const handleClear = () => {
    setApiKey('');
    saveAiConfig({
      provider: 'mock',
      apiKey: '',
      model: 'deepseek-ai/DeepSeek-V4-Flash-0731',
    });
    setTestResult({
      success: true,
      message: isZh ? '已清除密钥并启用极速本地模拟模式。' : 'Ключ удален. Включен быстрый локальный мок-режим.',
    });
    if (onConfigSaved) onConfigSaved();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-campus-surface border-2 border-campus-border shadow-brutal-lg w-full max-w-lg max-h-[92vh] flex flex-col overflow-hidden">
        
        {/* Шапка */}
        <div className="flex items-center justify-between p-3.5 sm:p-4 border-b border-campus-border bg-campus-bg">
          <div className="flex items-center space-x-2">
            <div className="w-3.5 h-3.5 bg-campus-ai"></div>
            <div>
              <h2 className="font-mono font-bold text-xs sm:text-sm uppercase tracking-tight text-campus-text">
                {isZh ? 'Hugging Face AI 模型配置' : 'Подключение Hugging Face API'}
              </h2>
              <p className="text-[10px] font-mono text-campus-subtle">
                {isZh ? '端到端直连 DeepSeek-V4，支持中俄互译与智能总结' : 'Inference API для синхронного перевода тредов'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-campus-surface border border-transparent hover:border-campus-border transition-colors cursor-pointer"
            title={isZh ? '关闭' : 'Закрыть'}
          >
            <X className="w-4 h-4 text-campus-text" />
          </button>
        </div>

        {/* Форма */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1">
          
          {/* Поле токена */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-mono font-bold uppercase text-campus-text flex items-center gap-1">
                <Key className="w-3.5 h-3.5 text-campus-action" />
                <span>Hugging Face Token (hf_...)</span>
              </label>
              <a
                href="https://huggingface.co/settings/tokens"
                target="_blank"
                rel="noreferrer"
                className="text-[11px] font-mono text-campus-action hover:underline flex items-center gap-0.5"
              >
                <span>{isZh ? '免费获取密钥' : 'Получить бесплатно'}</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="hf_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
              className="w-full px-3 py-2 text-xs font-mono border border-campus-border bg-campus-bg text-campus-text focus:outline-none focus:ring-1 focus:ring-campus-action shadow-brutal-xs"
            />
            <p className="text-[10px] font-mono text-campus-subtle mt-1">
              {isZh
                ? '密钥仅保存在您的浏览器本地 localStorage 中，安全保密。'
                : 'Токен сохраняется в браузере и используется для отправки запросов.'}
            </p>
          </div>

          {/* Выбор модели */}
          <div>
            <label className="block text-xs font-mono font-bold uppercase text-campus-text mb-1">
              {isZh ? 'AI 推理模型' : 'Модель нейросети'}
            </label>
            <select
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className="w-full px-3 py-2 text-xs font-mono border border-campus-border bg-white text-campus-text focus:outline-none focus:ring-1 focus:ring-campus-action shadow-brutal-xs cursor-pointer"
            >
              <option value="deepseek-ai/DeepSeek-V4-Flash-0731">
                deepseek-ai/DeepSeek-V4-Flash-0731 ({isZh ? '推荐 / 超快' : 'Рекомендуется / Быстро'})
              </option>
              <option value="deepseek-ai/DeepSeek-R1-Distill-Qwen-32B">
                deepseek-ai/DeepSeek-R1-Distill-Qwen-32B ({isZh ? '深度思考' : 'Глубокий анализ'})
              </option>
              <option value="Qwen/Qwen2.5-72B-Instruct">
                Qwen/Qwen2.5-72B-Instruct ({isZh ? '通义千问双语旗舰' : 'Флагман Qwen'})
              </option>
            </select>
          </div>

          {/* Кнопка проверки */}
          <div className="pt-1">
            <button
              type="button"
              onClick={handleTest}
              disabled={isTesting || !apiKey.trim()}
              className="w-full py-2 px-3 text-xs font-mono font-bold border border-campus-border bg-campus-bg hover:bg-white text-campus-text shadow-brutal-xs flex items-center justify-center gap-2 disabled:opacity-50 transition-all cursor-pointer"
            >
              {isTesting ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-campus-action" />
                  <span>{isZh ? '正在测试连接...' : 'Проверка соединения...'}</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5 text-campus-action" />
                  <span>{isZh ? '测试 API 连接与响应' : 'Проверить соединение с AI'}</span>
                </>
              )}
            </button>
          </div>

          {/* Результат теста */}
          {testResult && (
            <div
              className={`p-3 border text-xs font-mono space-y-1.5 ${
                testResult.success
                  ? 'bg-green-50 border-green-600 text-green-900'
                  : 'bg-red-50 border-red-600 text-red-900'
              }`}
            >
              <div className="flex items-center gap-1.5 font-bold">
                {testResult.success ? (
                  <Check className="w-4 h-4 text-green-700" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-red-700" />
                )}
                <span>{testResult.message}</span>
              </div>
              {testResult.preview && (
                <div className="mt-1 p-2 bg-white/80 border border-current text-[11px] font-sans">
                  <span className="font-bold font-mono block text-[10px] text-campus-subtle">
                    {isZh ? 'AI 翻译示例响应:' : 'Пример ответа модели:'}
                  </span>
                  {testResult.preview}
                </div>
              )}
            </div>
          )}

        </div>

        {/* Подвал */}
        <div className="flex items-center justify-between p-3.5 sm:p-4 border-t border-campus-border bg-campus-bg flex-shrink-0">
          <button
            type="button"
            onClick={handleClear}
            className="text-xs font-mono text-red-600 hover:underline cursor-pointer"
          >
            {isZh ? '清除密钥' : 'Сбросить ключ'}
          </button>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="btn-outline px-3 py-1.5 text-xs cursor-pointer"
            >
              {isZh ? '取消' : 'Отмена'}
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="btn-action px-4 py-1.5 text-xs flex items-center gap-1.5 font-bold cursor-pointer"
            >
              {isSaved ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>{isZh ? '已保存！' : 'Сохранено!'}</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>{isZh ? '保存配置' : 'Сохранить'}</span>
                </>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
