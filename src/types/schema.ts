import { z } from 'zod';

/**
 * Допустимые роли пользователей на кампусе
 */
export const UserRoleSchema = z.enum(['student', 'curator', 'admin']);
export type UserRole = z.infer<typeof UserRoleSchema>;

/**
 * Поддерживаемые языки кампуса
 */
export const LanguageSchema = z.enum(['zh', 'ru']);
export type Language = z.infer<typeof LanguageSchema>;

/**
 * Схема пользователя (студент, куратор, админ)
 */
export const UserSchema = z.object({
  id: z.string(),
  name: z.string(),
  nativeName: z.string().optional(),
  role: UserRoleSchema,
  roleTitle: z.string(),
  avatar: z.string(),
  nativeLang: LanguageSchema,
  dormitoryInfo: z.string().optional(),
  faculty: z.string().optional(),
  studentId: z.string().optional(),
  groupNumber: z.string().optional(),
});
export type User = z.infer<typeof UserSchema>;

/**
 * Схема AI-Итога (Smart Thread Summary)
 * Генерируется нейросетью при решении вопроса
 */
export const AiSummarySchema = z.object({
  id: z.string(),
  resolvedAt: z.string(),
  modelUsed: z.string().default('DeepSeek-V3 / Gemini 2.0 Flash'),
  quickAnswer: z.string(),
  quickAnswerZh: z.string().optional(),
  keySteps: z.array(z.string()),
  keyStepsZh: z.array(z.string()).optional(),
  locationOrOffice: z.string().optional(),
  locationOrOfficeZh: z.string().optional(),
  documentsRequired: z.array(z.string()).optional(),
  documentsRequiredZh: z.array(z.string()).optional(),
  contactPerson: z.string().optional(),
  contactPersonZh: z.string().optional(),
});
export type AiSummary = z.infer<typeof AiSummarySchema>;

/**
 * Схема комментария в треде с обязательным двойным хранением оригинала и перевода
 */
export const CommentSchema = z.object({
  id: z.string(),
  postId: z.string(),
  author: UserSchema,
  contentOriginal: z.string(),
  contentTranslated: z.string(),
  langOriginal: LanguageSchema,
  langTranslated: LanguageSchema,
  createdAt: z.string(),
  likes: z.number().default(0),
  isOfficialAnswer: z.boolean().default(false),
});
export type Comment = z.infer<typeof CommentSchema>;

/**
 * Категории постов и Базы Знаний адаптации в Беларуси
 */
export const PostCategorySchema = z.enum([
  'all',
  'studies',
  'dormitory',
  'transport',
  'cuisine',
  'etiquette',
  'curator',
  'urgent',
  'visa',
]);
export type PostCategory = z.infer<typeof PostCategorySchema>;

export const QuestionStatusSchema = z.enum([
  'pending_moderation',
  'published',
  'rejected',
  'wiki_promoted',
]);
export type QuestionStatus = z.infer<typeof QuestionStatusSchema>;

/**
 * Схема объединенного связанного вопроса (при слиянии дубликатов)
 */
export const MergedQuestionSchema = z.object({
  id: z.string(),
  title: z.string(),
  content: z.string(),
  authorName: z.string(),
  authorRole: z.string().optional(),
  authorAvatar: z.string().optional(),
  mergedAt: z.string(),
});
export type MergedQuestion = z.infer<typeof MergedQuestionSchema>;

/**
 * Схема поста кампус-форума
 * Включает статус модерации, сжатую суть ИИ, народное голосование и перенос в Вики
 */
export const PostSchema = z.object({
  id: z.string(),
  titleOriginal: z.string(),
  titleTranslated: z.string(),
  contentOriginal: z.string(),
  contentTranslated: z.string(),
  author: UserSchema,
  langOriginal: LanguageSchema,
  langTranslated: LanguageSchema,
  category: PostCategorySchema,
  tags: z.array(z.string()),
  status: QuestionStatusSchema.optional().default('published'),
  aiEssence: z.string().optional(),
  aiSuggestedCategory: PostCategorySchema.optional(),
  moderatedBy: z.string().optional(),
  moderatedAt: z.string().optional(),
  rejectionReason: z.string().optional(),
  communityVotes: z.number().optional().default(0),
  promotedToWikiAt: z.string().optional(),
  isResolved: z.boolean().default(false),
  aiSummary: AiSummarySchema.optional(),
  mergedQuestions: z.array(MergedQuestionSchema).optional(),
  commentsCount: z.number().default(0),
  comments: z.array(CommentSchema).default([]),
  views: z.number().default(0),
  likes: z.number().default(0),
  createdAt: z.string(),
  updatedAt: z.string().optional(),
  pinned: z.boolean().default(false),
});
export type Post = z.infer<typeof PostSchema>;

/**
 * Схема статьи энциклопедической Базы Знаний (Википедии)
 */
export const WikiArticleSchema = z.object({
  id: z.string(),
  category: PostCategorySchema,
  titleRu: z.string(),
  titleZh: z.string(),
  contentRu: z.string(),
  contentZh: z.string(),
  keyStepsRu: z.array(z.string()).optional(),
  keyStepsZh: z.array(z.string()).optional(),
  badge: z.enum(['official', 'community_promoted']),
  sourcePostId: z.string().optional(),
  votesCount: z.number().default(0),
  viewsCount: z.number().default(0),
  tags: z.array(z.string()),
  updatedAt: z.string(),
});
export type WikiArticle = z.infer<typeof WikiArticleSchema>;

/**
 * Журнал аудита действий модератора (Audit Log)
 */
export const ModeratorLogSchema = z.object({
  id: z.string(),
  moderatorName: z.string(),
  moderatorRole: z.string(),
  action: z.enum(['approve', 'reject', 'escalate', 'wiki_promote']),
  postId: z.string(),
  postTitle: z.string(),
  reason: z.string().optional(),
  timestamp: z.string(),
});
export type ModeratorLog = z.infer<typeof ModeratorLogSchema>;

/**
 * Уведомления для студента (обратная связь модератора, промо в Вики)
 */
export const StudentNotificationSchema = z.object({
  id: z.string(),
  userId: z.string(),
  type: z.enum(['question_approved', 'question_rejected', 'wiki_promoted', 'new_answer']),
  titleRu: z.string(),
  titleZh: z.string(),
  messageRu: z.string(),
  messageZh: z.string(),
  postId: z.string(),
  createdAt: z.string(),
  isRead: z.boolean().default(false),
});
export type StudentNotification = z.infer<typeof StudentNotificationSchema>;

/**
 * Вопросы интерактивной викторины о Беларуси (снятие стресса)
 */
export const QuizQuestionSchema = z.object({
  id: z.string(),
  category: z.enum(['transport', 'dormitory', 'cuisine', 'etiquette', 'studies']),
  questionRu: z.string(),
  questionZh: z.string(),
  optionsRu: z.array(z.string()),
  optionsZh: z.array(z.string()),
  correctIndex: z.number(),
  explanationRu: z.string(),
  explanationZh: z.string(),
  tipRu: z.string(),
  tipZh: z.string(),
});
export type QuizQuestion = z.infer<typeof QuizQuestionSchema>;

/**
 * Схема элемента кампусного словаря (Glossary item)
 */
export const GlossaryItemSchema = z.object({
  ru: z.string(),
  zh: z.string(),
  pinyin: z.string(),
  category: z.string(),
  contextNotes: z.string(),
  officialRoom: z.string().optional(),
});
export type GlossaryItem = z.infer<typeof GlossaryItemSchema>;

/**
 * Схема запроса на создание нового поста
 */
export const CreatePostInputSchema = z.object({
  title: z.string().min(3, 'Заголовок должен содержать минимум 3 символа'),
  content: z.string().min(5, 'Текст вопроса должен содержать минимум 5 символов'),
  category: PostCategorySchema,
  tags: z.array(z.string()),
  authorId: z.string(),
  lang: LanguageSchema,
});
export type CreatePostInput = z.infer<typeof CreatePostInputSchema>;
