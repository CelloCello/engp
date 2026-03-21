import { defineConfig } from 'vite';

function normalizeBasePath(basePath = '/') {
  if (!basePath || basePath === '/') {
    return '/';
  }

  const trimmed = basePath.endsWith('/') ? basePath.slice(0, -1) : basePath;
  return `${trimmed}/`;
}

export default defineConfig({
  base: normalizeBasePath(process.env.BASE_PATH),
});
