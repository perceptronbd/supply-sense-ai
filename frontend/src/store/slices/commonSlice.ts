import { PayloadAction, createSlice } from '@reduxjs/toolkit';

const initialState = {
  isOpen: false,
};

const commonSlice = createSlice({
  name: 'commonSlice',
  initialState,
  reducers: {
    setIsOpen: (state, action: PayloadAction<boolean>) => {
      state.isOpen = action.payload;
    },
  },
});

export const { setIsOpen } = commonSlice.actions;
export default commonSlice.reducer;
