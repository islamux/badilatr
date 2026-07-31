export function logRepoError(scope: string, err: unknown): void {
  console.error(`[repo:${scope}]`, err);
}
