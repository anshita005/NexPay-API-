import axiosClient from './axiosClient'
import type { AuthResponse } from '../types'

export const authApi = {
  register: (data: { email: string; password: string; fullName: string }) =>
    axiosClient.post<AuthResponse>('/api/v1/auth/register', data),

  login: (data: { email: string; password: string }) =>
    axiosClient.post<AuthResponse>('/api/v1/auth/login', data),

  googleLogin: (idToken: string) =>
    axiosClient.post<AuthResponse>('/api/v1/auth/google', { idToken }),
}
