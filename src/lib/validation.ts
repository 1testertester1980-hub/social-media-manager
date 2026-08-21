import { z } from "zod";

export const taskStatusEnum = z.enum(["PLANNED", "TODO", "PUBLISHED", "OVERDUE", "CANCELLED"]);

export const createTaskSchema = z.object({
  profileId: z.string().min(1, "Vyberte profil"),
  title: z.string().min(1, "Zadajte názov").max(200),
  topic: z.string().max(300).optional().or(z.literal("")),
  brief: z.string().max(5000).optional().or(z.literal("")),
  caption: z.string().max(5000).optional().or(z.literal("")),
  assignedUserId: z.string().optional().or(z.literal("")),
  deadlineDate: z.string().min(1, "Zadajte dátum"),
  deadlineTime: z.string().min(1, "Zadajte čas"),
  adminNotes: z.string().max(3000).optional().or(z.literal("")),
  attachmentUrl: z.string().max(1000).optional().or(z.literal("")),
});

export const updateTaskSchema = createTaskSchema.partial().extend({
  status: taskStatusEnum.optional(),
});

export const publishTaskSchema = z.object({
  instagramUrl: z.string().url("Zadajte platnú URL adresu"),
  workerNote: z.string().max(2000).optional().or(z.literal("")),
  views: z.coerce.number().int().nonnegative().optional(),
  reach: z.coerce.number().int().nonnegative().optional(),
  likes: z.coerce.number().int().nonnegative().optional(),
  comments: z.coerce.number().int().nonnegative().optional(),
});

export const analyticsSchema = z.object({
  views: z.coerce.number().int().nonnegative().default(0),
  reach: z.coerce.number().int().nonnegative().default(0),
  likes: z.coerce.number().int().nonnegative().default(0),
  comments: z.coerce.number().int().nonnegative().default(0),
  shares: z.coerce.number().int().nonnegative().default(0),
  saves: z.coerce.number().int().nonnegative().default(0),
  followersGained: z.coerce.number().int().nonnegative().default(0),
});

export const createProfileSchema = z.object({
  name: z.string().min(1, "Zadajte názov").max(100),
  instagramUsername: z.string().max(100).optional().or(z.literal("")),
  imageUrl: z.string().max(1000).optional().or(z.literal("")),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Neplatná farba").default("#6366f1"),
  notes: z.string().max(3000).optional().or(z.literal("")),
});

export const updateProfileSchema = createProfileSchema.partial().extend({
  active: z.boolean().optional(),
});

export const createUserSchema = z.object({
  name: z.string().min(1, "Zadajte meno").max(100),
  email: z.string().email("Neplatný email"),
  password: z.string().min(6, "Heslo musí mať aspoň 6 znakov"),
  role: z.enum(["ADMIN", "WORKER"]),
  telegramChatId: z.string().max(100).optional().or(z.literal("")),
});

export const updateUserSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  role: z.enum(["ADMIN", "WORKER"]).optional(),
  telegramChatId: z.string().max(100).optional().or(z.literal("")),
  active: z.boolean().optional(),
  password: z.string().min(6).optional().or(z.literal("")),
  bonusPoints: z.coerce.number().int().optional(),
});

export const appSettingsSchema = z.object({
  telegramBotToken: z.string().max(300).optional().or(z.literal("")),
  timezone: z.string().min(1).default("Europe/Bratislava"),
});
