import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'

export interface SkillItem {
  name: string
  nameEn: string
  level: number
}

export interface SkillCategory {
  classify: string
  classifyEn: string
  list: SkillItem[]
}

interface SkillsState {
  skills: SkillCategory[]
  loading: boolean
  error: string | null
}

const initialState: SkillsState = {
  skills: [],
  loading: false,
  error: null,
}

// API端点
const API_BASE_URL = `${window.location.protocol}//${window.location.hostname}:8080/api`

// 异步获取skills数据
export const fetchSkills = createAsyncThunk('skills/fetchSkills', async () => {
  const response = await fetch(`${API_BASE_URL}/skills`)
  if (!response.ok) {
    throw new Error('Failed to fetch skills')
  }
  return response.json()
})

const skillsSlice = createSlice({
  name: 'skills',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchSkills.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchSkills.fulfilled, (state, action: PayloadAction<SkillCategory[]>) => {
        state.loading = false
        state.skills = action.payload
      })
      .addCase(fetchSkills.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message || 'Failed to fetch skills'
      })
  },
})

export default skillsSlice.reducer
