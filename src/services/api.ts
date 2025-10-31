import axios from 'axios'

const API_BASE_URL = 'http://localhost:8000'

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

export interface Photo {
  filename: string
  created: string | null
  dimensions: {
    width: number | null
    height: number | null
  }
  data: string
}

export interface Album {
  name: string
  count: number
}

export interface AnalyzeRequest {
  photo_data: string
  filename: string
}

export interface AnalyzeResponse {
  filename: string
  description: string
  analysis_time: string
}

export interface PromptRequest {
  description: string
  filename: string
}

export interface PromptResponse {
  filename: string
  art_prompt: string
  prompt_time: string
  prompt_template: string
}

export interface GenerateRequest {
  photo_data: string
  filename: string
  description: string
  prompt: string
  prompt_template?: string
  generation_prompt?: string
}

export interface GenerateResponse {
  id: string
  filename: string
  original_filename: string
  prompt: string
  description: string
  prompt_template?: string
  generation_prompt?: string
  generated_image: string
  generation_time: string
  saved_path: string
}

export interface HistoryEntry {
  id: string
  filename: string
  original_filename: string
  prompt: string
  description: string
  prompt_template?: string
  generation_prompt?: string
  timestamp: number
  generation_time: string
}

export interface HistoryResponse {
  history: HistoryEntry[]
}

export const iCloudAPI = {
  // Authentication
  login: async (appleId: string, password: string) => {
    const response = await api.post('/api/auth/login', {
      apple_id: appleId,
      password: password
    })
    return response.data
  },

  verify2FA: async (code: string) => {
    const response = await api.post('/api/auth/verify-2fa', {
      code: code
    })
    return response.data
  },

  checkAuthStatus: async () => {
    const response = await api.get('/api/auth/status')
    return response.data
  },

  // Photos
  getAlbums: async (): Promise<{ albums: Album[] }> => {
    const response = await api.get('/api/photos/albums')
    return response.data
  },

  getRandomPhoto: async (album?: string): Promise<Photo> => {
    const response = await api.get('/api/photos/random', {
      params: album ? { album } : undefined
    })
    return response.data
  },

  getPhotoByFilename: async (filename: string): Promise<Photo> => {
    const response = await api.get(`/api/photos/${filename}`)
    return response.data
  },

  // AI Analysis and Generation
  analyzeImage: async (photo: Photo): Promise<AnalyzeResponse> => {
    const response = await api.post('/api/analyze', {
      photo_data: photo.data,
      filename: photo.filename
    })
    return response.data
  },

  generatePrompt: async (description: string, filename: string): Promise<PromptResponse> => {
    const response = await api.post('/api/prompt', {
      description: description,
      filename: filename
    })
    return response.data
  },

  generateImage: async (photo: Photo, description: string, prompt: string, promptTemplate?: string, generationPrompt?: string): Promise<GenerateResponse> => {
    const response = await api.post('/api/generate', {
      photo_data: photo.data,
      filename: photo.filename,
      description: description,
      prompt: prompt,
      prompt_template: promptTemplate,
      generation_prompt: generationPrompt
    })
    return response.data
  },

  // Generated Images History
  getGeneratedHistory: async (): Promise<HistoryResponse> => {
    const response = await api.get('/api/generated/history')
    return response.data
  },

  getGeneratedImage: async (filename: string): Promise<{ filename: string, data: string }> => {
    const response = await api.get(`/api/generated/${filename}`)
    return response.data
  },
}

export default api

