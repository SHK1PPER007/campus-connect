import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Search,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  RefreshCw,
  Zap,
  Key,
  MessageSquare,
  BookOpen,
  MapPin,
  User as UserIcon,
  Flame,
  Clock,
  WifiOff,
  Mic,
  MicOff,
} from 'lucide-react';
import { Navbar } from './components/Navbar';
import { Sidebar, NavTab } from './components/Sidebar';
import { PostCard } from './components/PostCard';
import { ProfileDashboard } from './components/ProfileDashboard';
import { CreatePostModal } from './components/CreatePostModal';
import { GlossaryModal } from './components/GlossaryModal';
import { CampusMapModal } from './components/CampusMapModal';
import { AiSettingsModal } from './components/AiSettingsModal';
import { QuickServiceBar } from './components/QuickServiceBar';
import { CultureTipWidget } from './components/CultureTipWidget';
import { WikiKnowledgeBase } from './components/WikiKnowledgeBase';
import { AdminPanel } from './components/AdminPanel';
import { BelarusQuizModal } from './components/BelarusQuizModal';
import { usePostsQuery } from './services/postsApi';
import { getAiConfig } from './services/aiServices';
import { MOCK_USERS } from './mock/mockData';
import { User } from './types/schema';
import { startVoiceRecognition, stopVoiceRecognition, isVoiceInputSupported } from './utils/voiceRecognition';

export const App: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<NavTab>('feed');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [onlyResolved, setOnlyResolved] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<'popular' | 'newest' | 'resolved'>('popular');
  const [isOffline, setIsOffline] = useState<boolean>(!navigator.onLine);
  const [isVoiceSearching, setIsVoiceSearching] = useState<boolean>(false);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const [currentUser, setCurrentUser] = useState<User>(() => {
    const saved = localStorage.getItem('campus_current_user');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
      }
    }
    return MOCK_USERS.zhangWei;
  });

  const [activeLanguage, setActiveLanguage] = useState<'ru' | 'zh'>(() => {
    const savedLang = localStorage.getItem('campus_active_lang');
    if (savedLang === 'ru' || savedLang === 'zh') return savedLang;
    return MOCK_USERS.zhangWei.nativeLang;
  });

  const handleSwitchUser = (user: User) => {
    setCurrentUser(user);
    localStorage.setItem('campus_current_user', JSON.stringify(user));
    setActiveLanguage(user.nativeLang);
    localStorage.setItem('campus_active_lang', user.nativeLang);
  };

  const handleToggleLanguage = () => {
    setActiveLanguage((prev) => {
      const next = prev === 'ru' ? 'zh' : 'ru';
      localStorage.setItem('campus_active_lang', next);
      return next;
    });
  };

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isGlossaryOpen, setIsGlossaryOpen] = useState(false);
  const [isMapOpen, setIsMapOpen] = useState(false);
  const [isAiSettingsOpen, setIsAiSettingsOpen] = useState(false);
  const [isQuizOpen, setIsQuizOpen] = useState(false);
  const [mapInitialMode, setMapInitialMode] = useState<'map' | 'contacts'>('map');

  const [aiConfig, setAiConfig] = useState(() => getAiConfig());

  const refreshAiConfig = () => {
    setAiConfig(getAiConfig());
  };

  const isZh = activeLanguage === 'zh';

  const { data: posts = [], isLoading, isError, refetch } = usePostsQuery({
    category: selectedCategory,
    onlyResolved,
    searchQuery,
    sortBy,
  });

  const handleToggleVoiceSearch = () => {
    if (!isVoiceInputSupported()) {
      alert(isZh ? '您的浏览器不支持语音输入（推荐使用 Chrome 或 Edge）' : 'Голосовой ввод не поддерживается в этом браузере (рекомендуется Chrome или Edge)');
      return;
    }

    if (isVoiceSearching) {
      stopVoiceRecognition();
      setIsVoiceSearching(false);
      return;
    }

    startVoiceRecognition({
      lang: activeLanguage,
      onStart: () => setIsVoiceSearching(true),
      onResult: (transcript) => {
        setSearchQuery(transcript);
      },
      onError: () => setIsVoiceSearching(false),
      onEnd: () => setIsVoiceSearching(false),
    });
  };

  const handleOpenMap = (mode: 'map' | 'contacts' = 'map') => {
    setMapInitialMode(mode);
    setIsMapOpen(true);
  };

  return (
    <div className="min-h-screen bg-campus-bg text-campus-text flex flex-col selection:bg-campus-action selection:text-white font-sans antialiased pb-16 lg:pb-0">
      
      {/* 1. Верхняя панель навигации */}
      <Navbar
        onOpenCreateModal={() => setIsCreateOpen(true)}
        onOpenGlossaryModal={() => setIsGlossaryOpen(true)}
        onOpenAiSettings={() => setIsAiSettingsOpen(true)}
        activeLanguage={activeLanguage}
        onToggleLanguage={handleToggleLanguage}
        currentUser={currentUser}
        onOpenProfile={() => setCurrentTab('profile')}
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
      />

      {/* Оповещение об оффлайн-режиме */}
      {isOffline && (
        <div className="bg-[#FFE700] text-black border-b-2 border-campus-border px-4 py-2 font-mono text-xs font-bold flex items-center justify-center space-x-2 shadow-brutal-xs">
          <WifiOff className="w-4 h-4 text-black flex-shrink-0" />
          <span>
            {isZh
              ? '当前处于离线状态：正在使用本地缓存数据，支持所有问答浏览。'
              : 'Режим офлайн: нет подключения к сети. Работаем с локальным кэшем.'}
          </span>
        </div>
      )}

      {/* 2. Минималистичный инфо-баннер */}
      <section className="bg-campus-dark text-white border-b border-campus-border py-3 px-3 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div className="space-y-0.5">
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 bg-campus-action"></span>
              <h1 className="font-mono font-bold text-xs sm:text-sm uppercase tracking-tight text-white">
                {isZh
                  ? 'Campus.Connect // 校园双语智能互通社区'
                  : 'Campus.Connect // Билингвальный мост кампуса'}
              </h1>
            </div>
            <p className="text-[11px] text-white/80 font-mono leading-relaxed">
              {isZh
                ? '中国留学生 [ZH] 与俄罗斯师生及管理处 [RU] 无障碍交流平台。DeepSeek-V4 极速双向互译。'
                : 'Китайские студенты [ZH] ⇋ Администрация и кураторы [RU]. AI-синхронизация сообщений.'}
            </p>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              onClick={() => setIsAiSettingsOpen(true)}
              className="bg-white/10 hover:bg-white/20 text-white font-mono font-bold text-[11px] px-2.5 py-1 border border-white/30 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Key className="w-3 h-3 text-campus-action" />
              <span>
                {aiConfig.apiKey
                  ? `HF: ${aiConfig.model.split('/')[1] || aiConfig.model}`
                  : (isZh ? '配置 AI 密钥' : 'Подключить HF Ключ')}
              </span>
            </button>

            <button
              onClick={() => setIsGlossaryOpen(true)}
              className="bg-campus-action hover:bg-[#E03600] text-white font-mono font-bold text-[11px] uppercase px-2.5 py-1 border border-white/30 transition-all hidden xs:inline-flex cursor-pointer"
            >
              {isZh ? '校园词汇' : 'Глоссарий'}
            </button>
          </div>
        </div>
      </section>

      {/* 3. Основной контентный блок */}
      <main className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 flex-1 w-full">
        <div className="flex flex-col lg:flex-row gap-4 sm:gap-6">
          
          {/* Левый Сайдбар */}
          <div className="hidden lg:block">
            <Sidebar
              currentTab={currentTab}
              onSelectTab={(tab) => {
                setCurrentTab(tab);
                if (tab === 'contacts') handleOpenMap('contacts');
              }}
              selectedCategory={selectedCategory}
              onSelectCategory={setSelectedCategory}
              onlyResolved={onlyResolved}
              onToggleOnlyResolved={() => setOnlyResolved((prev) => !prev)}
              onOpenGlossary={() => setIsGlossaryOpen(true)}
              onOpenMap={() => handleOpenMap('map')}
              onOpenAiSettings={() => setIsAiSettingsOpen(true)}
              onOpenQuiz={() => setIsQuizOpen(true)}
              activeLanguage={activeLanguage}
            />
          </div>

          {/* Центральный блок: База знаний (Wiki) / Админка модератора / Личный кабинет / Лента */}
          {currentTab === 'wiki' ? (
            <section className="flex-1 min-w-0">
              <WikiKnowledgeBase
                activeLanguage={activeLanguage}
                onAskQuestion={() => setIsCreateOpen(true)}
              />
            </section>
          ) : currentTab === 'admin' ? (
            <section className="flex-1 min-w-0">
              <AdminPanel
                activeLanguage={activeLanguage}
                currentUser={currentUser}
              />
            </section>
          ) : currentTab === 'profile' ? (
            <section className="flex-1 min-w-0">
              <ProfileDashboard
                currentUser={currentUser}
                onSwitchUser={handleSwitchUser}
                posts={posts}
                onOpenAiSettings={() => setIsAiSettingsOpen(true)}
                onOpenGlossary={() => setIsGlossaryOpen(true)}
                activeLanguage={activeLanguage}
              />
            </section>
          ) : (
            <section className="flex-1 min-w-0 space-y-3 sm:space-y-4">
              
              {/* Сервисы первой необходимости (金刚区) */}
              <QuickServiceBar
                onSelectService={(service) => {
                  setSelectedCategory('all');
                  setSearchQuery(isZh ? service.titleZh : service.titleRu);
                }}
                onOpenMap={handleOpenMap}
                activeLanguage={activeLanguage}
              />

              {/* Виджет полезных советов по адаптации */}
              <CultureTipWidget activeLanguage={activeLanguage} />

              {/* Панель поиска и фильтров */}
              <div className="bg-campus-surface border border-campus-border shadow-brutal p-3 sm:p-4">
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 items-center justify-between">
                  
                  {/* Инпут поиска с микрофоном */}
                  <div className="relative w-full sm:flex-1">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-campus-subtle" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder={
                        isVoiceSearching
                          ? (isZh ? '正在倾听... 请说出搜索关键词...' : 'Слушаю... Назовите тему или кабинет...')
                          : (isZh
                            ? '搜索问题、科室、护照、医保（支持语音输入）...'
                            : 'Поиск по вопросам, кабинетам, тегам (голос или текст)...')
                      }
                      className={`w-full pl-9 pr-16 py-1.5 sm:py-2 text-xs font-mono border border-campus-border bg-campus-bg text-campus-text focus:outline-none focus:ring-1 focus:ring-campus-action shadow-brutal-xs ${
                        isVoiceSearching ? 'border-red-500 bg-red-50 ring-1 ring-red-400' : ''
                      }`}
                    />
                    <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center space-x-1.5">
                      {searchQuery && (
                        <button
                          onClick={() => setSearchQuery('')}
                          className="text-xs text-campus-subtle hover:text-campus-text font-mono px-1 cursor-pointer"
                          title={isZh ? '清空' : 'Очистить'}
                        >
                          ✕
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={handleToggleVoiceSearch}
                        className={`p-1 text-xs transition-colors cursor-pointer ${
                          isVoiceSearching ? 'text-red-600 animate-pulse' : 'text-campus-action hover:text-campus-dark'
                        }`}
                        title={isZh ? '点击开始语音搜索' : 'Нажмите для голосового поиска'}
                      >
                        {isVoiceSearching ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Кнопка фильтрации решенных */}
                  <div className="flex items-center space-x-2 w-full sm:w-auto justify-between sm:justify-end">
                    <button
                      onClick={() => setOnlyResolved(!onlyResolved)}
                      className={`flex-1 sm:flex-none px-2.5 py-1.5 text-xs font-mono font-bold border transition-all flex items-center justify-center gap-1 cursor-pointer ${
                        onlyResolved
                          ? 'bg-campus-ai text-white border-campus-ai shadow-brutal-xs'
                          : 'bg-white text-campus-text border-campus-border hover:bg-campus-bg'
                      }`}
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>{isZh ? '仅看已解决' : 'Только с AI-итогом'}</span>
                    </button>

                    <button
                      onClick={() => refetch()}
                      title={isZh ? '刷新' : 'Обновить'}
                      className="p-1.5 border border-campus-border bg-white hover:bg-campus-bg transition-colors shadow-brutal-xs cursor-pointer"
                    >
                      <RefreshCw className="w-4 h-4 text-campus-text" />
                    </button>
                  </div>

                </div>

                {/* Мобильная горизонтальная прокрутка категорий */}
                <div className="flex items-center gap-1 mt-2.5 pt-2.5 border-t border-campus-border/30 overflow-x-auto pb-1 text-xs font-mono scrollbar-none">
                  <span className="text-[11px] text-campus-subtle font-bold mr-1 flex-shrink-0">
                    {isZh ? '分类:' : 'Тема:'}
                  </span>
                  {[
                    { id: 'all', label: isZh ? '全部话题' : 'Все темы' },
                    { id: 'curator', label: isZh ? '辅导员咨询' : 'Кураторы' },
                    { id: 'dormitory', label: isZh ? '宿舍与生活' : 'Общежитие' },
                    { id: 'studies', label: isZh ? '学业与考试' : 'Учеба и сессия' },
                    { id: 'urgent', label: isZh ? '紧急求助' : 'Срочно' },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setSelectedCategory(tab.id)}
                      className={`px-2 py-1 text-[11px] whitespace-nowrap border transition-all flex-shrink-0 cursor-pointer ${
                        selectedCategory === tab.id
                          ? 'bg-campus-dark text-white border-campus-dark font-bold shadow-brutal-xs'
                          : 'bg-white text-campus-text border-campus-border/60 hover:bg-campus-bg'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Панель сортировки постов */}
              <div className="flex items-center justify-between gap-2 px-1 text-xs font-mono">
                <div className="flex items-center space-x-1.5 flex-wrap gap-y-1">
                  <span className="text-[11px] text-campus-subtle font-bold mr-1">
                    {isZh ? '排序:' : 'Сортировка:'}
                  </span>
                  <button
                    type="button"
                    onClick={() => setSortBy('popular')}
                    className={`px-2.5 py-1 text-[11px] border font-bold flex items-center gap-1 transition-all cursor-pointer ${
                      sortBy === 'popular'
                        ? 'bg-campus-dark text-white border-campus-dark shadow-brutal-xs'
                        : 'bg-white text-campus-text border-campus-border hover:bg-campus-bg'
                    }`}
                  >
                    <Flame className="w-3 h-3 text-orange-500" />
                    <span>{isZh ? '最热' : 'Популярные'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSortBy('newest')}
                    className={`px-2.5 py-1 text-[11px] border font-bold flex items-center gap-1 transition-all cursor-pointer ${
                      sortBy === 'newest'
                        ? 'bg-campus-dark text-white border-campus-dark shadow-brutal-xs'
                        : 'bg-white text-campus-text border-campus-border hover:bg-campus-bg'
                    }`}
                  >
                    <Clock className="w-3 h-3 text-blue-500" />
                    <span>{isZh ? '最新' : 'Свежие'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSortBy('resolved')}
                    className={`px-2.5 py-1 text-[11px] border font-bold flex items-center gap-1 transition-all cursor-pointer ${
                      sortBy === 'resolved'
                        ? 'bg-campus-dark text-white border-campus-dark shadow-brutal-xs'
                        : 'bg-white text-campus-text border-campus-border hover:bg-campus-bg'
                    }`}
                  >
                    <Sparkles className="w-3 h-3 text-campus-ai" />
                    <span>{isZh ? '已解决置顶' : 'С решением'}</span>
                  </button>
                </div>

                <span className="text-[11px] text-campus-subtle font-mono hidden sm:inline-block">
                  {isZh ? `${posts.length} 条记录` : `${posts.length} вопросов`}
                </span>
              </div>

              {/* Состояние загрузки */}
              {isLoading && (
                <div className="bg-white border border-campus-border shadow-brutal p-8 text-center space-y-2 font-mono text-xs">
                  <Sparkles className="w-5 h-5 text-campus-action animate-spin mx-auto" />
                  <div className="font-bold uppercase">
                    {isZh ? '正在同步数据...' : 'Загрузка данных форума...'}
                  </div>
                </div>
              )}

              {/* Ошибка */}
              {isError && (
                <div className="bg-red-50 border-2 border-red-600 p-3 text-xs font-mono text-red-900 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
                  <span>{isZh ? '加载失败，请检查网络。' : 'Ошибка загрузки данных. Проверьте сеть.'}</span>
                </div>
              )}

              {/* Список постов */}
              {!isLoading && !isError && (
                <div className="space-y-3 sm:space-y-4">
                  {posts.map((post) => (
                    <PostCard
                      key={post.id}
                      post={post}
                      userPreferredLang={activeLanguage}
                      currentUser={currentUser}
                    />
                  ))}

                  {posts.length === 0 && (
                    <div className="bg-white border border-campus-border shadow-brutal p-8 text-center space-y-2.5">
                      <HelpCircle className="w-8 h-8 text-campus-subtle mx-auto" />
                      <h3 className="font-mono font-bold text-xs uppercase text-campus-text">
                        {isZh ? '暂无相关帖子' : 'Постов не найдено'}
                      </h3>
                      <p className="text-xs font-sans text-campus-muted">
                        {isZh ? '可以尝试调整搜索关键词或发布新提问。' : 'Попробуйте сбросить фильтр или напишите свой вопрос куратору.'}
                      </p>
                      <button
                        onClick={() => {
                          setSelectedCategory('all');
                          setOnlyResolved(false);
                          setSearchQuery('');
                        }}
                        className="btn-outline text-xs px-3 py-1 cursor-pointer"
                      >
                        {isZh ? '重置筛选' : 'Сбросить фильтры'}
                      </button>
                    </div>
                  )}
                </div>
              )}

            </section>
          )}

        </div>
      </main>

      {/* 4. Мобильный нижний бар быстрой навигации */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-campus-border shadow-brutal flex items-center justify-around h-14 px-2 font-mono text-[11px]">
        <button
          onClick={() => {
            setCurrentTab('wiki');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className={`flex flex-col items-center py-1 px-2 cursor-pointer ${
            currentTab === 'wiki' ? 'text-campus-action font-bold' : 'text-campus-muted'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>{isZh ? '百科' : 'Вики'}</span>
        </button>

        <button
          onClick={() => {
            setCurrentTab('feed');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className={`flex flex-col items-center py-1 px-2 cursor-pointer ${
            currentTab === 'feed' ? 'text-campus-action font-bold' : 'text-campus-muted'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          <span>{isZh ? '社区' : 'Лента'}</span>
        </button>

        <button
          onClick={() => {
            setCurrentTab('admin');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className={`flex flex-col items-center py-1 px-2 cursor-pointer ${
            currentTab === 'admin' ? 'text-purple-700 font-bold' : 'text-campus-muted'
          }`}
        >
          <Key className="w-4 h-4" />
          <span>{isZh ? '审核' : 'Админ'}</span>
        </button>

        <button
          onClick={() => {
            setCurrentTab('profile');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className={`flex flex-col items-center py-1 px-2 cursor-pointer ${
            currentTab === 'profile' ? 'text-campus-action font-bold' : 'text-campus-muted'
          }`}
        >
          <UserIcon className="w-4 h-4" />
          <span>{isZh ? '档案' : 'Кабинет'}</span>
        </button>

        <button
          onClick={() => setIsQuizOpen(true)}
          className="flex flex-col items-center py-1 px-2 text-amber-600 font-bold cursor-pointer"
        >
          <HelpCircle className="w-4 h-4" />
          <span>{isZh ? '自测' : 'Квиз'}</span>
        </button>
      </nav>

      {/* 5. Футер */}
      <footer className="mt-8 bg-campus-dark text-white border-t border-campus-border py-4 px-4 font-mono text-xs hidden lg:block">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-2">
          <div className="flex items-center space-x-2">
            <span className="font-bold text-campus-action">CAMPUS.CONNECT // BELARUS</span>
            <span className="text-white/40">|</span>
            <span className="text-white/80">
              {isZh ? '在白俄罗斯中国留学生多功能适应平台' : 'Многофункциональная адаптационная платформа для китайских студентов в Беларуси'}
            </span>
          </div>
          <div className="text-white/60 text-[11px]">
            AI: {aiConfig.model} • Dual-Storage 0ms
          </div>
        </div>
      </footer>

      {/* 6. Модальные окна */}
      <CreatePostModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        currentUser={currentUser}
        activeLanguage={activeLanguage}
      />

      <GlossaryModal
        isOpen={isGlossaryOpen}
        onClose={() => setIsGlossaryOpen(false)}
        activeLanguage={activeLanguage}
      />

      <CampusMapModal
        isOpen={isMapOpen}
        onClose={() => setIsMapOpen(false)}
        initialMode={mapInitialMode}
        activeLanguage={activeLanguage}
      />

      <AiSettingsModal
        isOpen={isAiSettingsOpen}
        onClose={() => setIsAiSettingsOpen(false)}
        onConfigSaved={refreshAiConfig}
        activeLanguage={activeLanguage}
      />

      <BelarusQuizModal
        isOpen={isQuizOpen}
        onClose={() => setIsQuizOpen(false)}
        activeLanguage={activeLanguage}
      />

    </div>
  );
};

export default App;
