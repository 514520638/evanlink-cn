import { configureStore } from '@reduxjs/toolkit'
import userInfoReducer from './slices/userInfoSlice'

export const store = configureStore({
  reducer: {
    userInfo: userInfoReducer,
    // 将来可以在这里添加更多 reducer
    // theme: themeReducer,
    // auth: authReducer,
  },
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
