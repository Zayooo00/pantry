import createClient, { type FetchOptions } from "openapi-fetch";
import { createImmutableHook, createQueryHook } from "swr-openapi";
import { mutate as swrGlobalMutate } from "swr";
import useSWRMutation, { type SWRMutationConfiguration } from "swr/mutation";
import type { HasRequiredKeys, HttpMethod, PathsWithMethod } from "openapi-typescript-helpers";
import type { paths } from "./openapi";

const SWR_PREFIX = "pantry";

export const apiClient = createClient<paths>({
  baseUrl: typeof window === "undefined" ? "" : window.location.origin,
});

export type ApiClient = typeof apiClient;

export const useQuery = createQueryHook(apiClient, SWR_PREFIX);
export const useImmutable = createImmutableHook(apiClient, SWR_PREFIX);

// `swr-openapi` keys queries as `[prefix, path, init]` — globalMutate's array
// match requires exact equality, so a 2-tuple never matches. Use a predicate.
export function invalidateApi(...paths: string[]): Promise<unknown> {
  const wanted = new Set(paths);
  return swrGlobalMutate(
    (key) =>
      Array.isArray(key) &&
      key.length >= 2 &&
      key[0] === SWR_PREFIX &&
      typeof key[1] === "string" &&
      wanted.has(key[1]),
  );
}

type Method = Lowercase<HttpMethod>;

type MutationOptions<M extends Method, P extends PathsWithMethod<paths, M>> = FetchOptions<
  paths[P][M]
>;

type MutationData<M extends Method, P extends PathsWithMethod<paths, M>> = paths[P][M] extends {
  responses: { 200: { content: { "application/json": infer D } } };
}
  ? D
  : unknown;

export function useMutation<M extends Method, P extends PathsWithMethod<paths, M>>(
  method: M,
  path: P,
  config?: SWRMutationConfiguration<MutationData<M, P>, Error, [M, P], MutationOptions<M, P>>,
) {
  return useSWRMutation<MutationData<M, P>, Error, [M, P], MutationOptions<M, P>>(
    [method, path],
    async ([m, p], { arg }) => {
      const fn = apiClient[m.toUpperCase() as Uppercase<M>] as unknown as (
        url: typeof p,
        opts: MutationOptions<M, P>,
      ) => Promise<{ data?: MutationData<M, P>; error?: unknown }>;
      const args = (arg ?? {}) as MutationOptions<M, P>;
      const res = await fn(p, args);
      if (res.error) {
        const err = res.error as { error?: string } | string | undefined;
        const message = typeof err === "string" ? err : (err?.error ?? "Request failed.");
        throw new Error(message);
      }
      return res.data as MutationData<M, P>;
    },
    config,
  );
}

export type TriggerArgs<M extends Method, P extends PathsWithMethod<paths, M>> =
  HasRequiredKeys<MutationOptions<M, P>> extends never
    ? MutationOptions<M, P> | undefined
    : MutationOptions<M, P>;
