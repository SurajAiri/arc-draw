const exc = require('@excalidraw/excalidraw');
console.log(Object.keys(exc).filter(k => k.toLowerCase().includes('svg') || k.toLowerCase().includes('parse') || k.toLowerCase().includes('convert')));
