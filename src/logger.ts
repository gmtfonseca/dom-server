export default {
  info(data: any) {
    if (process.env.NODE_ENV === 'development') {
      console.info(data)
    }
  },
  warn(data: any) {
    if (process.env.NODE_ENV !== 'test') {
      console.warn(data)
    }
  },
}
