const LOG_LEVELS = Object.freeze({
  silent: 0,
  info: 1,
  warn: 2,
  error: 3,
})

class Logger {
  private severity: number
  constructor(level: keyof typeof LOG_LEVELS) {
    this.severity = LOG_LEVELS[level]
  }

  info(data: any) {
    if (LOG_LEVELS.info >= this.severity) {
      console.info(data)
    }
  }

  warn(data: any) {
    if (LOG_LEVELS.warn >= this.severity) {
      console.warn(data)
    }
  }

  error(data: any) {
    if (LOG_LEVELS.error >= this.severity) {
      console.error(data)
    }
  }
}

const logLevel = process.env.LOG_LEVEL as keyof typeof LOG_LEVELS
export default new Logger(logLevel || 'error')
