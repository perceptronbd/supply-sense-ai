import { useAppSelector } from '@/store/hooks';
import type { User } from '@/store/slices/authSlice';

export const useGetCompanyId = () => {
  const auth = useAppSelector((state) => state.auth);
  if (auth.user) {
    return { companyId: auth.user.companyId, userId: auth.user.id };
  }
  const companyId = auth.company?.id ?? '';
  const userId = (auth.user as unknown as User)?.id ?? '';

  return { companyId, userId };
};
