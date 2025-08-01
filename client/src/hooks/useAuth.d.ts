export interface Admin {
  id?: string
  _id?: string
  name: string
  email: string
  role: string
  token: string
  createdAt?: string
}

export interface UseAuthReturn {
  admin: Admin | null
  loading: boolean
  login: (adminData: Admin) => void
  logout: () => void
  getAdminId: () => string | undefined
  getToken: () => string | undefined
  isAuthenticated: boolean
  checkAuth: () => Promise<void>
}

export declare function useAuth(): UseAuthReturn 