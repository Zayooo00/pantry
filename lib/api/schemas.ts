import { z } from "zod";
import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";

extendZodWithOpenApi(z);

const Role = z.enum(["owner", "editor", "viewer"]);
const MemberRole = z.enum(["viewer", "editor"]);
const Glyph = z.string();
const Iso = z.string();
const Numeric = z.coerce.number();
const NumericNullable = z.coerce.number().nullable();
const DateNullable = z.coerce.date().nullable();

const SidebarRoom = z
  .object({
    id: z.string(),
    name: z.string(),
    glyph: Glyph,
    count: z.number(),
    low: z.number(),
    role: Role,
  })
  .openapi("SidebarRoom");

export const SidebarResponse = z
  .object({
    rooms: z.array(SidebarRoom),
    shoppingCount: z.number(),
  })
  .openapi("SidebarResponse");

export const CreateRoomRequest = z
  .object({
    name: z.string().min(1),
    glyph: z.string().min(1),
    subtitle: z.string().nullable().optional(),
    tinted: z.boolean().optional(),
  })
  .openapi("CreateRoomRequest");

export const CreateRoomResponse = z.object({ id: z.string() }).openapi("CreateRoomResponse");

export const PatchRoomRequest = z
  .object({
    name: z.string().min(1).optional(),
    glyph: z.string().optional(),
    subtitle: z.string().nullable().optional(),
    tinted: z.boolean().optional(),
    archived: z.boolean().optional(),
  })
  .openapi("PatchRoomRequest");

export const ReorderRoomsRequest = z
  .object({ order: z.array(z.string()).min(1) })
  .openapi("ReorderRoomsRequest");

export const OkResponse = z.object({ ok: z.boolean() }).openapi("OkResponse");

const Member = z
  .object({
    id: z.string(),
    userId: z.string(),
    name: z.string(),
    email: z.string(),
    role: MemberRole,
    createdAt: Iso,
  })
  .openapi("Member");

export const MembersResponse = z
  .object({
    owner: z.object({ id: z.string(), name: z.string(), email: z.string() }).nullable(),
    members: z.array(Member),
    isOwner: z.boolean(),
  })
  .openapi("MembersResponse");

export const InviteMemberRequest = z
  .object({
    email: z.string().trim().toLowerCase().email(),
    role: MemberRole,
  })
  .openapi("InviteMemberRequest");

const InviteMemberAdded = z
  .object({
    member: z.object({
      userId: z.string(),
      name: z.string(),
      email: z.string(),
      role: MemberRole,
    }),
  })
  .openapi("InviteMemberAdded");

const InviteMemberPending = z
  .object({
    pending: z.object({
      email: z.string(),
      role: MemberRole,
    }),
  })
  .openapi("InviteMemberPending");

export const InviteMemberResponse = z
  .union([InviteMemberAdded, InviteMemberPending])
  .openapi("InviteMemberResponse");

export const PatchMemberRequest = z.object({ role: MemberRole }).openapi("PatchMemberRequest");

export const CreateItemRequest = z
  .object({
    roomId: z.string(),
    name: z.string().min(1),
    brand: z.string().nullable().optional(),
    category: z.string().nullable().optional(),
    unit: z.string().min(1),
    count: Numeric.refine((n) => n >= 0, { message: "Count must be 0 or more." }),
    threshold: NumericNullable.optional(),
    reorderAmount: NumericNullable.optional(),
    shelf: z.string().nullable().optional(),
    expiresAt: DateNullable.optional(),
    openedAt: DateNullable.optional(),
    purchasedAt: DateNullable.optional(),
    lastPrice: NumericNullable.optional(),
    barcode: z.string().nullable().optional(),
    notes: z.string().nullable().optional(),
    tags: z.string().nullable().optional(),
    photoUrl: z.string().url().nullable().optional(),
  })
  .openapi("CreateItemRequest");

export const CreateItemResponse = z.object({ id: z.string() }).openapi("CreateItemResponse");

export const PatchItemRequest = z
  .object({
    count: Numeric.optional(),
    name: z.string().optional(),
    brand: z.string().nullable().optional(),
    category: z.string().nullable().optional(),
    unit: z.string().optional(),
    threshold: NumericNullable.optional(),
    reorderAmount: NumericNullable.optional(),
    shelf: z.string().nullable().optional(),
    expiresAt: DateNullable.optional(),
    openedAt: DateNullable.optional(),
    purchasedAt: DateNullable.optional(),
    lastPrice: NumericNullable.optional(),
    barcode: z.string().nullable().optional(),
    notes: z.string().nullable().optional(),
    tags: z.string().nullable().optional(),
    roomId: z.string().optional(),
    photoUrl: z.string().url().nullable().optional(),
  })
  .openapi("PatchItemRequest");

export const ManualShoppingRequest = z
  .object({
    name: z.string().min(1),
    quantity: Numeric.refine((n) => n >= 0),
    unit: z.string().min(1),
    groupName: z.string().nullable().optional(),
    reason: z.string().nullable().optional(),
  })
  .openapi("ManualShoppingRequest");

export const FromItemShoppingRequest = z
  .object({ itemId: z.string() })
  .openapi("FromItemShoppingRequest");

export const ShoppingPostRequest = z
  .union([ManualShoppingRequest, FromItemShoppingRequest])
  .openapi("ShoppingPostRequest");

export const ShoppingPostResponse = z.object({ id: z.string() }).openapi("ShoppingPostResponse");

export const PatchShoppingRequest = z
  .object({
    done: z.boolean().optional(),
    quantity: Numeric.optional(),
  })
  .openapi("PatchShoppingRequest");

const ActivityEvent = z
  .object({
    id: z.string(),
    kind: z.string(),
    delta: z.number().nullable(),
    countAfter: z.number().nullable(),
    note: z.string().nullable(),
    actor: z.string().nullable(),
    createdAt: Iso,
    itemId: z.string().nullable(),
    itemName: z.string().nullable(),
    unit: z.string().nullable(),
    roomId: z.string().nullable(),
    roomName: z.string().nullable(),
    roomGlyph: z.string().nullable(),
  })
  .openapi("ActivityEvent");

export const ActivityResponse = z
  .object({ events: z.array(ActivityEvent) })
  .openapi("ActivityResponse");

const SearchItem = z
  .object({
    id: z.string(),
    name: z.string(),
    roomId: z.string(),
    category: z.string().nullable(),
  })
  .openapi("SearchItem");

export const SearchResponse = z.object({ items: z.array(SearchItem) }).openapi("SearchResponse");

export const PatchMeRequest = z
  .object({
    name: z.string().min(1).max(80).optional(),
    email: z.string().trim().toLowerCase().email().max(160).optional(),
    currentPassword: z.string().optional(),
    newPassword: z.string().min(8).max(200).optional(),
    notifyDigest: z.enum(["off", "daily", "weekly"]).optional(),
  })
  .openapi("PatchMeRequest");

const SharedWithMeRoom = z
  .object({
    roomId: z.string(),
    name: z.string(),
    glyph: Glyph,
    role: MemberRole,
    ownerName: z.string(),
    ownerEmail: z.string(),
  })
  .openapi("SharedWithMeRoom");

const IShareEntry = z
  .object({
    roomId: z.string(),
    name: z.string(),
    glyph: Glyph,
    members: z.array(
      z.object({
        userId: z.string(),
        name: z.string(),
        email: z.string(),
        role: MemberRole,
      }),
    ),
  })
  .openapi("IShareEntry");

export const MeSharedResponse = z
  .object({
    sharedWithMe: z.array(SharedWithMeRoom),
    iShare: z.array(IShareEntry),
  })
  .openapi("MeSharedResponse");

export const SignUpRequest = z
  .object({
    email: z.string().trim().toLowerCase().email().max(160),
    name: z.string().min(1).max(80),
    password: z.string().min(8).max(200),
  })
  .openapi("SignUpRequest");

export const UploadResponse = z.object({ url: z.string() }).openapi("UploadResponse");

export const ErrorResponse = z.object({ error: z.unknown() }).openapi("ErrorResponse");
