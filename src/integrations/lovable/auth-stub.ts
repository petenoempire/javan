export function createLovableAuth() {
  return {
    signInWithOAuth: async () => ({
      redirected: false,
      error: new Error("Lovable Cloud auth is not available in this environment."),
      tokens: null,
    }),
  };
}
