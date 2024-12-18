// rollup.config.mjs
import typescript from '@rollup/plugin-typescript'
import { defineConfig } from 'rollup'
import dts from 'rollup-plugin-dts'
import del from 'rollup-plugin-delete'

if (process.env.NODE_ENV === undefined) {
  process.env.NODE_ENV = 'development'
}

export default defineConfig([
  {
    input: ['src/index.ts'],
    output: {
      dir: 'dist',
      format: 'es',
      preserveModules: true
    },
    plugins: [
      typescript(),
    ],
  },
  {
    input: 'dist/types/index.d.ts',
    output: {
      file: 'dist/blog-helper/src/index.d.ts',
      format: 'esm',
    },
    plugins: [
      dts(),
      del({
        targets: 'dist/types',
        hook: 'buildEnd',
        verbose: true,
      }),
    ],
  }
])