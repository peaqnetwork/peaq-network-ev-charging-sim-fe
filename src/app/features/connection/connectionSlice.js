import { createSlice } from "@reduxjs/toolkit";

export const connectionSlice = createSlice({
  name: "connection",
  initialState: {
    status: "disconnected",
    nodeAddress: "wss://fn1.test.peaq.network",
  },
  reducers: {
    setConnecting: (state) => {
      state.status = "connecting";
    },
    setConnected: (state) => {
      state.status = "connected";
    },
    setDisconnect: (state) => {
      state.status = "disconnect";
    },
    setDisconnecting: (state) => {
      state.status = "disconnecting";
    },
    setDisconnected: (state) => {
      state.status = "disconnected";
    },
    setNodeAddress: (state, action) => {
      state.nodeAddress = action.payload;
    }
  },
});

// Action creators are generated for each case reducer function
export const {
  setConnecting,
  setConnected,
  setDisconnect,
  setDisconnecting,
  setDisconnected,
  setNodeAddress,
} = connectionSlice.actions;

export default connectionSlice.reducer;
