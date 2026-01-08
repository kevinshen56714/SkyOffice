/**
 * アプリケーション全体で使用されるエラークラス定義
 */

export class WorkStatusError extends Error {
  public readonly code: string
  public readonly originalError?: Error

  constructor(message: string, originalError?: Error, code = 'WORK_STATUS_ERROR') {
    super(message)
    this.name = 'WorkStatusError'
    this.code = code
    this.originalError = originalError
    
    // スタックトレースを正しく保持
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, WorkStatusError)
    }
  }
}

export class NetworkError extends Error {
  public readonly code: string
  public readonly originalError?: Error

  constructor(message: string, originalError?: Error, code = 'NETWORK_ERROR') {
    super(message)
    this.name = 'NetworkError'
    this.code = code
    this.originalError = originalError
    
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, NetworkError)
    }
  }
}

export class ValidationError extends Error {
  public readonly field: string
  public readonly value: any

  constructor(message: string, field: string, value: any) {
    super(message)
    this.name = 'ValidationError'
    this.field = field
    this.value = value
    
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ValidationError)
    }
  }
}