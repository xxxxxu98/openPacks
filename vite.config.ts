import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

/** 仓库页地址带 /openPacks/，只在 GitHub Actions 里改资源前缀。 */
const githubActions = (globalThis as { process?: { env?: Record<string, string | undefined> } }).process
const base = githubActions?.env?.GITHUB_ACTIONS === 'true' ? '/openPacks/' : '/'

export default defineConfig({
  base,
  plugins: [react(), tailwindcss()],
})
