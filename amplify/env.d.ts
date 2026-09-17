declare module '$amplify/env/*' {
  const env: Record<string, string | undefined>;
  export { env };
}
