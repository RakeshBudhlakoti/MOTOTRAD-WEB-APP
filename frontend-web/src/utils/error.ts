export const getErrorMessage = (error: any): string => {
  if (typeof error === 'string') return error;
  
  if (error?.response?.data?.message) {
    const message = error.response.data.message;
    if (Array.isArray(message)) return message[0];
    if (typeof message === 'string') return message;
    if (typeof message === 'object' && message.message) return message.message;
    return JSON.stringify(message);
  }

  if (error?.message) return error.message;
  
  return 'An unexpected error occurred';
};
