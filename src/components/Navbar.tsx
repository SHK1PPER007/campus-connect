import React, { useState, useEffect } from 'react';
import { Sparkles, Plus, BookOpen, Globe2, Key, CheckCircle2, MessageSquare, Shield } from 'lucide-react';
import { CURRENT_USER } from '../mock/mockData';
import { User } from '../types/schema';
import { getAiConfig } from '../services/aiServices';
import { NavTab } from './Sidebar';

interface NavbarProps {
  onOpenCreateModal: () => void;
  onOpenGlossaryModal: () => void;
  onOpenAiSettings: () => void;
  activeLanguage: 'ru' | 'zh';
  onToggleLanguage: () => void;
  currentUser?: User;
  onOpenProfile?: () => void;
  currentTab?: NavTab;
  onSelectTab?: (tab: NavTab) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenCreateModal,
  onOpenGlossaryModal,
  onOpenAiSettings,
  activeLanguage,
  onToggleLanguage,
  currentUser = CURRENT_USER,
  onOpenProfile,
  currentTab = 'feed',
  onSelectTab,
}) => {
  const [hasApiKey, setHasApiKey] = useState(false);

  useEffect(() => {
    const config = getAiConfig();
    setHasApiKey(Boolean(config.apiKey && config.apiKey.trim().startsWith('hf_')));
  }, []);

  const isZh = activeLanguage === 'zh';

  return (
    <header className="sticky top-0 z-40 w-full bg-campus-surface border-b border-campus-border shadow-brutal-sm">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-14 sm:h-16 flex items-center justify-between">
        
        {/* Логотип */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-campus-action border border-campus-border flex items-center justify-center font-mono font-black text-white text-base sm:text-xl shadow-brutal-xs sm:shadow-brutal-sm flex-shrink-0">
            CC
          </div>
          <div>
            <div className="flex items-center space-x-1.5 sm:space-x-2">
              <span className="font-mono font-black text-xs sm:text-sm tracking-tight text-campus-text uppercase">
                Campus.Connect
              </span>
              <span className="text-[10px] font-mono px-1 py-0.2 bg-campus-ai text-white font-bold tracking-wider">
                {isZh ? '校园桥' : 'ФОРУМ'}
              </span>
            </div>
            <p className="text-[10px] font-mono text-campus-subtle tracking-tight hidden sm:block">
              {isZh ? '双语国际校园服务社区' : 'Кампус-сообщество для студентов и кураторов'}
            </p>
          </div>
        </div>

        {/* Центральный переключатель режимов: База знаний // Сообщество // Модерация */}
        <div className="hidden md:flex items-center space-x-1 font-mono text-xs font-bold bg-campus-bg p-1 border border-campus-border">
          <button
            type="button"
            onClick={() => onSelectTab?.('wiki')}
            className={`px-2.5 py-1 transition-all cursor-pointer flex items-center gap-1.5 ${
              currentTab === 'wiki'
                ? 'bg-campus-action text-white shadow-brutal-xs font-black'
                : 'text-campus-text hover:bg-white'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>{isZh ? '百科全书' : 'База знаний'}</span>
          </button>

          <button
            type="button"
            onClick={() => onSelectTab?.('feed')}
            className={`px-2.5 py-1 transition-all cursor-pointer flex items-center gap-1.5 ${
              currentTab === 'feed'
                ? 'bg-campus-action text-white shadow-brutal-xs font-black'
                : 'text-campus-text hover:bg-white'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>{isZh ? '社区广场' : 'Сообщество'}</span>
          </button>

          <button
            type="button"
            onClick={() => onSelectTab?.('admin')}
            className={`px-2.5 py-1 transition-all cursor-pointer flex items-center gap-1.5 ${
              currentTab === 'admin'
                ? 'bg-purple-700 text-white shadow-brutal-xs font-black'
                : 'text-campus-text hover:bg-white'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>{isZh ? '审核工作台 (2FA)' : 'Модерация (2FA)'}</span>
          </button>
        </div>

        {/* Правая часть */}
        <div className="flex items-center space-x-1.5 sm:space-x-2.5">
          
          {/* Настройка AI-ключа */}
          <button
            onClick={onOpenAiSettings}
            title={isZh ? '配置 Hugging Face API 密钥' : 'Настройка Hugging Face API токена'}
            className={`inline-flex items-center gap-1 text-[11px] sm:text-xs font-mono font-bold px-2 py-1.5 sm:px-2.5 sm:py-1.5 border border-campus-border shadow-brutal-xs transition-colors cursor-pointer ${
              hasApiKey
                ? 'bg-green-50 text-green-800 border-green-700'
                : 'bg-white text-campus-text hover:bg-campus-bg'
            }`}
          >
            <Key className="w-3.5 h-3.5 text-campus-ai" />
            <span className="hidden xs:inline">
              {hasApiKey
                ? (isZh ? 'HF 已就绪' : 'HF Активен')
                : (isZh ? 'HF 密钥' : 'HF Ключ')}
            </span>
            <span className={`w-2 h-2 rounded-full ${hasApiKey ? 'bg-green-500 animate-pulse' : 'bg-gray-300'}`}></span>
          </button>

          {/* Словарь кампуса */}
          <button
            onClick={onOpenGlossaryModal}
            title={isZh ? '校园生活高频双语词汇表' : 'Кампусный глоссарий'}
            className="btn-outline hidden md:inline-flex items-center gap-1.5 text-xs py-1.5 cursor-pointer"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>{isZh ? '校园词汇' : 'Глоссарий'}</span>
          </button>

          {/* Переключатель языка */}
          <button
            onClick={onToggleLanguage}
            title={isZh ? '切换为俄语界面 / Переключить на русский' : '切换为中文界面 / Switch to Chinese'}
            className="inline-flex items-center gap-1 text-xs font-mono font-bold px-2 py-1.5 sm:px-2.5 sm:py-1.5 border border-campus-border bg-white shadow-brutal-xs hover:bg-campus-bg transition-colors cursor-pointer"
          >
            <Globe2 className="w-3.5 h-3.5 text-campus-action" />
            <span>{isZh ? '中文 (ZH)' : 'RU (Рус)'}</span>
          </button>

          {/* Профиль */}
          <button
            onClick={onOpenProfile}
            title={isZh ? '点击进入个人中心档案' : 'Открыть личный кабинет студента'}
            className="hidden lg:flex items-center space-x-2 pl-2 pr-1 border-l border-campus-border hover:bg-campus-bg/80 py-1 transition-colors group cursor-pointer"
          >
            <img
              src={currentUser.avatar}
              alt={currentUser.name}
              className="w-7 h-7 border border-campus-border object-cover group-hover:shadow-brutal-xs"
            />
            <div className="text-left text-xs">
              <div className="font-bold text-campus-text leading-tight flex items-center gap-1 group-hover:text-campus-action transition-colors">
                <span>{isZh && currentUser.nativeName ? currentUser.nativeName.split(' ')[0] : currentUser.name.split(' ')[0]}</span>
                <span className="badge-sticker text-[9px] py-0 px-1 font-mono">
                  {currentUser.nativeLang === 'zh' ? 'ZH' : 'RU'}
                </span>
              </div>
            </div>
          </button>

          {/* Кнопка создания вопроса */}
          <button
            onClick={onOpenCreateModal}
            className="btn-action flex items-center gap-1 text-xs sm:text-xs px-2.5 py-1.5 sm:px-3.5 sm:py-2 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[3]" />
            <span className="hidden xs:inline">{isZh ? '发布提问' : 'Задать вопрос'}</span>
            <span className="xs:hidden">{isZh ? '提问' : 'Вопрос'}</span>
          </button>

        </div>
      </div>
    </header>
  );
};
