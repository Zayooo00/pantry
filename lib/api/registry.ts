import { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";
import {
  ActivityResponse,
  CreateItemRequest,
  CreateItemResponse,
  CreateRoomRequest,
  CreateRoomResponse,
  ErrorResponse,
  InviteMemberRequest,
  InviteMemberResponse,
  ManualShoppingRequest,
  MembersResponse,
  MeSharedResponse,
  OkResponse,
  PatchItemRequest,
  PatchMeRequest,
  PatchMemberRequest,
  PatchRoomRequest,
  PatchShoppingRequest,
  ReorderRoomsRequest,
  SearchResponse,
  ShoppingPostRequest,
  ShoppingPostResponse,
  SidebarResponse,
  SignupRequest,
  UploadResponse,
} from "./schemas";

export function buildRegistry() {
  const registry = new OpenAPIRegistry();

  const json = <T extends z.ZodTypeAny>(schema: T) => ({
    content: { "application/json": { schema } },
  });

  registry.registerPath({
    method: "get",
    path: "/api/sidebar",
    responses: {
      200: { description: "Sidebar data", ...json(SidebarResponse) },
      401: { description: "Unauthorized", ...json(ErrorResponse) },
    },
  });

  registry.registerPath({
    method: "post",
    path: "/api/rooms",
    request: { body: json(CreateRoomRequest) },
    responses: {
      200: { description: "Room created", ...json(CreateRoomResponse) },
      400: { description: "Invalid", ...json(ErrorResponse) },
      401: { description: "Unauthorized", ...json(ErrorResponse) },
    },
  });

  registry.registerPath({
    method: "patch",
    path: "/api/rooms/{id}",
    request: {
      params: z.object({ id: z.string() }),
      body: json(PatchRoomRequest),
    },
    responses: {
      200: { description: "Updated", ...json(OkResponse) },
      400: { description: "Invalid", ...json(ErrorResponse) },
      401: { description: "Unauthorized", ...json(ErrorResponse) },
      403: { description: "Forbidden", ...json(ErrorResponse) },
    },
  });

  registry.registerPath({
    method: "delete",
    path: "/api/rooms/{id}",
    request: { params: z.object({ id: z.string() }) },
    responses: {
      200: { description: "Deleted", ...json(OkResponse) },
      401: { description: "Unauthorized", ...json(ErrorResponse) },
      403: { description: "Forbidden", ...json(ErrorResponse) },
      409: { description: "Has items", ...json(ErrorResponse) },
    },
  });

  registry.registerPath({
    method: "post",
    path: "/api/rooms/reorder",
    request: { body: json(ReorderRoomsRequest) },
    responses: {
      200: { description: "Reordered", ...json(OkResponse) },
      400: { description: "Invalid", ...json(ErrorResponse) },
      401: { description: "Unauthorized", ...json(ErrorResponse) },
    },
  });

  registry.registerPath({
    method: "get",
    path: "/api/rooms/{id}/members",
    request: { params: z.object({ id: z.string() }) },
    responses: {
      200: { description: "Members", ...json(MembersResponse) },
      401: { description: "Unauthorized", ...json(ErrorResponse) },
      404: { description: "Not found", ...json(ErrorResponse) },
    },
  });

  registry.registerPath({
    method: "post",
    path: "/api/rooms/{id}/members",
    request: {
      params: z.object({ id: z.string() }),
      body: json(InviteMemberRequest),
    },
    responses: {
      200: { description: "Invited", ...json(InviteMemberResponse) },
      400: { description: "Invalid", ...json(ErrorResponse) },
      401: { description: "Unauthorized", ...json(ErrorResponse) },
      403: { description: "Forbidden", ...json(ErrorResponse) },
      404: { description: "User not registered", ...json(ErrorResponse) },
      409: { description: "Already a member", ...json(ErrorResponse) },
    },
  });

  registry.registerPath({
    method: "patch",
    path: "/api/rooms/{id}/members/{userId}",
    request: {
      params: z.object({ id: z.string(), userId: z.string() }),
      body: json(PatchMemberRequest),
    },
    responses: {
      200: { description: "Updated", ...json(OkResponse) },
      401: { description: "Unauthorized", ...json(ErrorResponse) },
      403: { description: "Forbidden", ...json(ErrorResponse) },
      404: { description: "Not found", ...json(ErrorResponse) },
    },
  });

  registry.registerPath({
    method: "delete",
    path: "/api/rooms/{id}/members/{userId}",
    request: { params: z.object({ id: z.string(), userId: z.string() }) },
    responses: {
      200: { description: "Removed", ...json(OkResponse) },
      401: { description: "Unauthorized", ...json(ErrorResponse) },
      403: { description: "Forbidden", ...json(ErrorResponse) },
      404: { description: "Not found", ...json(ErrorResponse) },
    },
  });

  registry.registerPath({
    method: "post",
    path: "/api/items",
    request: { body: json(CreateItemRequest) },
    responses: {
      200: { description: "Item created", ...json(CreateItemResponse) },
      400: { description: "Invalid", ...json(ErrorResponse) },
      401: { description: "Unauthorized", ...json(ErrorResponse) },
      403: { description: "Forbidden", ...json(ErrorResponse) },
    },
  });

  registry.registerPath({
    method: "patch",
    path: "/api/items/{id}",
    request: {
      params: z.object({ id: z.string() }),
      body: json(PatchItemRequest),
    },
    responses: {
      200: { description: "Updated", ...json(OkResponse) },
      400: { description: "Invalid", ...json(ErrorResponse) },
      401: { description: "Unauthorized", ...json(ErrorResponse) },
      403: { description: "Forbidden", ...json(ErrorResponse) },
      404: { description: "Not found", ...json(ErrorResponse) },
    },
  });

  registry.registerPath({
    method: "delete",
    path: "/api/items/{id}",
    request: { params: z.object({ id: z.string() }) },
    responses: {
      200: { description: "Deleted", ...json(OkResponse) },
      401: { description: "Unauthorized", ...json(ErrorResponse) },
      403: { description: "Forbidden", ...json(ErrorResponse) },
      404: { description: "Not found", ...json(ErrorResponse) },
    },
  });

  registry.registerPath({
    method: "post",
    path: "/api/items/{id}/open",
    request: { params: z.object({ id: z.string() }) },
    responses: {
      200: { description: "Marked opened", ...json(OkResponse) },
      401: { description: "Unauthorized", ...json(ErrorResponse) },
      403: { description: "Forbidden", ...json(ErrorResponse) },
      404: { description: "Not found", ...json(ErrorResponse) },
    },
  });

  registry.registerPath({
    method: "post",
    path: "/api/shopping",
    request: { body: json(ShoppingPostRequest) },
    responses: {
      200: { description: "Added", ...json(ShoppingPostResponse) },
      400: { description: "Invalid", ...json(ErrorResponse) },
      401: { description: "Unauthorized", ...json(ErrorResponse) },
      403: { description: "Forbidden", ...json(ErrorResponse) },
    },
  });

  registry.registerPath({
    method: "patch",
    path: "/api/shopping/{id}",
    request: {
      params: z.object({ id: z.string() }),
      body: json(PatchShoppingRequest),
    },
    responses: {
      200: { description: "Updated", ...json(OkResponse) },
      401: { description: "Unauthorized", ...json(ErrorResponse) },
      404: { description: "Not found", ...json(ErrorResponse) },
    },
  });

  registry.registerPath({
    method: "delete",
    path: "/api/shopping/{id}",
    request: { params: z.object({ id: z.string() }) },
    responses: {
      200: { description: "Deleted", ...json(OkResponse) },
      401: { description: "Unauthorized", ...json(ErrorResponse) },
      404: { description: "Not found", ...json(ErrorResponse) },
    },
  });

  registry.registerPath({
    method: "post",
    path: "/api/shopping/clear-done",
    responses: {
      200: { description: "Cleared", ...json(OkResponse) },
      401: { description: "Unauthorized", ...json(ErrorResponse) },
    },
  });

  registry.registerPath({
    method: "get",
    path: "/api/activity",
    responses: {
      200: { description: "Activity", ...json(ActivityResponse) },
      401: { description: "Unauthorized", ...json(ErrorResponse) },
    },
  });

  registry.registerPath({
    method: "get",
    path: "/api/search",
    request: { query: z.object({ q: z.string().optional() }) },
    responses: {
      200: { description: "Search results", ...json(SearchResponse) },
      401: { description: "Unauthorized", ...json(ErrorResponse) },
    },
  });

  registry.registerPath({
    method: "patch",
    path: "/api/me",
    request: { body: json(PatchMeRequest) },
    responses: {
      200: { description: "Updated", ...json(OkResponse) },
      400: { description: "Invalid", ...json(ErrorResponse) },
      401: { description: "Unauthorized", ...json(ErrorResponse) },
      404: { description: "Not found", ...json(ErrorResponse) },
      409: { description: "Conflict", ...json(ErrorResponse) },
    },
  });

  registry.registerPath({
    method: "get",
    path: "/api/me/shared",
    responses: {
      200: { description: "Sharing overview", ...json(MeSharedResponse) },
      401: { description: "Unauthorized", ...json(ErrorResponse) },
    },
  });

  registry.registerPath({
    method: "post",
    path: "/api/signup",
    request: { body: json(SignupRequest) },
    responses: {
      200: { description: "Signed up", ...json(OkResponse) },
      400: { description: "Invalid", ...json(ErrorResponse) },
      409: { description: "Email taken", ...json(ErrorResponse) },
    },
  });

  registry.registerPath({
    method: "post",
    path: "/api/upload",
    responses: {
      200: { description: "Uploaded", ...json(UploadResponse) },
      400: { description: "Invalid", ...json(ErrorResponse) },
      401: { description: "Unauthorized", ...json(ErrorResponse) },
      500: { description: "Failed", ...json(ErrorResponse) },
    },
  });

  return registry;
}
