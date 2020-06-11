import resolve from 'rollup-plugin-node-resolve';
import babel from 'rollup-plugin-babel';
import { uglify } from "rollup-plugin-uglify";

export default [{
    input: 'src/index.js',
    output: {
        file: 'dist/Duex.js',
        format: 'umd',
        name: 'Duex',
        sourcemap: true
    },
    plugins: [
        resolve(),
        babel({
            exclude: 'node_modules/**'
        })
    ]
}, {
    input: 'src/index.js',
    output: {
        file: 'dist/Duex.min.js',
        format: 'umd',
        name: 'Duex',
        sourcemap: true
    },
    plugins: [
        resolve(),
        babel({
            exclude: 'node_modules/**'
        }),
        uglify()
    ]
}];