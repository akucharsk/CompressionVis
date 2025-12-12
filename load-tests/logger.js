export const logger = {
  info(...args) {
    console.log(`[ INFO ] ${new Date().toISOString()}]`, ...args);
  },
  error(...args) {
    console.error(`[ ERROR ] ${new Date().toISOString()}]`, ...args);
  },
  warn(...args) {
    console.warn(`[ WARN ] ${new Date().toISOString()}]`, ...args);
  },
  debug(...args) {
    console.debug(`[ DEBUG ] ${new Date().toISOString()}]`, ...args);
  },
  trace(...args) {
    console.trace(`[ TRACE ] ${new Date().toISOString()}]`, ...args);
  },
}