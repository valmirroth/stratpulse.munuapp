import api from './api'
import type { LoginRequest, LoginResponse, User } from '../types'

export const authService = {
  login: async (data: LoginRequest): Promise<LoginResponse> => {
    const res = await api.post<LoginResponse>('/auth/login', data)
    return res.data
  },
  me: async (): Promise<User> => {
    const res = await api.get<User>('/auth/me')
    return res.data
  },
  changePassword: async (currentPassword: string, newPassword: string) => {
    await api.put('/auth/password', { current_password: currentPassword, new_password: newPassword })
  },
}
