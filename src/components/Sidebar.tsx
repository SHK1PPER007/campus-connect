import React from 'react';
import {
  MessageSquare,
  BookOpen,
  MapPin,
  PhoneCall,
  User as UserIcon,
  Layers,
  Sparkles,
  Key,
  ExternalLink,
  Shield,
  HelpCircle,
  Award,
} from 'lucide-react';
import { MOCK_USERS } from '../mock/mockData';

export type NavTab = 'feed' | 'wiki' | 'admin' | 'profile' | 'handbook' | 'map' | 'contacts';

interface SidebarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
  onlyResolved: boolean;
  onToggleOnlyResolved: () => void;
  onOpenGlossary: () => void;
  onOpenMap: () => void;
  onOpenAiSettings: () => void;
  onOpenQuiz?: () => void;
  activeLanguage?: 'ru' | 'zh';
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  selectedCategory,
  onSelectCategory,
  onlyResolved,
  onToggleOnlyResolved,
  onOpenGlossary,
  onOpenMap,
  onOpenAiSettings,
  onOpenQuiz,
  activeLanguage = 'ru',
}) => {
  const curator = MOCK_USERS.curatorAnna;
  const isZh = activeLanguage === 'zh';

  const navItems: { id: NavTab; label: string; icon: React.ReactNode; badge?: string }[] = [
    {
      id: 'wiki',
      label: isZh ? '白俄百科知识库' : 'База знаний (Wiki)',
      icon: <BookOpen className="w-4 h-4 text-campus-action" />,
      badge: isZh ? '标准' : 'ВИКИ',
    },
    {
      id: 'feed',
      label: isZh ? '社区讨论广场' : 'Сообщество (Лента)',
      icon: <MessageSquare className="w-4 h-4" />,
    },
    {
      id: 'admin',
      label: isZh ? '审核工作台 (2FA)' : 'Модерация (2FA)',
      icon: <Shield className="w-4 h-4 text-purple-600" />,
      badge: '2FA',
    },
    {
      id: 'profile',
      label: isZh ? '个人档案与状态' : 'Личный кабинет',
      icon: <UserIcon className="w-4 h-4" />,
    },
    {
      id: 'handbook',
      label: isZh ? '常用俄语词汇表' : 'Словарь терминов',
      icon: <BookOpen className="w-4 h-4 text-campus-muted" />,
    },
    {
      id: 'map',
      label: isZh ? '校园楼栋地图' : 'Карта кампуса',
      icon: <MapPin className="w-4 h-4" />,
    },
  ];

  const categories = [
    { id: 'all', label: isZh ? '全部话题' : 'Все темы' },
    { id: 'transport', label: isZh ? '交通 (Оплати/地铁)' : 'Транспорт (Метро, Оплати)' },
    { id: 'dormitory', label: isZh ? '宿舍 (换被单/舍监)' : 'Общежитие (Белье, правила)' },
    { id: 'cuisine', label: isZh ? '饮食 (土豆饼/市场)' : 'Кухня (Драники, рынок)' },
    { id: 'etiquette', label: isZh ? '礼仪 (23点静音/衣帽)' : 'Этикет (Тишина, гардероб)' },
    { id: 'studies', label: isZh ? '学业 (成绩册/考期)' : 'Учеба (Зачетка, деканат)' },
    { id: 'visa', label: isZh ? '签证 (ОГИМ 104室)' : 'Виза и ОГИМ (Каб. 104)' },
  ];

  return (
    <aside className="w-full lg:w-64 flex-shrink-0 space-y-4 sm:space-y-5">
      
      {/* Главное меню навигации */}
      <div className="bg-campus-surface border border-campus-border shadow-brutal p-3">
        <div className="text-[11px] font-mono uppercase tracking-wider text-campus-subtle font-bold px-2 mb-2">
          {isZh ? '// 社区导航' : '// Навигация'}
        </div>
        <nav className="space-y-1">
          {navItems.map((item) => {
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  onSelectTab(item.id);
                  if (item.id === 'handbook') onOpenGlossary();
                  if (item.id === 'map') onOpenMap();
                }}
                className={`w-full flex items-center justify-between px-3 py-2 text-xs font-mono font-bold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-campus-action text-white shadow-brutal-xs'
                    : 'text-campus-text hover:bg-campus-bg'
                }`}
              >
                <div className="flex items-center space-x-2.5">
                  {item.icon}
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span
                    className={`text-[9px] font-mono px-1 py-0.2 font-bold ${
                      isActive ? 'bg-white text-campus-action' : 'bg-campus-bg text-campus-text border border-campus-border'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Викторина о Беларуси (Адаптация и снятие стресса) */}
      <div className="bg-campus-surface border border-campus-border shadow-brutal p-3">
        <div className="text-[11px] font-mono uppercase tracking-wider text-campus-subtle font-bold px-2 mb-2 flex items-center justify-between">
          <span>{isZh ? '// 趣味减压' : '// АДАПТАЦИЯ И РЕЛАКС'}</span>
          <span className="badge-sticker text-[9px] py-0 px-1 bg-amber-500 text-white font-bold">QUIZ</span>
        </div>
        <button
          type="button"
          onClick={onOpenQuiz}
          className="w-full btn-outline flex items-center justify-between p-2 text-xs font-mono font-bold bg-amber-50 hover:bg-amber-100 border-amber-500 text-amber-950 transition-all cursor-pointer shadow-brutal-xs"
        >
          <div className="flex items-center gap-2">
            <HelpCircle className="w-4 h-4 text-amber-700 flex-shrink-0" />
            <span className="truncate">{isZh ? '白俄知识趣味自测' : 'Викторина о Беларуси'}</span>
          </div>
          <span className="text-[10px] font-bold text-amber-700">&gt;&gt;</span>
        </button>
      </div>

      {/* Быстрые фильтры ленты */}
      {currentTab === 'feed' && (
        <div className="bg-campus-surface border border-campus-border shadow-brutal p-3 hidden sm:block">
          <div className="text-[11px] font-mono uppercase tracking-wider text-campus-subtle font-bold px-2 mb-2 flex items-center justify-between">
            <span>{isZh ? '// 话题分类' : '// Темы'}</span>
            <Layers className="w-3.5 h-3.5 text-campus-subtle" />
          </div>
          <div className="space-y-1">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => onSelectCategory(cat.id)}
                className={`w-full flex items-center justify-between px-3 py-1.5 text-xs font-mono transition-colors cursor-pointer ${
                  selectedCategory === cat.id
                    ? 'bg-campus-dark text-white font-bold'
                    : 'text-campus-text hover:bg-campus-bg font-medium'
                }`}
              >
                <span>{cat.label}</span>
              </button>
            ))}
          </div>

          {/* Тумблер: Только решенные */}
          <div className="mt-3 pt-3 border-t border-campus-border">
            <button
              onClick={onToggleOnlyResolved}
              className={`w-full flex items-center justify-between px-2.5 py-2 text-xs font-mono border transition-all cursor-pointer ${
                onlyResolved
                  ? 'border-campus-ai bg-campus-ai text-white shadow-brutal-xs font-bold'
                  : 'border-campus-border bg-campus-bg text-campus-text hover:border-campus-ai'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Sparkles className={`w-3.5 h-3.5 ${onlyResolved ? 'text-white' : 'text-campus-ai'}`} />
                <span>{isZh ? '仅看已解决' : 'Только с AI-итогом'}</span>
              </div>
              <span className="text-[10px] font-bold">
                {onlyResolved ? '✓' : (isZh ? '全部' : 'Все')}
              </span>
            </button>
          </div>
        </div>
      )}

      {/* Карточка дежурного куратора */}
      <div className="bg-campus-surface border border-campus-border shadow-brutal p-3.5 sm:p-4 relative">
        <div className="flex items-center justify-between border-b border-campus-border/30 pb-2 mb-2.5">
          <div className="text-[10px] font-mono text-campus-subtle uppercase">
            {isZh ? '// 辅导员今日值班' : '// ДЕЖУРНЫЙ КУРАТОР'}
          </div>
          <span className="badge-sticker bg-[#FFE700] text-black text-[9px] py-0 px-1">
            {isZh ? '在岗' : 'НА СВЯЗИ'}
          </span>
        </div>
        
        <div className="flex items-start space-x-3 mb-2.5">
          <img
            src={curator.avatar}
            alt={curator.name}
            className="w-10 h-10 border border-campus-border object-cover flex-shrink-0"
          />
          <div className="min-w-0">
            <h4 className="font-bold text-xs text-campus-text leading-tight truncate">
              {isZh ? curator.nativeName : curator.name}
            </h4>
            <span className="badge-sticker-curator text-[9px] mt-1">
              {isZh ? '留学生专职辅导员' : 'Куратор 1-2 курсов'}
            </span>
          </div>
        </div>

        <div className="bg-campus-bg p-2 border border-campus-border text-[11px] font-mono text-campus-text space-y-1">
          <div className="flex justify-between">
            <span className="text-campus-muted">{isZh ? '科室地点:' : 'Кабинет:'}</span>
            <span className="font-bold">{isZh ? 'A栋 108室' : 'Каб. А-108'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-campus-muted">{isZh ? '接待时间:' : 'Прием:'}</span>
            <span>10:00 — 16:30</span>
          </div>
          <div className="flex justify-between">
            <span className="text-campus-muted">{isZh ? '咨询语言:' : 'Языки:'}</span>
            <span className="font-bold">{isZh ? '中文、俄语' : 'Русский, 中文'}</span>
          </div>
        </div>
      </div>

      {/* Hugging Face Инфо-карточка */}
      <div className="border border-campus-border bg-[#F8F7FF] p-3 text-xs font-mono shadow-brutal-xs">
        <div className="flex items-center justify-between mb-1">
          <span className="flex items-center gap-1 font-bold text-campus-ai uppercase text-[11px]">
            <Key className="w-3.5 h-3.5" />
            <span>AI Hugging Face</span>
          </span>
          <button
            onClick={onOpenAiSettings}
            className="text-[10px] text-campus-action underline font-bold cursor-pointer"
          >
            {isZh ? '配置' : 'Настроить'}
          </button>
        </div>
        <p className="text-[11px] text-campus-muted leading-relaxed">
          {isZh
            ? '已支持 DeepSeek-V4 模型直连，支持中俄双向智能同步与问答提炼。'
            : 'Поддержка DeepSeek-V4-Flash-0731. Мгновенная синхронизация тредов.'}
        </p>
      </div>

    </aside>
  );
};
