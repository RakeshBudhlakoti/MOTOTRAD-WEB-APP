import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { getErrorMessage } from '@/utils/error';

export function useAppQuery(key: any[], fetchFn: () => Promise<any>, options?: any) {
  return useQuery({
    queryKey: key,
    queryFn: fetchFn,
    ...options,
  });
}

export function useAppMutation(
  mutationFn: (variables: any) => Promise<any>,
  successKey?: any[],
  successMessage?: string
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn,
    onSuccess: (data) => {
      if (successKey) {
        queryClient.invalidateQueries({ queryKey: successKey });
      }
      if (successMessage) {
        toast.success(successMessage);
      }
    },
    onError: (error: any) => {
      toast.error(getErrorMessage(error));
    },
  });
}
