import http from 'node:http'

const port = Number(process.env.PAYCHANGU_BRIDGE_PORT || 80)
const target = (process.env.PAYCHANGU_BRIDGE_TARGET || 'http://localhost:5173').replace(/\/$/, '')

const server = http.createServer((req, res) => {
  res.writeHead(302, {
    Location: `${target}${req.url || '/'}`,
    'Cache-Control': 'no-store',
  })
  res.end()
})

server.on('error', (error) => {
  if (error.code === 'EACCES') {
    console.error(`Cannot listen on port ${port}. Run with sudo or grant Node permission to bind low ports.`)
  } else if (error.code === 'EADDRINUSE') {
    console.error(`Port ${port} is already in use.`)
  } else {
    console.error(error)
  }
  process.exit(1)
})

server.listen(port, () => {
  console.log(`PayChangu return bridge: http://localhost:${port} -> ${target}`)
})
