import {
    resolve
} from 'path'
import {
    defineConfig
} from 'vite'

export default defineConfig
    ({
        build: {
            rollupOptions: {
                input: {
                    main: resolve(__dirname, 'index.html'),
                    tangent_spaces: resolve(__dirname, 'tangent_spaces.html'),
                    manifold: resolve(__dirname, 'manifold.html'),
                },
            },
        },
        base: '/',
    })