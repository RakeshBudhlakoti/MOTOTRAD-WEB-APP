import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';

export function useAdminQuery(key: any[], fetchFn: () => Promise<any>, options?: any) {
  return useQuery({
    queryKey: key,
    queryFn: fetchFn,
    ...options,
  });
}

export function useAdminMutation(
  mutationFn: (variables: any) => Promise<any>,
  successKey?: any[],
  successMessage: string = 'Operation successful'
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn,
    onSuccess: (data) => {
      if (successKey) {
        queryClient.invalidateQueries({ queryKey: successKey });
      }
      toast.success(successMessage);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Something went wrong');
    },
  });
}
