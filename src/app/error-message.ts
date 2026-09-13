export function friendlyErrorMessage(
  error: unknown,
  fallbackMessage = 'Something went wrong.',
): string {
  const message = error instanceof Error ? error.message : '';
  return friendlyMessage(message, fallbackMessage);
}

export function friendlyMessage(
  message: string | null | undefined,
  fallbackMessage = 'Something went wrong.',
): string {
  const trimmedMessage = message?.trim();

  if (!trimmedMessage) {
    return fallbackMessage;
  }

  const normalizedMessage = trimmedMessage.toLowerCase();

  if (
    normalizedMessage === 'please log in and try again.' ||
    normalizedMessage === 'unauthorized' ||
    normalizedMessage === 'unauthorized.' ||
    normalizedMessage ===
      'full authentication is required to access this resource'
  ) {
    return 'Please sign in again to continue.';
  }

  if (
    normalizedMessage === 'forbidden' ||
    normalizedMessage === 'forbidden.' ||
    normalizedMessage === 'access denied'
  ) {
    return 'You do not have permission to do that.';
  }

  if (normalizedMessage.includes('login response did not include')) {
    return 'Could not sign in. Please try again.';
  }

  if (normalizedMessage.includes('profile update did not return')) {
    return 'Your profile was saved, but we could not refresh it. Please reload the page.';
  }

  if (normalizedMessage.includes('dashboard response did not include')) {
    return 'We could not load your progress. Please try again.';
  }

  if (normalizedMessage.includes('ai quota was not returned')) {
    return 'We could not load your AI usage. Please try again.';
  }

  if (normalizedMessage.includes('checkout response did not include')) {
    return 'Could not open checkout. Please try again.';
  }

  if (
    normalizedMessage.includes('recording response did not include evaluation') ||
    normalizedMessage.includes('the evaluation was not returned')
  ) {
    return 'The evaluation was incomplete. Please try again.';
  }

  if (
    normalizedMessage.includes('speaking practice response did not include') ||
    normalizedMessage.includes('generated prompt did not include')
  ) {
    return 'The speaking prompt was incomplete. Please generate a new one.';
  }

  if (
    normalizedMessage.includes('listening response did not include') ||
    normalizedMessage.includes('generated exercise did not include a listening text')
  ) {
    return 'The listening exercise was incomplete. Please generate a new one.';
  }

  if (normalizedMessage.includes('vocabulary response did not include')) {
    return 'The vocabulary exercise was incomplete. Please generate a new one.';
  }

  if (normalizedMessage.includes('exercise response did not include')) {
    return 'The exercise was incomplete. Please generate a new one.';
  }

  if (normalizedMessage.includes('practice options were not returned')) {
    return 'Could not load practice options. Please refresh the page.';
  }

  return trimmedMessage;
}
