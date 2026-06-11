type ErrorResponse = {
  detail?: string;
};

export async function responseError(
  response: Response,
  fallbackMessage: string,
): Promise<Error> {
  try {
    const body = (await response.json()) as ErrorResponse;
    return new Error(body.detail || fallbackMessage);
  } catch {
    return new Error(fallbackMessage);
  }
}
