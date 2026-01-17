import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface ChatState {
  sessionId: string;
  sessionRefreshTrigger: number;
  processedSessions: string[];
}

const initialState: ChatState = {
  sessionRefreshTrigger: 0,
  processedSessions: [],
  sessionId: '',
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
    setSessionId: (state, action: PayloadAction<string>) => {
      state.sessionId = action.payload;
    },
    clearSessions: (state) => {
      state.sessionId = '';
      state.processedSessions = [];
    },
  },
});

export const {
  triggerSessionRefresh,
  markSessionProcessed,
  clearProcessedSessions,
  setSessionId,
  clearSessions,
} = chatSlice.actions;
export default chatSlice.reducer;
