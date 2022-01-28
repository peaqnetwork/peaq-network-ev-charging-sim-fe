import { configureStore } from '@reduxjs/toolkit'
import connectionReducer from '../features/connection/connectionSlice'

export default configureStore({
  reducer: {
    connection: connectionReducer,
  }
})