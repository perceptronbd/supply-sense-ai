import { useAppSelector } from '@/store/hooks';

export const useGetCompanyId = () => {
  const user = useAppSelector((state) => state.auth.user);
  const companyId = user?.companyId ?? '';
  return { companyId };
};
