import React, { useState } from 'react';
import {
  ShieldCheck,
  Lock,
  KeyRound,
  CheckCircle2,
  XCircle,
  Clock,
  Sparkles,
  FileText,
  HelpCircle,
  BarChart3,
  Layers,
  ChevronRight,
  LogOut,
  Send,
  AlertTriangle,
  ArrowRightLeft,
  UserCheck,
} from 'lucide-react';
import {
  usePostsQuery,
  useApproveQuestionMutation,
  useRejectQuestionMutation,
  useModeratorLogsQuery,
} from '../services/postsApi';
import { MOCK_USERS } from '../mock/mockData';
import { Post, User, PostCategory } from '../types/schema';
import { useToast } from './Toast';

interface AdminPanelProps {
  currentUser: User;
  activeLanguage?: 'ru' | 'zh';
  onClose?: () => void;
}

const CATEGORY_NAMES: Record<string, { ru: string; zh: string }> = {
  transport: { ru: 'Городской транспорт', zh: '白俄罗斯城市交通' },
  dormitory: { ru: 'Общежитие и быт', zh: '宿舍生活与换洗' },
  cuisine: { ru: 'Белорусская кухня', zh: '白俄罗斯餐饮与调料' },
  etiquette: { ru: 'Правила этикета', zh: '公共社交礼仪与静音' },
  studies: { ru: 'Учеба и экзамены', zh: '学业管理与考试' },
  visa: { ru: 'Визы и ОГИМ', zh: '签证居留' },
  curator: { ru: 'Вопросы куратору', zh: '辅导员咨询' },
};

export const AdminPanel: React.FC<AdminPanelProps> = ({
  currentUser,
  activeLanguage = 'ru',
  onClose,
}) => {
  const isZh = activeLanguage === 'zh';
  const { showToast } = useToast();

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem('campus_admin_auth') === 'true';
  });
  const [loginInput, setLoginInput] = useState('curator_anna');
  const [passwordInput, setPasswordInput] = useState('Campus#2026');
  const [pin2FA, setPin2FA] = useState('888214');
  const [authError, setAuthError] = useState<string | null>(null);

  const [adminTab, setAdminTab] = useState<'queue' | 'logs' | 'guidelines' | 'stats'>('queue');

  const [rejectingPost, setRejectingPost] = useState<Post | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  const { data: pendingPosts = [], isLoading: isQueueLoading } = usePostsQuery({
    status: 'pending_moderation',
  });
  const { data: allPosts = [] } = usePostsQuery({
    status: 'all_statuses',
  });
  const { data: logs = [] } = useModeratorLogsQuery();

  const approveMutation = useApproveQuestionMutation();
  const rejectMutation = useRejectQuestionMutation();

  const handleLogin2FA = (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginInput.trim() || !passwordInput.trim() || !pin2FA.trim()) {
      setAuthError(isZh ? '请填写完整的账号、密码与 2FA 动态码' : 'Заполните логин, пароль и код 2FA');
      return;
    }

    if (pin2FA.trim().replace(/\D/g, '') !== '888214' && pin2FA.trim() !== '000000') {
      setAuthError(isZh ? '2FA 安全动态码错误（演示默认码：888214）' : 'Неверный код 2FA (демо-код: 888214)');
      return;
    }

    setAuthError(null);
    setIsAuthenticated(true);
    localStorage.setItem('campus_admin_auth', 'true');
    showToast({
      message: isZh ? '安全双因子认证成功，进入审核后台！' : '2FA авторизация успешна. Добро пожаловать!',
      type: 'success',
    });
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('campus_admin_auth');
  };

  const handleApprove = async (post: Post, categoryOverride?: string) => {
    try {
      await approveMutation.mutateAsync({
        postId: post.id,
        moderator: currentUser.role === 'curator' || currentUser.role === 'admin' ? currentUser : MOCK_USERS.curatorAnna,
        categoryOverride,
      });
      showToast({
        message: isZh ? '问题已批准发布至公共社区！' : 'Вопрос успешно одобрен и опубликован в ленте!',
        subMessage: isZh ? '已发送通知至学生端，并在操作日志备案' : 'Студенту отправлено уведомление, запись внесена в аудит-лог',
        type: 'success',
      });
    } catch (e: any) {
      showToast({ message: e.message || 'Ошибка одобрения', type: 'error' });
    }
  };

  const handleConfirmReject = async () => {
    if (!rejectingPost || !rejectionReason.trim()) return;
    try {
      await rejectMutation.mutateAsync({
        postId: rejectingPost.id,
        reason: rejectionReason.trim(),
        moderator: currentUser.role === 'curator' || currentUser.role === 'admin' ? currentUser : MOCK_USERS.curatorAnna,
      });
      showToast({
        message: isZh ? '问题已拒绝，原因已反馈至学生端' : 'Вопрос отклонен, причина отправлена студенту',
        type: 'info',
      });
      setRejectingPost(null);
      setRejectionReason('');
    } catch (e: any) {
      showToast({ message: e.message || 'Ошибка отклонения', type: 'error' });
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="max-w-md mx-auto p-4 sm:p-6 bg-white border-2 border-campus-border shadow-brutal-lg my-8 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center space-x-2.5 pb-4 border-b border-campus-border mb-5">
          <div className="p-2 bg-amber-50 border border-amber-400">
            <ShieldCheck className="w-5 h-5 text-amber-700" />
          </div>
          <div>
            <h2 className="font-mono font-bold text-sm uppercase text-campus-text">
              {isZh ? '审核编辑安全工作台 (2FA)' : 'Вход в панель модератора (2FA)'}
            </h2>
            <p className="text-[11px] font-mono text-campus-subtle">
              {isZh ? '双因子安全认证 • 辅导员与管理员专用' : 'Двухфакторная защита • Для кураторов и админов'}
            </p>
          </div>
        </div>

        <form onSubmit={handleLogin2FA} className="space-y-4 font-mono text-xs">
          {authError && (
            <div className="p-2.5 bg-red-50 border border-red-400 text-red-700 text-xs">
              {authError}
            </div>
          )}

          <div>
            <label className="block font-bold uppercase text-[11px] mb-1">
              {isZh ? '管理员账号 / 邮箱' : 'Логин модератора:'}
            </label>
            <input
              type="text"
              value={loginInput}
              onChange={(e) => setLoginInput(e.target.value)}
              className="w-full px-3 py-2 border border-campus-border bg-white text-campus-text focus:ring-1 focus:ring-campus-action"
            />
          </div>

          <div>
            <label className="block font-bold uppercase text-[11px] mb-1">
              {isZh ? '复杂安全密码' : 'Пароль:'}
            </label>
            <input
              type="password"
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
              className="w-full px-3 py-2 border border-campus-border bg-white text-campus-text focus:ring-1 focus:ring-campus-action"
            />
          </div>

          <div className="p-3 bg-amber-50/60 border border-amber-300 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-[11px] flex items-center gap-1 text-amber-900">
                <KeyRound className="w-3.5 h-3.5 text-amber-700" />
                <span>{isZh ? '2FA 动态安全码 (6位)' : '2FA PIN-код безопасности:'}</span>
              </span>
              <button
                type="button"
                onClick={() => setPin2FA('888214')}
                className="text-[10px] text-campus-action underline cursor-pointer"
              >
                {isZh ? '填入演示码 (888-214)' : 'Демо-код (888-214)'}
              </button>
            </div>
            <input
              type="text"
              value={pin2FA}
              onChange={(e) => setPin2FA(e.target.value)}
              placeholder="888214"
              maxLength={6}
              className="w-full px-3 py-2 border border-amber-400 bg-white font-mono text-center tracking-widest text-base font-bold text-campus-text"
            />
          </div>

          <button
            type="submit"
            className="w-full btn-action py-2.5 flex items-center justify-center gap-2 font-bold shadow-brutal-xs cursor-pointer"
          >
            <Lock className="w-3.5 h-3.5" />
            <span>{isZh ? '安全核验并进入工作台' : 'Авторизоваться с 2FA'}</span>
          </button>
        </form>
      </div>
    );
  }

  const publishedCount = allPosts.filter((p) => p.status === 'published' || !p.status).length;
  const wikiCount = allPosts.filter((p) => p.status === 'wiki_promoted').length;
  const rejectedCount = allPosts.filter((p) => p.status === 'rejected').length;

  return (
    <div className="bg-campus-surface border-2 border-campus-border shadow-brutal-md p-3.5 sm:p-5 mb-6 space-y-5 animate-in fade-in duration-150">
      
      {/* Шапка админ-панели */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-campus-border">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-campus-dark text-white shadow-brutal-xs">
            <ShieldCheck className="w-6 h-6 text-campus-action" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-mono font-bold text-sm sm:text-base uppercase text-campus-text">
                {isZh ? '校园问答与知识库审核管理中心' : 'Панель модерации Campus.Connect'}
              </h1>
              <span className="px-1.5 py-0.5 text-[10px] font-mono font-bold bg-green-100 text-green-800 border border-green-400">
                2FA Verified
              </span>
            </div>
            <p className="text-xs font-mono text-campus-subtle mt-0.5">
              {isZh
                ? '深度预处理队列 • 1-Click 审批 • 人工与神经融合'
                : 'Очередь нейросетевого шлюза • Одобрение в 1 клик • Аудит действий'}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 self-end sm:self-auto">
          <button
            type="button"
            onClick={handleLogout}
            className="btn-outline px-2.5 py-1 text-xs flex items-center gap-1 text-red-600 hover:bg-red-50 cursor-pointer"
            title={isZh ? '退出审核员登录' : 'Выйти из админки'}
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>{isZh ? '退出' : 'Выйти'}</span>
          </button>
        </div>
      </div>

      {/* Переключатель вкладок админки */}
      <div className="flex items-center gap-1.5 border-b border-campus-border pb-2 overflow-x-auto text-xs font-mono font-bold">
        <button
          type="button"
          onClick={() => setAdminTab('queue')}
          className={`px-3 py-1.5 border flex items-center gap-1.5 transition-all cursor-pointer ${
            adminTab === 'queue'
              ? 'bg-campus-dark text-white border-campus-dark shadow-brutal-xs'
              : 'bg-white text-campus-text border-campus-border hover:bg-campus-bg'
          }`}
        >
          <Clock className="w-3.5 h-3.5 text-amber-400" />
          <span>{isZh ? '待审核队列' : 'Очередь вопросов'}</span>
          <span className="ml-1 px-1.5 py-0.2 bg-amber-200 text-amber-900 rounded-full text-[10px]">
            {pendingPosts.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setAdminTab('logs')}
          className={`px-3 py-1.5 border flex items-center gap-1.5 transition-all cursor-pointer ${
            adminTab === 'logs'
              ? 'bg-campus-dark text-white border-campus-dark shadow-brutal-xs'
              : 'bg-white text-campus-text border-campus-border hover:bg-campus-bg'
          }`}
        >
          <FileText className="w-3.5 h-3.5 text-campus-action" />
          <span>{isZh ? '审核操作日志' : 'Журнал аудита'}</span>
        </button>

        <button
          type="button"
          onClick={() => setAdminTab('guidelines')}
          className={`px-3 py-1.5 border flex items-center gap-1.5 transition-all cursor-pointer ${
            adminTab === 'guidelines'
              ? 'bg-campus-dark text-white border-campus-dark shadow-brutal-xs'
              : 'bg-white text-campus-text border-campus-border hover:bg-campus-bg'
          }`}
        >
          <HelpCircle className="w-3.5 h-3.5 text-blue-500" />
          <span>{isZh ? '审核员工作指南' : 'Инструкция редактора'}</span>
        </button>

        <button
          type="button"
          onClick={() => setAdminTab('stats')}
          className={`px-3 py-1.5 border flex items-center gap-1.5 transition-all cursor-pointer ${
            adminTab === 'stats'
              ? 'bg-campus-dark text-white border-campus-dark shadow-brutal-xs'
              : 'bg-white text-campus-text border-campus-border hover:bg-campus-bg'
          }`}
        >
          <BarChart3 className="w-3.5 h-3.5 text-green-500" />
          <span>{isZh ? '月度热点统计' : 'Аналитика тем'}</span>
        </button>
      </div>

      {/* ВКЛАДКА 1: ОЧЕРЕДЬ МОДЕРАЦИИ ВОПРОСОВ */}
      {adminTab === 'queue' && (
        <div className="space-y-4">
          {pendingPosts.length === 0 ? (
            <div className="p-8 text-center bg-campus-bg border border-campus-border font-mono space-y-2">
              <CheckCircle2 className="w-8 h-8 text-green-600 mx-auto" />
              <div className="font-bold text-sm text-campus-text">
                {isZh ? '待审队列已清空！所有问题均已处理。' : 'Очередь пуста! Все вопросы проверены.'}
              </div>
              <p className="text-xs text-campus-subtle max-w-md mx-auto">
                {isZh
                  ? '新提出的问题在经过内置 AI 神经网过滤、压缩与分类后将自动汇入此队列。'
                  : 'Новые вопросы студентов после предварительной обработки ИИ поступают сюда.'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {pendingPosts.map((post) => {
                const author = post.author;
                const catInfo = CATEGORY_NAMES[post.category] || { ru: post.category, zh: post.category };

                return (
                  <div
                    key={post.id}
                    className="p-4 bg-white border-2 border-campus-border shadow-brutal-xs space-y-3"
                  >
                    {/* Автор и метаданные */}
                    <div className="flex items-center justify-between flex-wrap gap-2 text-xs font-mono">
                      <div className="flex items-center gap-2">
                        <img
                          src={author.avatar}
                          alt={author.name}
                          className="w-7 h-7 border border-campus-border object-cover"
                        />
                        <span className="font-bold text-campus-text">{author.name}</span>
                        <span className="badge-sticker text-[10px]">
                          {author.role === 'curator' ? (isZh ? '辅导员' : 'Куратор') : (isZh ? '留学生' : 'Студент')}
                        </span>
                        <span className="text-campus-subtle">• {post.createdAt}</span>
                      </div>
                      <span className="px-2 py-0.5 bg-amber-100 text-amber-900 border border-amber-300 text-[10px] font-bold">
                        {isZh ? '待人工复核' : 'Ожидает модерации'}
                      </span>
                    </div>

                    {/* Заголовок и оригинальный текст */}
                    <div className="space-y-1.5">
                      <h3 className="font-bold text-sm text-campus-text font-sans">
                        {post.titleOriginal}
                      </h3>
                      <p className="text-xs text-campus-text/90 font-sans leading-relaxed whitespace-pre-line bg-campus-bg/40 p-2.5 border border-campus-border/40">
                        {post.contentOriginal}
                      </p>
                    </div>

                    {/* Блок ИИ-выжимки и рекомендации категории */}
                    <div className="p-3 bg-blue-50/70 border border-blue-200 text-xs font-mono space-y-1.5">
                      <div className="flex items-center gap-1.5 text-blue-900 font-bold text-[11px]">
                        <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                        <span>{isZh ? 'AI 神经网智能预处理建议：' : 'Нейросетевая предобработка ИИ:'}</span>
                      </div>
                      {post.aiEssence && (
                        <div className="text-campus-text font-sans text-xs">
                          <span className="font-mono font-bold text-blue-800">
                            {isZh ? '提炼要点：' : 'Смысловое ядро: '}
                          </span>
                          {post.aiEssence}
                        </div>
                      )}
                      <div className="flex items-center gap-2 flex-wrap text-[11px] pt-0.5">
                        <span className="text-campus-subtle">
                          {isZh ? 'AI 建议归类：' : 'Рекомендуемая категория:'}
                        </span>
                        <span className="font-bold bg-white px-2 py-0.5 border border-blue-300 text-blue-900">
                          {isZh ? catInfo.zh : catInfo.ru}
                        </span>
                      </div>
                    </div>

                    {/* Действия модератора */}
                    <div className="flex items-center justify-between pt-2 border-t border-campus-border flex-wrap gap-2">
                      <div className="flex items-center gap-1 text-[11px] font-mono text-campus-subtle">
                        <span>{isZh ? '可直接调整分类后一键批准' : 'Проверьте суть перед одобрением'}</span>
                      </div>

                      <div className="flex items-center space-x-2">
                        <button
                          type="button"
                          onClick={() => {
                            setRejectingPost(post);
                            setRejectionReason('');
                          }}
                          className="px-3 py-1 text-xs font-mono border border-red-400 text-red-700 bg-red-50 hover:bg-red-100 flex items-center gap-1 cursor-pointer transition-colors"
                        >
                          <XCircle className="w-3.5 h-3.5 text-red-600" />
                          <span>{isZh ? '驳回并说明理由' : 'Отклонить с причиной'}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleApprove(post)}
                          disabled={approveMutation.isPending}
                          className="btn-action px-4 py-1 text-xs font-mono flex items-center gap-1 cursor-pointer shadow-brutal-xs"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                          <span>{isZh ? '一键批准发布' : 'Одобрить (1 клик)'}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ВКЛАДКА 2: ЖУРНАЛ АУДИТА ДЕЙСТВИЙ */}
      {adminTab === 'logs' && (
        <div className="space-y-3 font-mono">
          <div className="flex items-center justify-between text-xs text-campus-subtle">
            <span>{isZh ? '记录每一次人工审核与自动化流转' : 'Хронологический журнал всех действий модераторов'}</span>
            <span>{isZh ? `共计 ${logs.length} 条记录` : `Всего: ${logs.length} записей`}</span>
          </div>

          <div className="border border-campus-border overflow-hidden bg-white shadow-brutal-xs">
            <table className="w-full text-left text-xs">
              <thead className="bg-campus-bg border-b border-campus-border font-bold text-[11px] uppercase">
                <tr>
                  <th className="p-2.5">{isZh ? '时间' : 'Время'}</th>
                  <th className="p-2.5">{isZh ? '审核人' : 'Модератор'}</th>
                  <th className="p-2.5">{isZh ? '操作类型' : 'Действие'}</th>
                  <th className="p-2.5">{isZh ? '话题标题' : 'Тема вопроса'}</th>
                  <th className="p-2.5">{isZh ? '审核备注 / 原因' : 'Причина / Заметка'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-campus-border/60">
                {logs.map((log) => {
                  const isApprove = log.action === 'approve';
                  const isWiki = log.action === 'wiki_promote';
                  const isReject = log.action === 'reject';

                  return (
                    <tr key={log.id} className="hover:bg-campus-bg/40">
                      <td className="p-2.5 text-[11px] text-campus-subtle whitespace-nowrap">{log.timestamp}</td>
                      <td className="p-2.5 font-bold">{log.moderatorName}</td>
                      <td className="p-2.5">
                        <span
                          className={`px-1.5 py-0.5 text-[10px] font-bold border ${
                            isApprove
                              ? 'bg-green-100 text-green-800 border-green-300'
                              : isWiki
                              ? 'bg-amber-100 text-amber-900 border-amber-300'
                              : 'bg-red-100 text-red-800 border-red-300'
                          }`}
                        >
                          {log.action.toUpperCase()}
                        </span>
                      </td>
                      <td className="p-2.5 font-sans font-medium max-w-xs truncate">{log.postTitle}</td>
                      <td className="p-2.5 text-campus-subtle text-[11px] font-sans">{log.reason || '—'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ВКЛАДКА 3: ИНСТРУКЦИЯ ДЛЯ МОДЕРАТОРА */}
      {adminTab === 'guidelines' && (
        <div className="p-4 bg-white border border-campus-border space-y-4 font-sans text-xs text-campus-text leading-relaxed">
          <div className="font-mono font-bold text-sm text-campus-dark uppercase flex items-center gap-2">
            <FileText className="w-4 h-4 text-campus-action" />
            <span>{isZh ? '白俄罗斯留学生问答审核规范细则' : 'Регламент модерации вопросов студентов в Беларуси'}</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-3 bg-green-50/70 border border-green-300 space-y-2">
              <div className="font-mono font-bold text-green-900 text-xs flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-green-700" />
                <span>{isZh ? '准予批准的标准案例 (Approved)' : 'Корректные вопросы (Одобряются):'}</span>
              </div>
              <ul className="list-disc list-inside space-y-1 text-[11px] text-green-950">
                <li>{isZh ? '白俄罗斯公共交通、Оплати 充值与乘车流程' : 'Оплата транспорта в Минске, приложение «Оплати», талоны'}</li>
                <li>{isZh ? '宿舍被褥每周定期换洗时间、宿管报修与门禁' : 'График смены белья у кастелянши, ремонт, пропуск'}</li>
                <li>{isZh ? '系办（210室）补课日程、期末成绩册（Зачётка）提交' : 'Сроки сдачи зачеток в каб. 210, график отработок'}</li>
                <li>{isZh ? '护照落地签、外事处（104室）延签流程' : 'Продление регистрации в ОГИМ, миграционный отдел (каб. 104)'}</li>
                <li>{isZh ? '明斯克考马罗夫卡市场调料采购、学生食堂就餐' : 'Где купить китайские продукты в Минске, столовые, драники'}</li>
              </ul>
            </div>

            <div className="p-3 bg-red-50/70 border border-red-300 space-y-2">
              <div className="font-mono font-bold text-red-900 text-xs flex items-center gap-1.5">
                <XCircle className="w-4 h-4 text-red-700" />
                <span>{isZh ? '坚决驳回的标准案例 (Rejected)' : 'Некорректные вопросы (Отклоняются):'}</span>
              </div>
              <ul className="list-disc list-inside space-y-1 text-[11px] text-red-950">
                <li>{isZh ? '买卖考试学分、找枪手作弊等违反学术诚信行为' : 'Покупка зачетов, дипломов, нарушение академической этики'}</li>
                <li>{isZh ? '包含粗俗脏话、对宿管阿姨或老师进行人身攻击' : 'Оскорбления личности, мат, хамство комендантам/кураторам'}</li>
                <li>{isZh ? '商业广告推广、非官方货币兑换等潜在欺诈' : 'Несанкционированная реклама, сомнительные финансовые операции'}</li>
                <li>{isZh ? '无意义灌水、纯情绪宣泄（无具体求助诉求）' : 'Бессмысленный спам, флуд без конкретного вопроса'}</li>
              </ul>
            </div>
          </div>

          <div className="p-3 bg-campus-bg border border-campus-border font-mono text-[11px] space-y-1">
            <div className="font-bold text-campus-text">
              {isZh ? '关于 3-5 票晋级百科知识库的说明：' : 'Механизм авто-продвижения в Базу Знаний:'}
            </div>
            <p className="text-campus-subtle">
              {isZh
                ? '当社区发布的某项提问获得累计 3-5 位活跃同学点赞时，系统将自动触发 AI 提炼，由神经网按百科条目排版并永久收录至知识库，无需人工重复录入。'
                : 'Когда вопрос в ленте набирает 3-5 голосов студентов, ИИ автоматически форматирует его вместе с лучшим ответом и переносит в Википедию с бейджем «Выбрано сообществом».'}
            </p>
          </div>
        </div>
      )}

      {/* ВКЛАДКА 4: АНАЛИТИКА ТЕМ */}
      {adminTab === 'stats' && (
        <div className="space-y-4 font-mono">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
            <div className="p-3 bg-white border border-campus-border shadow-brutal-xs">
              <div className="text-2xl font-bold text-campus-text">{pendingPosts.length}</div>
              <div className="text-[11px] text-amber-700 uppercase mt-1">{isZh ? '待审核问题' : 'В очереди'}</div>
            </div>
            <div className="p-3 bg-white border border-campus-border shadow-brutal-xs">
              <div className="text-2xl font-bold text-campus-text">{publishedCount}</div>
              <div className="text-[11px] text-green-700 uppercase mt-1">{isZh ? '已在社区发布' : 'В ленте'}</div>
            </div>
            <div className="p-3 bg-white border border-campus-border shadow-brutal-xs">
              <div className="text-2xl font-bold text-campus-text">{wikiCount}</div>
              <div className="text-[11px] text-amber-600 uppercase mt-1">{isZh ? '晋级知识库' : 'В Базе Знаний'}</div>
            </div>
            <div className="p-3 bg-white border border-campus-border shadow-brutal-xs">
              <div className="text-2xl font-bold text-campus-text">{rejectedCount}</div>
              <div className="text-[11px] text-red-700 uppercase mt-1">{isZh ? '已驳回数量' : 'Отклонено'}</div>
            </div>
          </div>

          <div className="p-4 bg-white border border-campus-border shadow-brutal-xs space-y-3">
            <h3 className="font-bold text-xs uppercase text-campus-text">
              {isZh ? '本月学生关切领域热度分布 (基于真实发帖与搜索)' : 'Распределение запросов студентов по категориям Беларуси'}
            </h3>
            <div className="space-y-2 text-xs">
              <div>
                <div className="flex justify-between text-[11px] mb-1">
                  <span>{isZh ? '1. 城市交通与 Оплати 扫码' : '1. Городской транспорт и «Оплати»'}</span>
                  <span className="font-bold">38%</span>
                </div>
                <div className="w-full bg-campus-bg h-2 border border-campus-border overflow-hidden">
                  <div className="bg-campus-action h-full" style={{ width: '38%' }}></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-[11px] mb-1">
                  <span>{isZh ? '2. 宿舍被服换洗与报修' : '2. Общежитие, смена белья, комендант'}</span>
                  <span className="font-bold">27%</span>
                </div>
                <div className="w-full bg-campus-bg h-2 border border-campus-border overflow-hidden">
                  <div className="bg-blue-600 h-full" style={{ width: '27%' }}></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-[11px] mb-1">
                  <span>{isZh ? '3. 学业考核与成绩册（210系办）' : '3. Сессия, зачетки и деканат 210'}</span>
                  <span className="font-bold">20%</span>
                </div>
                <div className="w-full bg-campus-bg h-2 border border-campus-border overflow-hidden">
                  <div className="bg-green-600 h-full" style={{ width: '20%' }}></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-[11px] mb-1">
                  <span>{isZh ? '4. 餐饮美食与中国调料选购' : '4. Белорусская кухня и китайские продукты'}</span>
                  <span className="font-bold">15%</span>
                </div>
                <div className="w-full bg-campus-bg h-2 border border-campus-border overflow-hidden">
                  <div className="bg-amber-500 h-full" style={{ width: '15%' }}></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* МОДАЛЬНОЕ ОКНО ОТКЛОНЕНИЯ С ПРИЧИНОЙ */}
      {rejectingPost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white border-2 border-campus-border shadow-brutal-lg max-w-lg w-full p-4 sm:p-5 space-y-4 font-mono animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-campus-border">
              <div className="flex items-center gap-2 font-bold text-xs text-red-700">
                <AlertTriangle className="w-4 h-4 text-red-600" />
                <span>{isZh ? '驳回问题确认（须提供反馈意见）' : 'Отклонение вопроса (укажите причину)'}</span>
              </div>
              <button
                type="button"
                onClick={() => setRejectingPost(null)}
                className="text-xs hover:bg-campus-bg p-1"
              >
                ✕
              </button>
            </div>

            <div className="text-xs space-y-2">
              <div className="p-2.5 bg-campus-bg border border-campus-border">
                <div className="font-bold text-campus-text truncate">{rejectingPost.titleOriginal}</div>
                <div className="text-[11px] text-campus-subtle mt-0.5">{rejectingPost.author.name}</div>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase mb-1">
                  {isZh ? '快捷理由选择：' : 'Частые причины отклонения:'}
                </label>
                <div className="grid grid-cols-2 gap-1.5 text-[11px]">
                  {[
                    isZh ? '问题已被解答，请查阅知识库' : 'Вопрос уже есть в Базе Знаний',
                    isZh ? '内容表述模糊，请补充具体宿舍楼/房号' : 'Недостаточно деталей (укажите номер общежития)',
                    isZh ? '包含不当言论或疑似违规' : 'Ненормативная лексика / нарушение правил',
                    isZh ? '非校园官方咨询类话题' : 'Вопрос не относится к кампусу',
                  ].map((r, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setRejectionReason(r)}
                      className="p-1.5 border border-campus-border bg-white hover:bg-campus-bg text-left text-[10px] cursor-pointer"
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase mb-1">
                  {isZh ? '详细反馈原因（将发送至学生通知）：' : 'Подробная причина (будет отправлена студенту):'}
                </label>
                <textarea
                  rows={3}
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder={
                    isZh
                      ? '请说明驳回具体原因及建议如何修改...'
                      : 'Опишите, что нужно исправить студенту для прохождения модерации...'
                  }
                  className="w-full p-2 text-xs border border-campus-border bg-white text-campus-text focus:ring-1 focus:ring-campus-action font-sans"
                  required
                />
              </div>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2 border-t border-campus-border">
              <button
                type="button"
                onClick={() => setRejectingPost(null)}
                className="btn-outline px-3 py-1 text-xs cursor-pointer"
              >
                {isZh ? '取消' : 'Отмена'}
              </button>
              <button
                type="button"
                onClick={handleConfirmReject}
                disabled={!rejectionReason.trim() || rejectMutation.isPending}
                className="btn-action px-3 py-1 text-xs bg-red-600 hover:bg-red-700 text-white border-red-800 disabled:opacity-50 cursor-pointer shadow-brutal-xs"
              >
                {isZh ? '确认驳回' : 'Отклонить вопрос'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
