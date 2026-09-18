import React, { useState } from 'react';
import {
  User as UserIcon,
  Shield,
  FileText,
  Calendar,
  Building,
  CheckCircle2,
  Clock,
  Sparkles,
  Key,
  BookMarked,
  MessageSquare,
  Users,
  ExternalLink,
  ChevronRight,
  Bell,
  Check,
  AlertTriangle,
  Award,
  XCircle,
} from 'lucide-react';
import { Post, User } from '../types/schema';
import { MOCK_USERS, STUDENT_DOCUMENTS } from '../mock/mockData';
import { PostCard } from './PostCard';
import {
  usePostsQuery,
  useStudentNotificationsQuery,
  useMarkNotificationReadMutation,
} from '../services/postsApi';

interface ProfileDashboardProps {
  currentUser: User;
  onSwitchUser: (user: User) => void;
  posts: Post[];
  onOpenAiSettings: () => void;
  onOpenGlossary: () => void;
  activeLanguage?: 'ru' | 'zh';
}

export const ProfileDashboard: React.FC<ProfileDashboardProps> = ({
  currentUser,
  onSwitchUser,
  posts,
  onOpenAiSettings,
  onOpenGlossary,
  activeLanguage = 'ru',
}) => {
  const [profileTab, setProfileTab] = useState<'docs' | 'my_posts' | 'notifications' | 'bookmarks'>('docs');
  const isZh = activeLanguage === 'zh';

  // Все посты пользователя со всеми статусами (включая pending_moderation и rejected)
  const { data: userPosts = [] } = usePostsQuery({
    authorId: currentUser.id,
    status: 'all_statuses',
  });

  // Уведомления студента
  const { data: notifications = [] } = useStudentNotificationsQuery(currentUser.id);
  const markReadMutation = useMarkNotificationReadMutation();

  const unreadCount = notifications.filter((n) => !n.isRead).length;
  const bookmarkedPosts = posts.filter((p) => p.isResolved && p.aiSummary);

  const handleMarkRead = async (notifId: string) => {
    await markReadMutation.mutateAsync(notifId);
  };

  return (
    <div className="space-y-4 sm:space-y-5">
      
      {/* 1. Цифровой студенческий билет (Student ID Card) */}
      <div className="bg-campus-surface border-2 border-campus-border shadow-brutal p-4 sm:p-5 relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-campus-border pb-3 mb-3.5">
          <div className="flex items-center space-x-2.5">
            <span className="w-3 h-3 bg-campus-action"></span>
            <span className="font-mono font-bold text-xs uppercase tracking-wider text-campus-text">
              {isZh ? '学生电子档案卡' : 'ЦИФРОВАЯ КАРТОЧКА СТУДЕНТА'}
            </span>
          </div>

          <div className="font-mono text-xs text-campus-subtle flex items-center gap-2">
            <span>ID:</span>
            <span className="font-bold text-campus-text bg-campus-bg px-2 py-0.5 border border-campus-border">
              {currentUser.studentId || '2026-CS-41892'}
            </span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 items-start">
          {/* Аватар */}
          <div className="relative flex-shrink-0">
            <img
              src={currentUser.avatar}
              alt={currentUser.name}
              className="w-20 h-20 sm:w-24 sm:h-24 border-2 border-campus-border object-cover shadow-brutal-sm"
            />
            <div className="absolute -bottom-1 -right-1 badge-sticker text-[9px] py-0 px-1 font-mono">
              {currentUser.nativeLang === 'zh' ? 'ZH' : 'RU'}
            </div>
          </div>

          {/* Инфо профиля */}
          <div className="flex-1 space-y-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base sm:text-xl font-extrabold text-campus-text tracking-tight font-sans">
                {isZh && currentUser.nativeName ? currentUser.nativeName : currentUser.name}
              </h2>
              {isZh && currentUser.name && currentUser.nativeName && (
                <span className="text-xs text-campus-subtle font-mono">
                  ({currentUser.name})
                </span>
              )}
              {!isZh && currentUser.nativeName && (
                <span className="text-sm font-bold text-campus-action font-sans">
                  ({currentUser.nativeName})
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 flex-wrap pt-0.5">
              {currentUser.role === 'curator' ? (
                <span className="badge-sticker-curator text-[10px]">
                  {isZh ? '留学生专职辅导员' : 'Куратор иностранных групп'}
                </span>
              ) : currentUser.role === 'admin' ? (
                <span className="badge-sticker-admin text-[10px]">
                  {isZh ? '校园网络管理员' : 'ИТ-Администратор'}
                </span>
              ) : (
                <span className="badge-sticker text-[10px]">
                  {currentUser.nativeLang === 'zh'
                    ? (isZh ? '留学生 (本科1年级)' : 'Иностранный студент (1 курс)')
                    : (isZh ? '本地学生 (班长)' : 'Студент (староста)')}
                </span>
              )}

              {currentUser.groupNumber && (
                <span className="text-[11px] font-mono bg-campus-bg px-1.5 py-0.5 border border-campus-border">
                  {isZh ? `班级: ${currentUser.groupNumber}` : `Группа: ${currentUser.groupNumber}`}
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-2 text-xs font-mono text-campus-muted">
              {currentUser.faculty && (
                <div className="flex items-center gap-1.5 truncate">
                  <Building className="w-3.5 h-3.5 text-campus-action flex-shrink-0" />
                  <span className="truncate">{currentUser.faculty}</span>
                </div>
              )}
              {currentUser.dormitoryInfo && (
                <div className="flex items-center gap-1.5 truncate">
                  <span className="font-mono text-[10px] text-campus-action font-bold border border-campus-border px-1 py-0.2 bg-campus-bg">
                    {isZh ? '宿' : 'ОБЩ'}
                  </span>
                  <span className="truncate">
                    {isZh
                      ? currentUser.dormitoryInfo.replace('Общежитие №', '宿舍楼 ').replace('комн.', '室')
                      : currentUser.dormitoryInfo}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 2. Блок переключения ролей */}
      <div className="bg-campus-surface border border-campus-border shadow-brutal p-3 sm:p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-1.5 text-xs font-mono font-bold uppercase text-campus-text">
            <Users className="w-3.5 h-3.5 text-campus-action" />
            <span>{isZh ? '// 切换演示角色' : '// ПЕРЕКЛЮЧЕНИЕ РОЛЕЙ'}</span>
          </div>
          <span className="text-[10px] font-mono text-campus-subtle">
            {isZh ? '点击切换身份体验' : 'Кликните для смены'}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {Object.values(MOCK_USERS).map((user) => {
            const isCurrent = user.id === currentUser.id;
            return (
              <button
                key={user.id}
                onClick={() => onSwitchUser(user)}
                className={`p-2 border text-left flex items-center space-x-2 transition-all cursor-pointer ${
                  isCurrent
                    ? 'border-campus-action bg-white shadow-brutal-xs ring-1 ring-campus-action'
                    : 'border-campus-border/60 bg-campus-bg hover:bg-white'
                }`}
              >
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="w-7 h-7 border border-campus-border object-cover flex-shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <div className="font-bold text-xs text-campus-text truncate leading-tight flex items-center gap-1">
                    <span>{isZh && user.nativeName ? user.nativeName.split(' ')[0] : user.name.split(' ')[0]}</span>
                    <span className="text-[9px] font-mono text-campus-subtle">[{user.nativeLang === 'zh' ? 'ZH' : 'RU'}]</span>
                  </div>
                  <div className="text-[10px] text-campus-subtle truncate font-mono">
                    {user.role === 'curator' ? (isZh ? '辅导员' : 'Куратор') : user.role === 'admin' ? (isZh ? '管理员' : 'Админ') : (isZh ? '学生' : 'Студент')}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Навигация табов профиля */}
      <div className="flex border-b border-campus-border bg-campus-surface px-1 gap-1 text-xs font-mono font-bold flex-wrap">
        <button
          onClick={() => setProfileTab('docs')}
          className={`py-2 px-3 border-b-2 transition-all flex items-center gap-1.5 cursor-pointer ${
            profileTab === 'docs'
              ? 'border-campus-action text-campus-action font-black'
              : 'border-transparent text-campus-subtle hover:text-campus-text'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>{isZh ? '在白居留材料' : 'Документы (ОГИМ)'}</span>
          <span className="badge-sticker text-[9px] py-0 px-1 bg-campus-action text-white">
            {STUDENT_DOCUMENTS.length}
          </span>
        </button>

        <button
          onClick={() => setProfileTab('my_posts')}
          className={`py-2 px-3 border-b-2 transition-all flex items-center gap-1.5 cursor-pointer ${
            profileTab === 'my_posts'
              ? 'border-campus-action text-campus-action font-black'
              : 'border-transparent text-campus-subtle hover:text-campus-text'
          }`}
        >
          <MessageSquare className="w-3.5 h-3.5" />
          <span>{isZh ? '我的提问进度' : 'Мои вопросы (Статусы)'}</span>
          <span className="badge-sticker text-[9px] py-0 px-1">
            {userPosts.length}
          </span>
        </button>

        <button
          onClick={() => setProfileTab('notifications')}
          className={`py-2 px-3 border-b-2 transition-all flex items-center gap-1.5 cursor-pointer ${
            profileTab === 'notifications'
              ? 'border-campus-action text-campus-action font-black'
              : 'border-transparent text-campus-subtle hover:text-campus-text'
          }`}
        >
          <Bell className="w-3.5 h-3.5" />
          <span>{isZh ? '审核通知中心' : 'Уведомления'}</span>
          {unreadCount > 0 && (
            <span className="badge-sticker text-[9px] py-0 px-1 bg-red-600 text-white font-bold animate-pulse">
              {unreadCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setProfileTab('bookmarks')}
          className={`py-2 px-3 border-b-2 transition-all flex items-center gap-1.5 cursor-pointer ${
            profileTab === 'bookmarks'
              ? 'border-campus-action text-campus-action font-black'
              : 'border-transparent text-campus-subtle hover:text-campus-text'
          }`}
        >
          <BookMarked className="w-3.5 h-3.5" />
          <span>{isZh ? '已解决精选' : 'С AI-итогом'}</span>
          <span className="badge-sticker text-[9px] py-0 px-1 bg-campus-ai text-white">
            {bookmarkedPosts.length}
          </span>
        </button>
      </div>

      {/* 4. Контент вкладок */}

      {/* 4.1 Документы студента (Беларусь ОГИМ) */}
      {profileTab === 'docs' && (
        <div className="space-y-3">
          <div className="text-[11px] font-mono text-campus-subtle flex items-center justify-between">
            <span>{isZh ? '留学生在白俄罗斯居留与学籍关键材料 (ОГИМ 104室):' : 'Обязательные документы для пребывания в Беларуси (ОГИМ 104):'}</span>
            <span className="text-green-700 font-bold">{isZh ? '全部有效' : 'Все действительны'}</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {STUDENT_DOCUMENTS.map((doc) => (
              <div
                key={doc.id}
                className="bg-campus-surface border border-campus-border shadow-brutal-xs p-3 sm:p-4 space-y-2 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <h4 className="font-bold text-xs sm:text-sm text-campus-text leading-snug">
                      {isZh ? doc.titleZh : doc.titleRu}
                    </h4>
                    <span className="badge-sticker bg-green-100 text-green-900 border border-green-600 text-[10px] py-0.5 px-1.5 flex items-center gap-1 flex-shrink-0">
                      <CheckCircle2 className="w-3 h-3 text-green-700" />
                      <span>{isZh ? doc.statusLabelZh : doc.statusLabelRu}</span>
                    </span>
                  </div>

                  <div className="text-xs font-mono text-campus-muted space-y-1 pt-1">
                    <div className="flex justify-between">
                      <span className="text-campus-subtle">{isZh ? '证件编号:' : 'Номер:'}</span>
                      <span className="font-bold text-campus-text">{doc.number}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-campus-subtle">{isZh ? '有效期限:' : 'Срок действия:'}</span>
                      <span className="text-campus-action font-bold">{doc.validUntil}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-campus-border/30 flex items-center justify-between text-[11px] font-mono">
                  <span className="text-campus-subtle">{doc.office}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Быстрые действия */}
          <div className="bg-campus-surface border border-campus-border shadow-brutal p-3 sm:p-4 mt-4">
            <div className="text-xs font-mono font-bold uppercase text-campus-text mb-2.5">
              {isZh ? '// 常用快捷操作' : '// БЫСТРЫЕ ДЕЙСТВИЯ'}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                onClick={onOpenGlossary}
                className="btn-outline text-xs py-2 px-3 flex items-center justify-between cursor-pointer"
              >
                <span>{isZh ? '查阅白俄罗斯高频术语词汇表' : 'Открыть словарь терминов Беларуси'}</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={onOpenAiSettings}
                className="btn-outline text-xs py-2 px-3 flex items-center justify-between cursor-pointer"
              >
                <span>{isZh ? '配置 Hugging Face AI 密钥' : 'Настройка Hugging Face API'}</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4.2 Мои вопросы с трекером стадий модерации */}
      {profileTab === 'my_posts' && (
        <div className="space-y-3">
          <div className="text-xs font-mono text-campus-subtle flex items-center justify-between pb-1">
            <span>{isZh ? '所有您提交的提问生命周期跟踪：' : 'Жизненный цикл ваших вопросов в системе:'}</span>
            <span className="font-bold text-campus-text">{userPosts.length} {isZh ? '条' : 'вопр.'}</span>
          </div>

          {userPosts.length > 0 ? (
            userPosts.map((p) => {
              const status = p.status || 'published';
              return (
                <div
                  key={p.id}
                  className={`bg-campus-surface border-2 p-3.5 sm:p-4 shadow-brutal-xs transition-all ${
                    status === 'pending_moderation'
                      ? 'border-amber-500 bg-amber-50/20'
                      : status === 'rejected'
                      ? 'border-red-500 bg-red-50/20'
                      : status === 'wiki_promoted'
                      ? 'border-yellow-600 bg-yellow-50/20'
                      : 'border-campus-border'
                  }`}
                >
                  {/* Шапка статуса */}
                  <div className="flex items-center justify-between gap-2 mb-2 flex-wrap text-xs font-mono">
                    <div className="flex items-center gap-1.5">
                      {status === 'pending_moderation' && (
                        <span className="px-2 py-0.5 bg-amber-100 text-amber-900 border border-amber-600 font-bold flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-amber-700" />
                          <span>{isZh ? '⏳ 审核排队中 (AI已提炼核心)' : '⏳ На модерации (AI сжал суть)'}</span>
                        </span>
                      )}

                      {status === 'published' && (
                        <span className="px-2 py-0.5 bg-blue-100 text-blue-900 border border-blue-600 font-bold flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5 text-blue-700" />
                          <span>{isZh ? '✓ 社区讨论中' : '✓ Опубликовано в сообществе'}</span>
                        </span>
                      )}

                      {status === 'wiki_promoted' && (
                        <span className="px-2 py-0.5 bg-yellow-100 text-yellow-900 border border-yellow-600 font-bold flex items-center gap-1">
                          <Award className="w-3.5 h-3.5 text-yellow-700" />
                          <span>{isZh ? '⭐ 已正式收录入白俄知识库' : '⭐ В Базе Знаний Беларуси'}</span>
                        </span>
                      )}

                      {status === 'rejected' && (
                        <span className="px-2 py-0.5 bg-red-100 text-red-900 border border-red-600 font-bold flex items-center gap-1">
                          <XCircle className="w-3.5 h-3.5 text-red-700" />
                          <span>{isZh ? '✕ 审核未通过' : '✕ Отклонено модератором'}</span>
                        </span>
                      )}

                      <span className="text-[11px] text-campus-subtle">#{p.category}</span>
                    </div>

                    <div className="text-[11px] text-campus-subtle">
                      {p.createdAt}
                    </div>
                  </div>

                  {/* Заголовок */}
                  <h3 className="font-extrabold text-sm sm:text-base text-campus-text mb-1.5 font-sans">
                    {isZh ? (p.langOriginal === 'zh' ? p.titleOriginal : p.titleTranslated) : (p.langOriginal === 'ru' ? p.titleOriginal : p.titleTranslated)}
                  </h3>

                  {/* Оригинал */}
                  <div className="text-xs text-campus-subtle mb-2 font-mono">
                    <span className="font-bold">{p.langOriginal === 'zh' ? 'ZH 原文: ' : 'RU Оригинал: '}</span>
                    <span>{p.titleOriginal}</span>
                  </div>

                  {/* Сжатая суть ИИ */}
                  {p.aiEssence && (
                    <div className="p-2 mb-2 bg-blue-50 border border-blue-200 text-xs font-mono text-blue-950 flex items-start gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-blue-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold">{isZh ? 'AI 提取核心意图: ' : 'Выжимка сути от ИИ: '}</span>
                        <span>{p.aiEssence}</span>
                      </div>
                    </div>
                  )}

                  {/* Блок причины отклонения */}
                  {status === 'rejected' && p.rejectionReason && (
                    <div className="p-2.5 bg-red-100 border border-red-400 text-xs font-mono text-red-900 flex items-start gap-2 mb-2">
                      <AlertTriangle className="w-4 h-4 text-red-700 flex-shrink-0 mt-0.5" />
                      <div>
                        <div className="font-bold uppercase tracking-wider text-[11px]">
                          {isZh ? '编辑驳回原因与修改建议:' : 'Причина отклонения редактором:'}
                        </div>
                        <div className="font-sans text-xs mt-0.5">{p.rejectionReason}</div>
                      </div>
                    </div>
                  )}

                  {/* Прогресс голосования */}
                  {status === 'published' && (
                    <div className="mt-2 pt-2 border-t border-campus-border/60 flex items-center justify-between text-xs font-mono">
                      <div className="flex items-center gap-1 text-campus-text">
                        <span>{isZh ? '社区支持数:' : 'Голоса сообщества:'}</span>
                        <span className="font-bold">{p.communityVotes || 0} / 3</span>
                        <span className="text-[10px] text-campus-subtle">
                          ({isZh ? `还差 ${Math.max(0, 3 - (p.communityVotes || 0))} 票入知识库` : `до Вики: ${Math.max(0, 3 - (p.communityVotes || 0))}`})
                        </span>
                      </div>
                      <span className="text-[11px] text-campus-subtle">
                        {p.commentsCount} {isZh ? '回复' : 'ответов'}
                      </span>
                    </div>
                  )}

                  {/* Карточка перенесенного в вики */}
                  {status === 'wiki_promoted' && (
                    <div className="mt-2 pt-2 border-t border-yellow-200 text-xs font-mono text-amber-900 flex items-center justify-between">
                      <span className="font-bold">
                        {isZh ? '🎉 该问题已被社群推选收录入百科知识库！' : '🎉 Вопрос перенесен в энциклопедию Беларуси!'}
                      </span>
                      <span className="text-[10px] bg-yellow-200 px-1.5 py-0.5 border border-yellow-400">
                        {p.promotedToWikiAt || 'Сегодня'}
                      </span>
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <div className="bg-campus-surface border border-campus-border p-8 text-center font-mono text-xs text-campus-subtle">
              {isZh ? '您尚未提交过任何问题。' : 'Вы еще не задавали вопросов.'}
            </div>
          )}
        </div>
      )}

      {/* 4.3 Центр уведомлений от модераторов и системы */}
      {profileTab === 'notifications' && (
        <div className="space-y-3">
          <div className="text-xs font-mono text-campus-subtle flex items-center justify-between pb-1">
            <span>{isZh ? '来自审核员与系统的官方反馈通知：' : 'Уведомления от редакторов и системы:'}</span>
            <span className="font-bold text-campus-text">{notifications.length} {isZh ? '条' : 'уведомл.'}</span>
          </div>

          {notifications.length > 0 ? (
            notifications.map((notif) => (
              <div
                key={notif.id}
                className={`bg-campus-surface border-2 p-3 sm:p-4 shadow-brutal-xs flex items-start justify-between gap-3 ${
                  !notif.isRead ? 'border-campus-action bg-amber-50/10' : 'border-campus-border opacity-90'
                }`}
              >
                <div className="space-y-1 min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-extrabold text-xs sm:text-sm text-campus-text">
                      {isZh ? notif.titleZh : notif.titleRu}
                    </span>
                    {!notif.isRead && (
                      <span className="badge-sticker bg-red-600 text-white text-[9px] py-0 px-1 font-mono">
                        NEW
                      </span>
                    )}
                  </div>

                  <p className="text-xs font-sans text-campus-muted leading-relaxed">
                    {isZh ? notif.messageZh : notif.messageRu}
                  </p>

                  <div className="text-[10px] font-mono text-campus-subtle pt-1">
                    {notif.createdAt}
                  </div>
                </div>

                {!notif.isRead && (
                  <button
                    type="button"
                    onClick={() => handleMarkRead(notif.id)}
                    className="btn-outline text-[11px] font-mono py-1 px-2 flex items-center gap-1 flex-shrink-0 cursor-pointer"
                    title={isZh ? '标为已读' : 'Прочитано'}
                  >
                    <Check className="w-3 h-3 text-green-600" />
                    <span>{isZh ? '已读' : 'OK'}</span>
                  </button>
                )}
              </div>
            ))
          ) : (
            <div className="bg-campus-surface border border-campus-border p-8 text-center font-mono text-xs text-campus-subtle">
              {isZh ? '暂无任何新通知。' : 'Уведомлений пока нет.'}
            </div>
          )}
        </div>
      )}

      {/* 4.4 Закладки с AI-итогом */}
      {profileTab === 'bookmarks' && (
        <div className="space-y-3">
          {bookmarkedPosts.length > 0 ? (
            bookmarkedPosts.map((p) => (
              <PostCard
                key={p.id}
                post={p}
                userPreferredLang={activeLanguage}
                currentUser={currentUser}
              />
            ))
          ) : (
            <div className="bg-campus-surface border border-campus-border p-8 text-center font-mono text-xs text-campus-subtle">
              {isZh ? '暂无已解决问题。' : 'Пока нет тем с готовым решением.'}
            </div>
          )}
        </div>
      )}

    </div>
  );
};
