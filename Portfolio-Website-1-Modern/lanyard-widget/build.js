import * as esbuild from 'esbuild';

async function build() {
  try {
    const result = await esbuild.build({
      entryPoints: ['src/main.jsx'],
      bundle: true,
      outfile: '../lanyard-dist/lanyard-widget.js',
      format: 'iife',
      globalName: 'LanyardWidget',
      define: {
        'process.env.NODE_ENV': '"production"',
      },
      loader: {
        '.glb': 'dataurl',
        '.png': 'dataurl',
        '.css': 'text',
      },
      minify: false,
      sourcemap: false,
    });
    console.log('Build succeeded!');
  } catch (err) {
    console.error('Build failed:', err);
    process.exit(1);
  }
}

build();
