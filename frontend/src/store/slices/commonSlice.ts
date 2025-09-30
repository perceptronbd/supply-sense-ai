import { PayloadAction, createSlice } from '@reduxjs/toolkit';

const initialState = {
  toggleKey: {} as { [key: string]: boolean },
};

const commonSlice = createSlice({
  name: 'commonSlice',
  initialState,
  reducers: {
    setToggleValue: (state, action: PayloadAction<{ [key: string]: boolean }>) => {
      state.toggleKey = action.payload;
    },
  },
});

export const { setToggleValue } = commonSlice.actions;
export default commonSlice.reducer;
