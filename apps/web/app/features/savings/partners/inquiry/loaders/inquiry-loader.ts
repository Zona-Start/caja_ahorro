import { type QueryClient } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/lib/query-keys';
import { inquiryService } from '../services/inquiry-service';

export const inquiryAssociateLoader =
  (queryClient: QueryClient) =>
  async ({ params }: { params: { cedula: string } }) => {
    const cedula = params.cedula;
    if (!cedula) return null;

    return await queryClient.ensureQueryData({
      queryKey: QUERY_KEYS.inquiry.associate(cedula),
      queryFn: () => inquiryService.getAssociateDetails(cedula),
    });
  };
