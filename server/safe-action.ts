export type ActionResult<T> = {
  data: T | null;
  error: string | null;
};

export default async function safeAction<T>(
  action: () => Promise<T>,
): Promise<ActionResult<T>> {
  try {
    const data = await action();

    return { data, error: null };
  } catch (error) {
    return {
      data: null,
      error:
        error instanceof Error ? error.message : "Unexpected error has occured",
    };
  }
}
