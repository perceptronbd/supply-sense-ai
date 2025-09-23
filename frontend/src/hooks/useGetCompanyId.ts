import { useAppSelector } from '@/store/hooks';

export const useGetCompanyId = () => {
  const auth = useAppSelector((state) => state.auth);
  if (auth.user) {
    return { companyId: auth.user.companyId };
  }
  const companyId = auth.company?.id ?? '';
  return { companyId };
};
