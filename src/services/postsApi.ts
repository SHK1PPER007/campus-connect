import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  INITIAL_POSTS,
  INITIAL_WIKI_ARTICLES,
  INITIAL_MODERATOR_LOGS,
  INITIAL_STUDENT_NOTIFICATIONS,
  CURRENT_USER,
  MOCK_USERS,
} from '../mock/mockData';
import {
  Comment,
  CreatePostInput,
  Language,
  Post,
  User,
  WikiArticle,
  ModeratorLog,
  StudentNotification,
  QuestionStatus,
} from '../types/schema';
import { generateThreadSummary, translateCampusText } from './aiServices';
import {
  compressQuestionEssence,
  suggestCategoryAndSubcategory,
  formatCommunityAnswerToWiki,
} from './moderationService';

const POSTS_STORAGE_KEY = 'campus_posts_storage_v4';
const WIKI_STORAGE_KEY = 'campus_wiki_articles_v1';
const LOGS_STORAGE_KEY = 'campus_moderator_logs_v1';
const NOTIFS_STORAGE_KEY = 'campus_student_notifications_v1';

const hasStorage = typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
const nodeStorageFallback: Record<string, string> = {};

function safeGetItem(key: string): string | null {
  if (hasStorage) {
    try {
      return window.localStorage.getItem(key);
    } catch {
      return null;
    }
  }
  return nodeStorageFallback[key] || null;
}

function safeSetItem(key: string, val: string): void {
  if (hasStorage) {
    try {
      window.localStorage.setItem(key, val);
    } catch {
    }
  } else {
    nodeStorageFallback[key] = val;
  }
}

function loadPersistedPosts(): Post[] {
  try {
    const saved = safeGetItem(POSTS_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.warn('Failed to load persisted posts', e);
  }
  return [...INITIAL_POSTS];
}

export function persistPosts(posts: Post[]): void {
  try {
    safeSetItem(POSTS_STORAGE_KEY, JSON.stringify(posts));
  } catch (e) {
    console.warn('Failed to save posts to localStorage', e);
  }
}

let memoryPosts: Post[] = loadPersistedPosts();

function loadPersistedWiki(): WikiArticle[] {
  try {
    const saved = safeGetItem(WIKI_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.warn('Failed to load persisted wiki', e);
  }
  return [...INITIAL_WIKI_ARTICLES];
}

export function persistWiki(articles: WikiArticle[]): void {
  try {
    safeSetItem(WIKI_STORAGE_KEY, JSON.stringify(articles));
  } catch (e) {
    console.warn('Failed to save wiki to localStorage', e);
  }
}

let memoryWikiArticles: WikiArticle[] = loadPersistedWiki();

function loadPersistedLogs(): ModeratorLog[] {
  try {
    const saved = safeGetItem(LOGS_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.warn('Failed to load persisted logs', e);
  }
  return [...INITIAL_MODERATOR_LOGS];
}

export function persistLogs(logs: ModeratorLog[]): void {
  try {
    safeSetItem(LOGS_STORAGE_KEY, JSON.stringify(logs));
  } catch (e) {
    console.warn('Failed to save logs to localStorage', e);
  }
}

let memoryLogs: ModeratorLog[] = loadPersistedLogs();

function loadPersistedNotifications(): StudentNotification[] {
  try {
    const saved = safeGetItem(NOTIFS_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.warn('Failed to load persisted notifications', e);
  }
  return [...INITIAL_STUDENT_NOTIFICATIONS];
}

export function persistNotifications(notifs: StudentNotification[]): void {
  try {
    safeSetItem(NOTIFS_STORAGE_KEY, JSON.stringify(notifs));
  } catch (e) {
    console.warn('Failed to save notifications to localStorage', e);
  }
}

let memoryNotifications: StudentNotification[] = loadPersistedNotifications();

/**
 * Получение списка постов с фильтрами.
 * По умолчанию в публичную ленту возвращаются только 'published' и 'wiki_promoted'.
 * Редактор может запросить status='all_statuses' или status='pending_moderation'.
 */
export async function apiGetPosts(params?: {
  category?: string;
  onlyResolved?: boolean;
  searchQuery?: string;
  sortBy?: 'popular' | 'newest' | 'resolved';
  status?: QuestionStatus | 'all_statuses';
  authorId?: string;
}): Promise<Post[]> {
  await new Promise((resolve) => setTimeout(resolve, 150));

  let filtered = [...memoryPosts];

  if (params?.status && params.status !== 'all_statuses') {
    filtered = filtered.filter((p) => p.status === params.status);
  } else if (!params?.status && !params?.authorId) {
    filtered = filtered.filter(
      (p) => p.status === 'published' || p.status === 'wiki_promoted' || !p.status
    );
  }

  if (params?.authorId) {
    filtered = filtered.filter((p) => p.author.id === params.authorId);
  }

  if (params?.category && params.category !== 'all') {
    filtered = filtered.filter((p) => p.category === params.category);
  }

  if (params?.onlyResolved) {
    filtered = filtered.filter((p) => p.isResolved);
  }

  if (params?.searchQuery && params.searchQuery.trim() !== '') {
    const q = params.searchQuery.toLowerCase();
    filtered = filtered.filter(
      (p) =>
        p.titleOriginal.toLowerCase().includes(q) ||
        p.titleTranslated.toLowerCase().includes(q) ||
        p.contentOriginal.toLowerCase().includes(q) ||
        p.contentTranslated.toLowerCase().includes(q) ||
        p.tags.some((t) => t.toLowerCase().includes(q))
    );
  }

  if (params?.sortBy === 'popular') {
    filtered.sort(
      (a, b) =>
        (b.communityVotes || 0) * 3 +
        (b.likes || 0) +
        b.commentsCount * 2 -
        ((a.communityVotes || 0) * 3 + (a.likes || 0) + a.commentsCount * 2)
    );
  } else if (params?.sortBy === 'resolved') {
    filtered.sort((a, b) => (b.isResolved ? 1 : 0) - (a.isResolved ? 1 : 0));
  }

  return filtered;
}

/**
 * Получение одного поста
 */
export async function apiGetPostById(id: string): Promise<Post | undefined> {
  await new Promise((resolve) => setTimeout(resolve, 100));
  return memoryPosts.find((p) => p.id === id);
}

/**
 * Создание нового вопроса студентом.
 * Проходит нейросетевую предобработку (сжатие сути, автоопределение категории)
 * и направляется в статус pending_moderation в очередь редактора.
 */
export async function apiCreatePost(
  input: CreatePostInput & { author?: User },
  authorParam?: User
): Promise<Post> {
  const author: User = authorParam || input.author || MOCK_USERS.zhangWei;
  const fromLang: Language = input.lang;
  const toLang: Language = fromLang === 'zh' ? 'ru' : 'zh';

  const essenceResult = compressQuestionEssence({
    title: input.title,
    content: input.content,
    lang: fromLang,
  });

  const suggestedCategory = suggestCategoryAndSubcategory(`${input.title} ${input.content}`);

  const translatedTitle = await translateCampusText({
    text: input.title,
    fromLang,
    toLang,
  });

  const translatedContent = await translateCampusText({
    text: input.content,
    fromLang,
    toLang,
  });

  const newPost: Post = {
    id: `post-${Date.now()}`,
    titleOriginal: input.title,
    titleTranslated: translatedTitle,
    contentOriginal: input.content,
    contentTranslated: translatedContent,
    author,
    langOriginal: fromLang,
    langTranslated: toLang,
    category: input.category !== 'all' ? input.category : suggestedCategory.category,
    tags: input.tags.length > 0 ? input.tags : suggestedCategory.tags,
    status: 'pending_moderation', // Вопрос ждет подтверждения редактора
    aiEssence: fromLang === 'zh' ? essenceResult.essenceZh : essenceResult.essenceRu,
    aiSuggestedCategory: suggestedCategory.category,
    communityVotes: 0,
    isResolved: false,
    mergedQuestions: [],
    commentsCount: 0,
    comments: [],
    views: 1,
    likes: 0,
    createdAt: 'Только что // 刚刚',
    pinned: false,
  };

  memoryPosts = [newPost, ...memoryPosts];
  persistPosts(memoryPosts);
  return newPost;
}

/**
 * Одобрение вопроса модератором (1 клик)
 */
export async function apiApproveQuestion(params: {
  postId: string;
  moderator: User;
  categoryOverride?: string;
}): Promise<Post> {
  const post = memoryPosts.find((p) => p.id === params.postId);
  if (!post) throw new Error('Вопрос не найден');

  post.status = 'published';
  post.moderatedBy = params.moderator.name;
  post.moderatedAt = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  if (params.categoryOverride && params.categoryOverride !== 'all') {
    post.category = params.categoryOverride as any;
  }
  persistPosts(memoryPosts);

  apiAddModeratorLog({
    moderatorName: params.moderator.name,
    moderatorRole: params.moderator.role,
    action: 'approve',
    postId: post.id,
    postTitle: post.titleOriginal,
    reason: 'Вопрос соответствует академическим нормам и одобрен для сообщества',
  });

  if (post.author?.id) {
    apiAddStudentNotification({
      userId: post.author.id,
      type: 'question_approved',
      titleRu: 'Ваш вопрос одобрен модератором',
      titleZh: '您的提问已通过审核并发布',
      messageRu: `Куратор ${params.moderator.name} одобрил(а) ваш вопрос «${post.titleOriginal}». Теперь он доступен всем студентам в ленте сообщества!`,
      messageZh: `审核老师 ${params.moderator.name} 已通过您的提问「${post.titleOriginal}」，现已在校园广场公开发布。`,
      postId: post.id,
    });
  }

  return { ...post };
}

/**
 * Отклонение вопроса модератором с обязательным указанием причины
 */
export async function apiRejectQuestion(params: {
  postId: string;
  reason: string;
  moderator: User;
}): Promise<Post> {
  const post = memoryPosts.find((p) => p.id === params.postId);
  if (!post) throw new Error('Вопрос не найден');

  post.status = 'rejected';
  post.rejectionReason = params.reason;
  post.moderatedBy = params.moderator.name;
  post.moderatedAt = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  persistPosts(memoryPosts);

  apiAddModeratorLog({
    moderatorName: params.moderator.name,
    moderatorRole: params.moderator.role,
    action: 'reject',
    postId: post.id,
    postTitle: post.titleOriginal,
    reason: params.reason,
  });

  apiAddStudentNotification({
    userId: post.author.id,
    type: 'question_rejected',
    titleRu: 'Вопрос отклонен модератором',
    titleZh: '提问未通过审核（附反馈原因）',
    messageRu: `Ваш вопрос «${post.titleOriginal}» был отклонен. Причина модератора: ${params.reason}`,
    messageZh: `您的提问「${post.titleOriginal}」未通过审核。审核反馈：${params.reason}`,
    postId: post.id,
  });

  return { ...post };
}

/**
 * Народное голосование за вопрос (Лайк / Upvote).
 * При достижении 3 голосов автоматически переносится в Базу Знаний!
 */
export async function apiVoteQuestion(postId: string): Promise<Post> {
  const post = memoryPosts.find((p) => p.id === postId);
  if (!post) throw new Error('Вопрос не найден');

  post.communityVotes = (post.communityVotes || 0) + 1;
  post.likes = (post.likes || 0) + 1;

  if (post.communityVotes >= 3 && post.status !== 'wiki_promoted') {
    await apiPromoteToWiki(postId);
  } else {
    persistPosts(memoryPosts);
  }

  return { ...post };
}

/**
 * Продвижение вопроса в Базу Знаний (Википедию) с AI-форматированием
 */
export async function apiPromoteToWiki(postId: string): Promise<WikiArticle> {
  const post = memoryPosts.find((p) => p.id === postId);
  if (!post) throw new Error('Вопрос не найден');

  let bestAnswer = post.comments.find((c) => c.isOfficialAnswer);
  if (!bestAnswer && post.comments.length > 0) {
    bestAnswer = [...post.comments].sort((a, b) => (b.likes || 0) - (a.likes || 0))[0];
  }

  const answerText = bestAnswer
    ? (post.langOriginal === 'zh' ? bestAnswer.contentOriginal : bestAnswer.contentTranslated)
    : (post.aiSummary ? (post.aiSummary.quickAnswerZh || post.aiSummary.quickAnswer) : post.contentOriginal);

  const formattedWiki = formatCommunityAnswerToWiki({
    questionTitle: post.titleOriginal,
    questionContent: post.contentOriginal,
    bestAnswerContent: answerText,
    category: post.category,
  });

  const newArticle: WikiArticle = {
    id: `wiki-comm-${Date.now()}`,
    category: post.category,
    titleRu: formattedWiki.titleRu,
    titleZh: formattedWiki.titleZh,
    contentRu: formattedWiki.contentRu,
    contentZh: formattedWiki.contentZh,
    keyStepsRu: formattedWiki.keyStepsRu,
    keyStepsZh: formattedWiki.keyStepsZh,
    badge: 'community_promoted',
    sourcePostId: post.id,
    votesCount: post.communityVotes || 3,
    viewsCount: post.views || 120,
    tags: formattedWiki.tags,
    updatedAt: new Date().toISOString().slice(0, 10),
  };

  memoryWikiArticles = [newArticle, ...memoryWikiArticles];
  persistWiki(memoryWikiArticles);

  post.status = 'wiki_promoted';
  post.promotedToWikiAt = 'Сегодня // 刚刚';
  persistPosts(memoryPosts);

  apiAddModeratorLog({
    moderatorName: 'Система (AI Community Promotion)',
    moderatorRole: 'admin',
    action: 'wiki_promote',
    postId: post.id,
    postTitle: post.titleOriginal,
    reason: `Вопрос набрал ${post.communityVotes} голосов студентов и перенесен в Базу Знаний`,
  });

  apiAddStudentNotification({
    userId: post.author.id,
    type: 'wiki_promoted',
    titleRu: '⭐ Ваш вопрос перенесен в Базу Знаний!',
    titleZh: '⭐ 恭喜！您的提问已被收录进知识库！',
    messageRu: `Тема «${post.titleOriginal}» набрала ${post.communityVotes} голосов студентов и стала официальной статьей Википедии с бейджем «Выбрано сообществом».`,
    messageZh: `您的提问「${post.titleOriginal}」获得了 ${post.communityVotes} 位同学点赞认同，已由AI自动提炼录入官方知识库！`,
    postId: post.id,
  });

  return newArticle;
}

/**
 * Добавление комментария с синхронным переводом
 */
export async function apiAddComment(params: {
  postId: string;
  content: string;
  author: User;
  lang: Language;
}): Promise<Comment> {
  const { postId, content, author, lang } = params;
  const targetPost = memoryPosts.find((p) => p.id === postId);
  if (!targetPost) {
    throw new Error('Пост не найден');
  }

  const toLang: Language = lang === 'zh' ? 'ru' : 'zh';

  const translated = await translateCampusText({
    text: content,
    fromLang: lang,
    toLang,
  });

  const newComment: Comment = {
    id: `c-${Date.now()}`,
    postId,
    author,
    contentOriginal: content,
    contentTranslated: translated,
    langOriginal: lang,
    langTranslated: toLang,
    createdAt: 'Только что',
    likes: 0,
    isOfficialAnswer: author.role === 'curator' || author.role === 'admin',
  };

  targetPost.comments.push(newComment);
  targetPost.commentsCount = targetPost.comments.length;
  persistPosts(memoryPosts);

  return newComment;
}

/**
 * AI-Саммаризация треда
 */
export async function apiResolveThreadWithAi(postId: string): Promise<Post> {
  const post = memoryPosts.find((p) => p.id === postId);
  if (!post) throw new Error('Пост не найден');

  const summary = await generateThreadSummary(post, post.comments);
  post.isResolved = true;
  post.aiSummary = summary;
  persistPosts(memoryPosts);

  return { ...post };
}

/**
 * Лайк поста
 */
export async function apiToggleLikePost(postId: string): Promise<Post> {
  return apiVoteQuestion(postId);
}

/**
 * Лайк комментария
 */
export async function apiToggleLikeComment(params: {
  postId: string;
  commentId: string;
}): Promise<Comment> {
  const post = memoryPosts.find((p) => p.id === params.postId);
  if (!post) throw new Error('Пост не найден');
  const comment = post.comments.find((c) => c.id === params.commentId);
  if (!comment) throw new Error('Комментарий не найден');
  comment.likes = (comment.likes || 0) + 1;
  persistPosts(memoryPosts);
  return { ...comment };
}

/**
 * Объединение вопроса с существующей темой
 */
export async function apiMergeQuestionIntoPost(params: {
  targetPostId: string;
  title: string;
  content: string;
  author: User;
  lang: Language;
}): Promise<Post> {
  const { targetPostId, title, content, author, lang } = params;
  const targetPost = memoryPosts.find((p) => p.id === targetPostId);
  if (!targetPost) throw new Error('Целевой вопрос не найден');

  if (!targetPost.mergedQuestions) {
    targetPost.mergedQuestions = [];
  }
  targetPost.mergedQuestions.push({
    id: `mq-${Date.now()}`,
    title,
    content,
    authorName: author.name,
    authorRole: author.role,
    authorAvatar: author.avatar,
    mergedAt: 'Только что',
  });

  const toLang: Language = lang === 'zh' ? 'ru' : 'zh';
  const commentTextRu = `[Объединенный вопрос]: ${lang === 'ru' ? title : await translateCampusText({ text: title, fromLang: 'zh', toLang: 'ru' })}\n${lang === 'ru' ? content : await translateCampusText({ text: content, fromLang: 'zh', toLang: 'ru' })}`;
  const commentTextZh = `[已合并相似提问]: ${lang === 'zh' ? title : await translateCampusText({ text: title, fromLang: 'ru', toLang: 'zh' })}\n${lang === 'zh' ? content : await translateCampusText({ text: content, fromLang: 'ru', toLang: 'zh' })}`;

  const newComment: Comment = {
    id: `c-${Date.now()}`,
    postId: targetPostId,
    author,
    contentOriginal: lang === 'zh' ? commentTextZh : commentTextRu,
    contentTranslated: lang === 'zh' ? commentTextRu : commentTextZh,
    langOriginal: lang,
    langTranslated: toLang,
    createdAt: 'Только что',
    likes: 0,
    isOfficialAnswer: false,
  };

  targetPost.comments.push(newComment);
  targetPost.commentsCount = targetPost.comments.length;
  targetPost.views = (targetPost.views || 0) + 1;

  persistPosts(memoryPosts);
  return { ...targetPost };
}

export async function apiGetWikiArticles(params?: {
  category?: string;
  searchQuery?: string;
}): Promise<WikiArticle[]> {
  await new Promise((resolve) => setTimeout(resolve, 120));
  let filtered = [...memoryWikiArticles];

  if (params?.category && params.category !== 'all') {
    filtered = filtered.filter((a) => a.category === params.category);
  }

  if (params?.searchQuery && params.searchQuery.trim() !== '') {
    const q = params.searchQuery.toLowerCase();
    filtered = filtered.filter(
      (a) =>
        a.titleRu.toLowerCase().includes(q) ||
        a.titleZh.toLowerCase().includes(q) ||
        a.contentRu.toLowerCase().includes(q) ||
        a.contentZh.toLowerCase().includes(q) ||
        a.tags.some((t) => t.toLowerCase().includes(q))
    );
  }

  return filtered;
}

export async function apiGetModeratorLogs(): Promise<ModeratorLog[]> {
  await new Promise((resolve) => setTimeout(resolve, 100));
  return [...memoryLogs];
}

export function apiAddModeratorLog(log: Omit<ModeratorLog, 'id' | 'timestamp'>): void {
  const newLog: ModeratorLog = {
    id: `log-${Date.now()}`,
    ...log,
    timestamp: new Date().toLocaleString('ru-RU', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    }),
  };
  memoryLogs = [newLog, ...memoryLogs];
  persistLogs(memoryLogs);
}

export async function apiGetStudentNotifications(userId?: string): Promise<StudentNotification[]> {
  await new Promise((resolve) => setTimeout(resolve, 100));
  if (userId) {
    return memoryNotifications.filter((n) => n.userId === userId);
  }
  return [...memoryNotifications];
}

export function apiAddStudentNotification(notif: Omit<StudentNotification, 'id' | 'createdAt' | 'isRead'>): void {
  const newNotif: StudentNotification = {
    id: `notif-${Date.now()}`,
    ...notif,
    createdAt: 'Только что // 刚刚',
    isRead: false,
  };
  memoryNotifications = [newNotif, ...memoryNotifications];
  persistNotifications(memoryNotifications);
}

export async function apiMarkNotificationRead(id: string): Promise<void> {
  const notif = memoryNotifications.find((n) => n.id === id);
  if (notif) {
    notif.isRead = true;
    persistNotifications(memoryNotifications);
  }
}

export const POSTS_QUERY_KEY = ['campus_posts'];
export const WIKI_QUERY_KEY = ['campus_wiki'];
export const LOGS_QUERY_KEY = ['campus_logs'];
export const NOTIFS_QUERY_KEY = ['campus_notifs'];

export function usePostsQuery(params?: {
  category?: string;
  onlyResolved?: boolean;
  searchQuery?: string;
  sortBy?: 'popular' | 'newest' | 'resolved';
  status?: QuestionStatus | 'all_statuses';
  authorId?: string;
}) {
  return useQuery({
    queryKey: [...POSTS_QUERY_KEY, params],
    queryFn: () => apiGetPosts(params),
    staleTime: 1000 * 30,
  });
}

export function useWikiArticlesQuery(params?: {
  category?: string;
  searchQuery?: string;
}) {
  return useQuery({
    queryKey: [...WIKI_QUERY_KEY, params],
    queryFn: () => apiGetWikiArticles(params),
    staleTime: 1000 * 60,
  });
}

export function useModeratorLogsQuery() {
  return useQuery({
    queryKey: LOGS_QUERY_KEY,
    queryFn: apiGetModeratorLogs,
    staleTime: 1000 * 20,
  });
}

export function useStudentNotificationsQuery(userId?: string) {
  return useQuery({
    queryKey: [...NOTIFS_QUERY_KEY, userId],
    queryFn: () => apiGetStudentNotifications(userId),
    staleTime: 1000 * 20,
  });
}

export function useCreatePostMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      title,
      content,
      category,
      tags,
      authorId,
      lang,
      author,
    }: CreatePostInput & { author: User }) =>
      apiCreatePost({ title, content, category, tags, authorId, lang }, author),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: POSTS_QUERY_KEY });
    },
  });
}

export function useApproveQuestionMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: apiApproveQuestion,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: POSTS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: LOGS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: NOTIFS_QUERY_KEY });
    },
  });
}

export function useRejectQuestionMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: apiRejectQuestion,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: POSTS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: LOGS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: NOTIFS_QUERY_KEY });
    },
  });
}

export function useVoteQuestionMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: apiVoteQuestion,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: POSTS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: WIKI_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: LOGS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: NOTIFS_QUERY_KEY });
    },
  });
}

export function useAddCommentMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: apiAddComment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: POSTS_QUERY_KEY });
    },
  });
}

export function useResolveThreadMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: apiResolveThreadWithAi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: POSTS_QUERY_KEY });
    },
  });
}

export function useToggleLikePostMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: apiToggleLikePost,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: POSTS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: WIKI_QUERY_KEY });
    },
  });
}

export function useToggleLikeCommentMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: apiToggleLikeComment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: POSTS_QUERY_KEY });
    },
  });
}

export function useMergeQuestionMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: apiMergeQuestionIntoPost,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: POSTS_QUERY_KEY });
    },
  });
}

export function useMarkNotificationReadMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: apiMarkNotificationRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: NOTIFS_QUERY_KEY });
    },
  });
}
