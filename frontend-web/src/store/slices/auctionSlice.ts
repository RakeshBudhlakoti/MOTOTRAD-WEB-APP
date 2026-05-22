import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface AuctionState {
  liveBids: Record<string, any[]>;
  currentAuction: any | null;
}

const initialState: AuctionState = {
  liveBids: {},
  currentAuction: null,
};

const auctionSlice = createSlice({
  name: 'auctions',
  initialState,
  reducers: {
    setLiveBid: (state, action: PayloadAction<{ auctionId: string; bid: any }>) => {
      const { auctionId, bid } = action.payload;
      if (!state.liveBids[auctionId]) {
        state.liveBids[auctionId] = [];
      }
      state.liveBids[auctionId] = [bid, ...state.liveBids[auctionId]].slice(0, 50);
    },
    setCurrentAuction: (state, action: PayloadAction<any>) => {
      state.currentAuction = action.payload;
    },
  },
});

export const { setLiveBid, setCurrentAuction } = auctionSlice.actions;
export default auctionSlice.reducer;
