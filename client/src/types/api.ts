export interface ApiSuccess<T> {
  success: true
  data: T
  meta?: {
    total: number
    page: number
    pageSize: number
  }
}

export interface ApiError {
  success: false
  error: {
    code: string
    message: string
  }
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError
