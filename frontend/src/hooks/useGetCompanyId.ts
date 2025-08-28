import { useAppSelector } from '@/store/hooks';

export const useGetCompanyId = () => {
  const auth = useAppSelector((state) => state.auth);
  const companyId = auth.company?.id ?? '';
  return { companyId };
};
