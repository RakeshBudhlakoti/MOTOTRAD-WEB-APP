import { configureStore } from '@reduxjs/toolkit';
import authReducer from '@/store/slices/authSlice';
import layoutReducer from '@/store/slices/layoutSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    layout: layoutReducer,
  },
});

export type RootState = {
  auth: ReturnType<typeof authReducer>;
  layout: ReturnType<typeof layoutReducer>;
};

export type AppDispatch = typeof store.dispatch;
