# V8.4 deployment fix

V8.4 specifically neutralises the Node 20 startup failure:

`Named export 'makeAbsolute' not found ... svg-path-parser is a CommonJS module`

The current image-to-DXF workflow is browser-based (`public/image-dxf.js`) and does not require `svg-path-parser`, `sharp`, or `potrace` on the Render server.

A compatibility module is intentionally present at `src/design/image-to-dxf.js` so that an older copied route cannot crash the Node process merely by importing that legacy path.

The V8.4 package also retains the V8.3 DXF Resizer:
- upload DXF
- choose source units if necessary
- enter target width, height, or fit to table
- aspect ratio is preserved
- output is regenerated in millimetres
- output is re-analysed against the active CrossFire envelope
- download the generated DXF
