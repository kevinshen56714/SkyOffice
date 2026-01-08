/**
 * DevMode対応ログ管理システム
 * Redux DevModeStore と連携してログ出力を制御
 */

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3
}

export interface LogEntry {
  timestamp: number
  level: LogLevel
  component: string
  message: string
  data?: any
}

class Logger {
  private logs: LogEntry[] = []
  private maxLogs = 1000
  private listeners: Array<(entry: LogEntry) => void> = []

  // DevMode状態を外部から注入
  private isDevModeEnabled: () => boolean = () => false
  private currentLogLevel: LogLevel = LogLevel.INFO

  setDevModeChecker(checker: () => boolean) {
    this.isDevModeEnabled = checker
  }

  setLogLevel(level: LogLevel) {
    this.currentLogLevel = level
  }

  private shouldLog(level: LogLevel): boolean {
    // 本番環境では ERROR のみ
    if (import.meta.env.PROD && level < LogLevel.ERROR) {
      return false
    }
    
    // DevMode無効時は INFO 以上のみ
    if (!this.isDevModeEnabled() && level < LogLevel.INFO) {
      return false
    }

    return level >= this.currentLogLevel
  }

  private addLog(level: LogLevel, component: string, message: string, data?: any) {
    const entry: LogEntry = {
      timestamp: Date.now(),
      level,
      component,
      message,
      data
    }

    this.logs.push(entry)
    if (this.logs.length > this.maxLogs) {
      this.logs.shift()
    }

    // リスナーに通知
    this.listeners.forEach(listener => listener(entry))
  }

  debug(component: string, message: string, data?: any) {
    if (this.shouldLog(LogLevel.DEBUG)) {
      console.log(`🐛 [${component}] ${message}`, data || '')
      this.addLog(LogLevel.DEBUG, component, message, data)
    }
  }

  info(component: string, message: string, data?: any) {
    if (this.shouldLog(LogLevel.INFO)) {
      console.log(`ℹ️ [${component}] ${message}`, data || '')
      this.addLog(LogLevel.INFO, component, message, data)
    }
  }

  warn(component: string, message: string, data?: any) {
    if (this.shouldLog(LogLevel.WARN)) {
      console.warn(`⚠️ [${component}] ${message}`, data || '')
      this.addLog(LogLevel.WARN, component, message, data)
    }
  }

  error(component: string, message: string, data?: any) {
    if (this.shouldLog(LogLevel.ERROR)) {
      console.error(`❌ [${component}] ${message}`, data || '')
      this.addLog(LogLevel.ERROR, component, message, data)
    }
  }

  // DevMode専用機能
  getLogs(): LogEntry[] {
    return [...this.logs]
  }

  getLogsByComponent(component: string): LogEntry[] {
    return this.logs.filter(log => log.component === component)
  }

  getLogsByLevel(level: LogLevel): LogEntry[] {
    return this.logs.filter(log => log.level === level)
  }

  clearLogs() {
    this.logs = []
  }

  addListener(listener: (entry: LogEntry) => void) {
    this.listeners.push(listener)
  }

  removeListener(listener: (entry: LogEntry) => void) {
    const index = this.listeners.indexOf(listener)
    if (index > -1) {
      this.listeners.splice(index, 1)
    }
  }

  // 統計情報
  getLogStats() {
    const stats = {
      total: this.logs.length,
      debug: 0,
      info: 0,
      warn: 0,
      error: 0,
      components: new Map<string, number>()
    }

    this.logs.forEach(log => {
      switch (log.level) {
        case LogLevel.DEBUG: stats.debug++; break
        case LogLevel.INFO: stats.info++; break
        case LogLevel.WARN: stats.warn++; break
        case LogLevel.ERROR: stats.error++; break
      }

      const count = stats.components.get(log.component) || 0
      stats.components.set(log.component, count + 1)
    })

    return stats
  }
}

// グローバルロガーインスタンス
export const logger = new Logger()

// 便利なコンポーネント別ロガー作成関数
export const createComponentLogger = (componentName: string) => ({
  debug: (message: string, data?: any) => logger.debug(componentName, message, data),
  info: (message: string, data?: any) => logger.info(componentName, message, data),
  warn: (message: string, data?: any) => logger.warn(componentName, message, data),
  error: (message: string, data?: any) => logger.error(componentName, message, data)
})