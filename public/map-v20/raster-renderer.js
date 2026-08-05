export class RasterRenderer { render({layer,group}){group.replaceChildren();group.dataset.rasterLayer=layer.id;group.dataset.rasterSource=layer.source;group.style.opacity=String(layer.opacity??1);} }
