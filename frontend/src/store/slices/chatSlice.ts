import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface ChatState {
  sessionRefreshTrigger: number;
  processedSessions: string[];
}

const initialState: ChatState = {
  sessionRefreshTrigger: 0,
  processedSessions: [],
};

const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    triggerSessionRefresh: (state) => {
      state.sessionRefreshTrigger += 1;
    },
    markSessionProcessed: (state, action: PayloadAction<string>) => {
      if (!state.processedSessions.includes(action.payload)) {
        state.processedSessions.push(action.payload);
      }
    },
    clearProcessedSessions: (state) => {
      state.processedSessions = [];
    },
  },
});

export const { triggerSessionRefresh, markSessionProcessed, clearProcessedSessions } =
  chatSlice.actions;
export default chatSlice.reducer;
