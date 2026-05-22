import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface LayoutState {
  sidebarCollapsed: boolean;
  mobileSidebarOpen: boolean;
}

const initialState: LayoutState = {
  sidebarCollapsed: false,
  mobileSidebarOpen: false,
};

const layoutSlice = createSlice({
  name: 'layout',
  initialState,
  reducers: {
    toggleSidebar: (state) => {
      state.sidebarCollapsed = !state.sidebarCollapsed;
    },
    setSidebarCollapsed: (state, action: PayloadAction<boolean>) => {
      state.sidebarCollapsed = action.payload;
    },
    toggleMobileSidebar: (state) => {
      state.mobileSidebarOpen = !state.mobileSidebarOpen;
    },
    setMobileSidebarOpen: (state, action: PayloadAction<boolean>) => {
      state.mobileSidebarOpen = action.payload;
    },
  },
});

export const { toggleSidebar, setSidebarCollapsed, toggleMobileSidebar, setMobileSidebarOpen } = layoutSlice.actions;
export default layoutSlice.reducer;
