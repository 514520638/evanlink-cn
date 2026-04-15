import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import type { UserInfo } from '@/types/user'

interface UserInfoState {
  userInfo: UserInfo | null
  loading: boolean
  error: string | null
}

const initialState: UserInfoState = {
  userInfo: null,
  loading: false,
  error: null,
}

const API_URL = `${window.location.protocol}//${window.location.hostname}:8080/api/user_info`

// 异步 thunk：获取用户信息
export const fetchUserInfo = createAsyncThunk(
  'userInfo/fetchUserInfo',
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetch(API_URL)
      if (!response.ok) {
        throw new Error(`请求失败: ${response.status}`)
      }
      const data = await response.json()
      return data
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : '获取用户信息失败')
    }
  }
)

const userInfoSlice = createSlice({
  name: 'userInfo',
  initialState,
  reducers: {
    setUserInfo: (state, action: PayloadAction<UserInfo | null>) => {
      state.userInfo = action.payload
    },
    clearUserInfo: (state) => {
      state.userInfo = null
      localStorage.removeItem('userInfo')
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchUserInfo.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchUserInfo.fulfilled, (state, action) => {
        state.loading = false
        state.userInfo = action.payload
      })
      .addCase(fetchUserInfo.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
      })
  },
})

export const { setUserInfo, clearUserInfo } = userInfoSlice.actions
export default userInfoSlice.reducer
