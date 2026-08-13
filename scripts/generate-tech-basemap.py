from pathlib import Path
from PIL import Image, ImageEnhance, ImageFilter
import numpy as np, json, math
from mpl_toolkits.basemap import basemap_datadir, Basemap
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt

ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'public'/'assets'/'tech-map'
OUT.mkdir(parents=True, exist_ok=True)
SIZE=4096

def merc_lat(y,h):
    n=math.pi*(1-2*y/(h-1))
    return math.degrees(math.atan(math.sinh(n)))

def mercator_resample(path,size=SIZE):
    im=Image.open(path).convert('RGB')
    # resize longitude axis once
    im=im.resize((size,im.height),Image.Resampling.LANCZOS)
    a=np.asarray(im,dtype=np.float32)
    h=a.shape[0]
    ys=np.empty(size,dtype=np.float32)
    for y in range(size):
        lat=merc_lat(y,size)
        ys[y]=(90-lat)/180*(h-1)
    y0=np.floor(ys).astype(np.int32); y1=np.minimum(y0+1,h-1); t=(ys-y0)[:,None,None]
    out=a[y0]*(1-t)+a[y1]*t
    return out

bm=mercator_resample(Path(basemap_datadir)/'bmng.jpg')
rel=mercator_resample(Path(basemap_datadir)/'shadedrelief.jpg')
# Luminance / terrain modulation
lum=(0.2126*rel[:,:,0]+0.7152*rel[:,:,1]+0.0722*rel[:,:,2])/255.0
bmn=bm/255.0
# Detect ocean from blue marble
water=(bmn[:,:,2] > bmn[:,:,1]*1.18) & (bmn[:,:,2] > bmn[:,:,0]*1.45)
ice=(lum>0.80)&(bmn.mean(axis=2)>0.65)
# dark land retaining subtle natural variation
land=np.empty_like(bmn)
land[:,:,0]=0.018 + 0.16*bmn[:,:,0] + 0.05*lum
land[:,:,1]=0.045 + 0.20*bmn[:,:,1] + 0.06*lum
land[:,:,2]=0.070 + 0.19*bmn[:,:,2] + 0.08*lum
# deep ocean with bathymetry texture
sea=np.empty_like(bmn)
sea[:,:,0]=0.006 + 0.035*lum + 0.025*bmn[:,:,2]
sea[:,:,1]=0.035 + 0.10*lum + 0.10*bmn[:,:,2]
sea[:,:,2]=0.085 + 0.19*lum + 0.18*bmn[:,:,2]
out=np.where(water[:,:,None],sea,land)
out=np.where(ice[:,:,None],np.clip(np.stack([0.33+0.34*lum,0.42+0.35*lum,0.50+0.36*lum],axis=2),0,1),out)
# vertical lighting: slightly brighter priority hemisphere belt / equatorial readable contrast
Y=np.linspace(-1,1,SIZE)[:,None]
light=(1.0-0.15*np.abs(Y))[:,:,None]
out*=light
out=np.clip(out*255,0,255).astype(np.uint8)
img=Image.fromarray(out,'RGB')
img=ImageEnhance.Contrast(img).enhance(1.28)
img=ImageEnhance.Sharpness(img).enhance(1.55)
img=img.filter(ImageFilter.UnsharpMask(radius=1.2,percent=115,threshold=2))
master=OUT/'world-tech-mercator.jpg'
img.save(master,quality=91,subsampling=1,optimize=True)
# raster pyramid z0..3
for z in range(4):
    dim=512*(2**z)
    level=img.resize((dim,dim),Image.Resampling.LANCZOS)
    n=2**z
    for x in range(n):
        d=OUT/str(z)/str(x); d.mkdir(parents=True,exist_ok=True)
        for y in range(n):
            tile=level.crop((x*512,y*512,(x+1)*512,(y+1)*512))
            tile.save(d/f'{y}.jpg',quality=89,subsampling=1,optimize=True)

# Build crisp reference geometry from Basemap datasets.
m=Basemap(projection='merc',llcrnrlon=-180,llcrnrlat=-85,urcrnrlon=180,urcrnrlat=85,resolution='i')
fig=plt.figure(figsize=(4,4),dpi=80);ax=fig.add_axes([0,0,1,1])
coast=m.drawcoastlines(ax=ax); countries=m.drawcountries(ax=ax); rivers=m.drawrivers(ax=ax)

def segs_to_features(collection,kind,maxpts=1000):
    feats=[]
    for i,seg in enumerate(collection.get_segments()):
        if len(seg)<2: continue
        # simplify long segments lightly
        step=max(1,len(seg)//maxpts)
        xy=seg[::step]
        lon,lat=m(xy[:,0],xy[:,1],inverse=True)
        coords=[]
        for lo,la in zip(lon,lat):
            if np.isfinite(lo) and np.isfinite(la) and -180.1<=lo<=180.1 and -85.1<=la<=85.1:
                coords.append([round(float(lo),5),round(float(la),5)])
        if len(coords)>=2:
            feats.append({'type':'Feature','properties':{'kind':kind,'id':f'{kind}-{i}'},'geometry':{'type':'LineString','coordinates':coords}})
    return feats
features=segs_to_features(coast,'coast')+segs_to_features(countries,'country')+segs_to_features(rivers,'river',600)
plt.close(fig)
(ROOT/'public'/'data'/'tech-base-lines.json').write_text(json.dumps({'type':'FeatureCollection','features':features},separators=(',',':')))
print(json.dumps({'master':str(master),'masterBytes':master.stat().st_size,'tiles':sum(4**z for z in range(4)),'lineFeatures':len(features)}))
