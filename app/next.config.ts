import type { NextConfig } from 'next'
import path from 'path'

const repoRoot = path.join(__dirname, '..')

const nextConfig: NextConfig = {
  // Monorepo: include sibling packages (e.g. ../library) in traces and Turbopack
  outputFileTracingRoot: repoRoot,
  turbopack: {
    root: repoRoot,
  },
}

export default nextConfig
