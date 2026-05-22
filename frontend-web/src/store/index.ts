import { configureStore } from '@reduxjs/toolkit';
import authReducer from '@/store/slices/authSlice';
import auctionReducer from '@/store/slices/auctionSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    auctions: auctionReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
