import { isApplicant, type CurrentUser } from '@/lib/api/auth';
import { candidateApi } from '@/lib/api/candidate';
import { candidateProgressApi } from '@/lib/api/candidate-progress';
import { candidateDestination } from '@/lib/candidate/state';
import { homeFor } from './context';

export async function destinationAfterSignIn(user: CurrentUser): Promise<string> {
  if (!isApplicant(user.role)) return homeFor(user);
  try {
    const [progress, resume] = await Promise.all([candidateProgressApi.load(), candidateApi.myResume()]);
    return candidateDestination(progress, user, resume);
  } catch {
    // The profile screen shows a retry instead of assuming the account is empty.
    return '/onboarding';
  }
}
