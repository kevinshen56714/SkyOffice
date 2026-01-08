import { useEffect, useMemo } from 'react'
import { useAppSelector, useAppDispatch } from '../hooks'
import { toggleDevMode, setDevmode } from '../stores/DevModeStore'
import { logger, createComponentLogger, LogLevel, LogEntry } from '../utils/logger'

/**
 * Custom hook for managing DevMode functionality
 * Provides integration between Redux DevModeStore and logger
 */
export const useDevMode = () => {
  const dispatch = useAppDispatch()
  const isDevMode = useAppSelector((state) => state.devMode.isDevMode)

  // Set DevMode state checker for logger
  useEffect(() => {
    logger.setDevModeChecker(() => isDevMode)
  }, [isDevMode])

  // DevMode toggle log (commented out as already handled by DevModeStore)
  // useEffect(() => {
  //   if (isDevMode) {
  //     console.log('🐛 [DevMode] Debug logging enabled - Components will now show detailed logs')
  //     console.log('📊 [DevMode] DevMode Panel is now visible in the top-right corner')
  //   } else {
  //     console.log('🔇 [DevMode] Debug logging disabled - Only INFO+ logs will be shown')
  //   }
  // }, [isDevMode])

  // DevMode toggle function
  const toggleDev = () => {
    dispatch(toggleDevMode())
  }

  // DevMode setting function
  const setDev = (enabled: boolean) => {
    dispatch(setDevmode(enabled))
  }

  // Log level setting
  const setLogLevel = (level: LogLevel) => {
    logger.setLogLevel(level)
  }

  // DevMode-specific log functionality
  const devLog = {
    debug: (component: string, message: string, data?: any) => {
      if (isDevMode) {
        logger.debug(component, message, data)
      }
    },
    info: (component: string, message: string, data?: any) => {
      if (isDevMode) {
        logger.info(component, message, data)
      }
    },
    warn: (component: string, message: string, data?: any) => {
      logger.warn(component, message, data)
    },
    error: (component: string, message: string, data?: any) => {
      logger.error(component, message, data)
    }
  }

  // Log management functionality (memoized)
  const logManager = useMemo(() => ({
    getLogs: () => logger.getLogs(),
    getLogsByComponent: (component: string) => logger.getLogsByComponent(component),
    getLogsByLevel: (level: LogLevel) => logger.getLogsByLevel(level),
    clearLogs: () => logger.clearLogs(),
    getStats: () => logger.getLogStats(),
    addListener: (listener: (entry: LogEntry) => void) => logger.addListener(listener),
    removeListener: (listener: (entry: LogEntry) => void) => logger.removeListener(listener)
  }), [])

  // Create component-specific logger
  const createLogger = (componentName: string) => {
    const componentLogger = createComponentLogger(componentName)
    
    // Return logger that considers DevMode state
    return {
      debug: (message: string, data?: any) => {
        if (isDevMode) {
          componentLogger.debug(message, data)
        }
      },
      info: (message: string, data?: any) => {
        if (isDevMode) {
          componentLogger.info(message, data)
        }
      },
      warn: (message: string, data?: any) => componentLogger.warn(message, data),
      error: (message: string, data?: any) => componentLogger.error(message, data)
    }
  }

  return {
    isDevMode,
    toggleDev,
    setDev,
    setLogLevel,
    devLog,
    logManager,
    createLogger
  }
}

// Convenient type definition for Redux state debugging
export interface DevModeState {
  isDevMode: boolean
}

// DevMode-specific utility hook
export const useDevLogger = (componentName: string) => {
  const { createLogger } = useDevMode()
  return createLogger(componentName)
}