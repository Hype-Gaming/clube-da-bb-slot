export default defineEventHandler((event) => {
  setResponseHeader(event, 'cache-control', 'no-store')
  setResponseHeader(event, 'content-type', 'text/plain; charset=utf-8')
  return 'clube-slots:ok'
})
