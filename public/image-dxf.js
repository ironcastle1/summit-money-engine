(function(){
  function clamp(v,a,b){return Math.max(a,Math.min(b,v));}
  function idx(x,y,w){return y*w+x;}
  function rdp(points,epsilon){
    if(points.length<3)return points.slice();
    const first=points[0],last=points[points.length-1];
    let maxD=0,index=0;
    const dx=last.x-first.x,dy=last.y-first.y,den=Math.hypot(dx,dy)||1;
    for(let i=1;i<points.length-1;i++){
      const p=points[i];
      const d=Math.abs(dy*p.x-dx*p.y+last.x*first.y-last.y*first.x)/den;
      if(d>maxD){maxD=d;index=i;}
    }
    if(maxD>epsilon){
      const a=rdp(points.slice(0,index+1),epsilon),b=rdp(points.slice(index),epsilon);
      return a.slice(0,-1).concat(b);
    }
    return [first,last];
  }
  function polygonArea(loop){let a=0;for(let i=0;i<loop.length;i++){const p=loop[i],q=loop[(i+1)%loop.length];a+=p.x*q.y-q.x*p.y;}return a/2;}
  function bounds(loops){let minX=Infinity,minY=Infinity,maxX=-Infinity,maxY=-Infinity;for(const loop of loops)for(const p of loop){if(p.x<minX)minX=p.x;if(p.y<minY)minY=p.y;if(p.x>maxX)maxX=p.x;if(p.y>maxY)maxY=p.y;}return {minX,minY,maxX,maxY,width:maxX-minX,height:maxY-minY};}
  function connectedLargest(mask,w,h){
    const seen=new Uint8Array(mask.length);let best=[];
    const dirs=[[1,0],[-1,0],[0,1],[0,-1]];
    for(let y=0;y<h;y++)for(let x=0;x<w;x++){
      const at=idx(x,y,w);if(!mask[at]||seen[at])continue;
      const comp=[],qx=[x],qy=[y];seen[at]=1;
      for(let q=0;q<qx.length;q++){
        const cx=qx[q],cy=qy[q];comp.push(idx(cx,cy,w));
        for(const [dx,dy] of dirs){const nx=cx+dx,ny=cy+dy;if(nx<0||ny<0||nx>=w||ny>=h)continue;const ni=idx(nx,ny,w);if(mask[ni]&&!seen[ni]){seen[ni]=1;qx.push(nx);qy.push(ny);}}
      }
      if(comp.length>best.length)best=comp;
    }
    const out=new Uint8Array(mask.length);for(const i of best)out[i]=1;return {mask:out,size:best.length};
  }
  function componentList(mask,w,h,minPixels=4,maxComponents=120){
    const seen=new Uint8Array(mask.length),dirs=[[1,0],[-1,0],[0,1],[0,-1]],comps=[];
    for(let y=0;y<h;y++)for(let x=0;x<w;x++){
      const at=idx(x,y,w);if(!mask[at]||seen[at])continue;
      const pixels=[],boundary=[],qx=[x],qy=[y];seen[at]=1;let minX=x,maxX=x,minY=y,maxY=y;
      for(let q=0;q<qx.length;q++){
        const cx=qx[q],cy=qy[q],pi=idx(cx,cy,w);pixels.push(pi);minX=Math.min(minX,cx);maxX=Math.max(maxX,cx);minY=Math.min(minY,cy);maxY=Math.max(maxY,cy);
        let edge=false;
        for(const [dx,dy] of dirs){const nx=cx+dx,ny=cy+dy;if(nx<0||ny<0||nx>=w||ny>=h){edge=true;continue;}const ni=idx(nx,ny,w);if(!mask[ni])edge=true;else if(!seen[ni]){seen[ni]=1;qx.push(nx);qy.push(ny);}}
        if(edge)boundary.push({x:cx,y:cy});
      }
      if(pixels.length>=minPixels)comps.push({pixels,boundary,size:pixels.length,minX,maxX,minY,maxY});
    }
    comps.sort((a,b)=>b.size-a.size);return comps.slice(0,maxComponents);
  }
  function erode(mask,w,h){
    const out=new Uint8Array(mask.length);
    for(let y=1;y<h-1;y++)for(let x=1;x<w-1;x++){
      let keep=1;
      for(let yy=-1;yy<=1&&keep;yy++)for(let xx=-1;xx<=1;xx++)if(!mask[idx(x+xx,y+yy,w)]){keep=0;break;}
      out[idx(x,y,w)]=keep;
    }
    return out;
  }
  function dilate(mask,w,h,passes=1){
    let cur=mask;
    for(let pass=0;pass<passes;pass++){
      const out=new Uint8Array(cur.length);
      for(let y=0;y<h;y++)for(let x=0;x<w;x++)if(cur[idx(x,y,w)]){
        for(let yy=-1;yy<=1;yy++)for(let xx=-1;xx<=1;xx++){const nx=x+xx,ny=y+yy;if(nx>=0&&ny>=0&&nx<w&&ny<h)out[idx(nx,ny,w)]=1;}
      }
      cur=out;
    }
    return cur;
  }
  function closeMask(mask,w,h,passes=1){let cur=mask;for(let i=0;i<passes;i++)cur=erode(dilate(cur,w,h,1),w,h);return cur;}
  function despeckle(mask,w,h,passes=1){
    let cur=mask;
    for(let pass=0;pass<passes;pass++){
      const out=new Uint8Array(cur.length);
      for(let y=1;y<h-1;y++)for(let x=1;x<w-1;x++){
        let n=0;for(let yy=-1;yy<=1;yy++)for(let xx=-1;xx<=1;xx++)if(cur[idx(x+xx,y+yy,w)])n++;
        out[idx(x,y,w)]=n>=4?1:0;
      }
      cur=out;
    }
    return cur;
  }
  function boundaryEdges(mask,w,h){
    const edges=[];function add(x1,y1,x2,y2){edges.push({x1,y1,x2,y2});}
    for(let y=0;y<h;y++)for(let x=0;x<w;x++)if(mask[idx(x,y,w)]){
      if(y===0||!mask[idx(x,y-1,w)])add(x,y,x+1,y);
      if(x===w-1||!mask[idx(x+1,y,w)])add(x+1,y,x+1,y+1);
      if(y===h-1||!mask[idx(x,y+1,w)])add(x+1,y+1,x,y+1);
      if(x===0||!mask[idx(x-1,y,w)])add(x,y+1,x,y);
    }
    return edges;
  }
  function stitchEdges(edges){
    const byStart=new Map(),key=(x,y)=>x+','+y;
    for(let i=0;i<edges.length;i++){const e=edges[i],k=key(e.x1,e.y1);if(!byStart.has(k))byStart.set(k,[]);byStart.get(k).push(i);}
    const used=new Uint8Array(edges.length),loops=[];
    for(let seed=0;seed<edges.length;seed++){
      if(used[seed])continue;
      const loop=[];let ei=seed,guard=0;const start=edges[seed],sx=start.x1,sy=start.y1;
      while(ei!=null&&!used[ei]&&guard++<edges.length+10){
        const e=edges[ei];used[ei]=1;loop.push({x:e.x1,y:e.y1});
        if(e.x2===sx&&e.y2===sy){loop.push({x:sx,y:sy});break;}
        const list=byStart.get(key(e.x2,e.y2))||[];let next=null;for(const j of list)if(!used[j]){next=j;break;}ei=next;
      }
      if(loop.length>=5&&loop[0].x===loop[loop.length-1].x&&loop[0].y===loop[loop.length-1].y)loops.push(loop);
    }
    return loops;
  }
  function simplifyLoops(loops,tolerance,minArea){
    const out=[];
    for(const loop of loops){
      const closed=loop.slice();closed.pop();if(closed.length<4)continue;
      let simple=rdp(closed.concat([closed[0]]),tolerance);if(simple.length>1&&simple[0].x===simple[simple.length-1].x&&simple[0].y===simple[simple.length-1].y)simple.pop();
      if(simple.length<3)continue;
      if(Math.abs(polygonArea(simple))<minArea)continue;
      out.push(simple);
    }
    out.sort((a,b)=>Math.abs(polygonArea(b))-Math.abs(polygonArea(a)));
    return out;
  }
  function otsu(gray){
    const hist=new Uint32Array(256);for(const g of gray)hist[Math.round(g)]++;
    const total=gray.length;let sum=0;for(let i=0;i<256;i++)sum+=i*hist[i];
    let sumB=0,wB=0,max=0,threshold=127;
    for(let i=0;i<256;i++){
      wB+=hist[i];if(!wB)continue;const wF=total-wB;if(!wF)break;sumB+=i*hist[i];const mB=sumB/wB,mF=(sum-sumB)/wF;const between=wB*wF*(mB-mF)*(mB-mF);if(between>max){max=between;threshold=i;}
    }
    return threshold;
  }
  async function raster(file,opts={}){
    const bitmap=await createImageBitmap(file);const maxPx=clamp(Number(opts.maxPixels||900),300,1400);const scale=Math.min(1,maxPx/Math.max(bitmap.width,bitmap.height));const w=Math.max(8,Math.round(bitmap.width*scale)),h=Math.max(8,Math.round(bitmap.height*scale));
    const canvas=document.createElement('canvas');canvas.width=w;canvas.height=h;const ctx=canvas.getContext('2d',{willReadFrequently:true});ctx.fillStyle='#fff';ctx.fillRect(0,0,w,h);ctx.drawImage(bitmap,0,0,w,h);bitmap.close();
    const rgba=ctx.getImageData(0,0,w,h).data,gray=new Float32Array(w*h);let borderR=0,borderG=0,borderB=0,borderN=0,all=0,borderLum=0;
    for(let y=0;y<h;y++)for(let x=0;x<w;x++){
      const p=idx(x,y,w),i=p*4,r=rgba[i],g=rgba[i+1],b=rgba[i+2],lum=r*.299+g*.587+b*.114;gray[p]=lum;all+=lum;
      if(x<6||y<6||x>=w-6||y>=h-6){borderR+=r;borderG+=g;borderB+=b;borderLum+=lum;borderN++;}
    }
    return {rgba,gray,w,h,avg:all/(w*h),borderLum:borderLum/Math.max(1,borderN),borderRGB:[borderR/borderN,borderG/borderN,borderB/borderN],otsu:otsu(gray)};
  }
  function thresholdMask(gray,threshold,foreground){const mask=new Uint8Array(gray.length);for(let i=0;i<gray.length;i++)mask[i]=foreground==='dark'?(gray[i]<threshold?1:0):(gray[i]>threshold?1:0);return mask;}
  function borderDifferenceMask(r,threshold){
    const [br,bg,bb]=r.borderRGB,mask=new Uint8Array(r.w*r.h);
    for(let p=0;p<mask.length;p++){const i=p*4,dr=r.rgba[i]-br,dg=r.rgba[i+1]-bg,db=r.rgba[i+2]-bb;const d=Math.sqrt(dr*dr+dg*dg+db*db);mask[p]=d>threshold?1:0;}
    return mask;
  }
  function localContrastMask(r,threshold=26){
    const mask=new Uint8Array(r.w*r.h),radius=4;
    for(let y=radius;y<r.h-radius;y++)for(let x=radius;x<r.w-radius;x++){
      let sum=0,n=0;for(let yy=-radius;yy<=radius;yy+=2)for(let xx=-radius;xx<=radius;xx+=2){sum+=r.gray[idx(x+xx,y+yy,r.w)];n++;}
      const mean=sum/n,g=r.gray[idx(x,y,r.w)];if(Math.abs(g-mean)>=threshold)mask[idx(x,y,r.w)]=1;
    }
    return mask;
  }
  function candidateMasks(r,opts){
    const requested=opts.foreground==='dark'||opts.foreground==='light'?opts.foreground:null;
    const auto=Math.round((r.avg+r.borderLum)/2),base=[r.otsu,auto,r.otsu-55,r.otsu+55,r.otsu-35,r.otsu+35,r.otsu-18,r.otsu+18].map(v=>clamp(Math.round(v),18,238));
    const unique=[...new Set(base)],list=[];
    const fore=requested?[requested]:['dark','light'];
    for(const f of fore)for(const t of unique)list.push({method:`${f} threshold ${t}`,mask:thresholdMask(r.gray,t,f),threshold:t,foreground:f});
    for(const t of [12,18,28,40,55,75,95,120])list.push({method:`background separation ${t}`,mask:borderDifferenceMask(r,t),threshold:t,foreground:'background-separated'});
    for(const t of [16,24,32,44])list.push({method:`local contrast ${t}`,mask:localContrastMask(r,t),threshold:t,foreground:'local-contrast'});
    return list;
  }
  function loopsFromConnectedMask(mask,w,h,detail){
    const rawLoops=stitchEdges(boundaryEdges(mask,w,h));
    const loops=simplifyLoops(rawLoops,detail==='high'?0.5:detail==='low'?2.1:1.0,detail==='high'?2:detail==='low'?20:6);
    if(!loops.length)return [];
    const outerArea=Math.abs(polygonArea(loops[0]));if(outerArea<8)return [];
    const retained=[loops[0]];for(const l of loops.slice(1)){const a=Math.abs(polygonArea(l));if(a>outerArea*0.00045)retained.push(l);}
    return retained;
  }
  function borderRatio(mask,w,h){let hits=0;for(let x=0;x<w;x++){if(mask[idx(x,0,w)])hits++;if(mask[idx(x,h-1,w)])hits++;}for(let y=1;y<h-1;y++){if(mask[idx(0,y,w)])hits++;if(mask[idx(w-1,y,w)])hits++;}return hits/Math.max(1,2*w+2*h-4);}
  function evaluateCandidate(c,r,detail){
    const variants=[
      {name:'raw',mask:c.mask},
      {name:'bold-1',mask:dilate(c.mask,r.w,r.h,1)},
      {name:'bold-2',mask:dilate(c.mask,r.w,r.h,2)},
      {name:'bold-3',mask:dilate(c.mask,r.w,r.h,3)},
      {name:'closed',mask:closeMask(c.mask,r.w,r.h,1)},
      {name:'closed-2',mask:closeMask(c.mask,r.w,r.h,2)},
      {name:'closed-4',mask:closeMask(c.mask,r.w,r.h,4)}
    ];
    if(detail!=='high')variants.push({name:'cleaned',mask:despeckle(closeMask(c.mask,r.w,r.h,1),r.w,r.h,1)});
    let best=null;
    for(const v of variants){
      const largest=connectedLargest(v.mask,r.w,r.h),fraction=largest.size/(r.w*r.h);
      if(largest.size<Math.max(18,Math.floor(r.w*r.h*0.00008))||fraction>0.95)continue;
      const loops=loopsFromConnectedMask(largest.mask,r.w,r.h,detail);if(!loops.length)continue;
      const br=borderRatio(largest.mask,r.w,r.h),coverageScore=fraction<=0.68?fraction*100:68-(fraction-0.68)*135;
      const score=coverageScore+(Math.min(largest.size,70000)/70000*8)+(Math.min(loops.length,24)*0.12)-(br*75)-(fraction>0.90?30:0);
      const result={...c,method:`${c.method} / ${v.name}`,loops,fraction,score,bridges_added:0};if(!best||result.score>best.score)best=result;
    }
    return best;
  }
  function sampleBoundary(points,max=220){if(points.length<=max)return points;const step=Math.max(1,Math.floor(points.length/max)),out=[];for(let i=0;i<points.length;i+=step)out.push(points[i]);return out.slice(0,max);}
  function nearestPair(a,b){
    const aa=sampleBoundary(a,260),bb=sampleBoundary(b,180);let best=null,bestD=Infinity;
    for(const p of aa)for(const q of bb){const dx=p.x-q.x,dy=p.y-q.y,d=dx*dx+dy*dy;if(d<bestD){bestD=d;best=[p,q];}}
    return best?{a:best[0],b:best[1],distance:Math.sqrt(bestD)}:null;
  }
  function drawDisk(mask,w,h,cx,cy,r){for(let y=Math.floor(cy-r);y<=Math.ceil(cy+r);y++)for(let x=Math.floor(cx-r);x<=Math.ceil(cx+r);x++){if(x<0||y<0||x>=w||y>=h)continue;if((x-cx)*(x-cx)+(y-cy)*(y-cy)<=r*r)mask[idx(x,y,w)]=1;}}
  function drawBridge(mask,w,h,a,b,radius){
    const dx=b.x-a.x,dy=b.y-a.y,steps=Math.max(1,Math.ceil(Math.hypot(dx,dy)*1.4));
    for(let i=0;i<=steps;i++){const t=i/steps;drawDisk(mask,w,h,a.x+dx*t,a.y+dy*t,radius);}
  }
  function bridgeComponents(mask,w,h,detail){
    const minSize=Math.max(5,Math.floor(w*h*0.000015));let comps=componentList(mask,w,h,minSize,80);
    if(comps.length<2)return null;
    const totalForeground=comps.reduce((s,c)=>s+c.size,0),main=comps[0],out=new Uint8Array(mask.length);for(const p of main.pixels)out[p]=1;
    let anchorBoundary=main.boundary.slice(),bridges=0,kept=1,bridgeLength=0;
    const maxGap=Math.max(18,Math.min(Math.max(w,h)*0.20,150));const maxComp=Math.min(50,comps.length);
    for(let i=1;i<maxComp;i++){
      const comp=comps[i];
      if(comp.size<Math.max(minSize,totalForeground*0.0010))continue;
      const pair=nearestPair(anchorBoundary,comp.boundary);if(!pair||pair.distance>maxGap)continue;
      const radius=detail==='high'?1.2:detail==='low'?2.5:1.8;drawBridge(out,w,h,pair.a,pair.b,radius);for(const p of comp.pixels)out[p]=1;
      anchorBoundary=anchorBoundary.concat(sampleBoundary(comp.boundary,140));bridges++;kept++;bridgeLength+=pair.distance;
    }
    const largest=connectedLargest(out,w,h);const fraction=largest.size/(w*h);if(bridges<1||largest.size<main.size*1.08||fraction>0.95)return null;
    return {mask:largest.mask,bridges,kept,bridgeLength,fraction};
  }
  function rescueCandidate(c,r,detail){
    const bases=[
      {name:'raw multi-component',mask:c.mask},
      {name:'bold multi-component',mask:dilate(c.mask,r.w,r.h,1)},
      {name:'bold-2 multi-component',mask:dilate(c.mask,r.w,r.h,2)}
    ];
    let best=null;
    for(const base of bases){
      const joined=bridgeComponents(base.mask,r.w,r.h,detail);if(!joined)continue;
      const loops=loopsFromConnectedMask(joined.mask,r.w,r.h,detail);if(!loops.length)continue;
      const br=borderRatio(joined.mask,r.w,r.h);if(br>0.55)continue;
      const score=joined.fraction*100-Math.min(22,joined.bridges*0.8)-Math.min(18,joined.bridgeLength/Math.max(r.w,r.h)*8)-br*40;
      const result={...c,method:`${c.method} / ${base.name} / connectivity rescue`,loops,fraction:joined.fraction,score,bridges_added:joined.bridges,components_joined:joined.kept};
      if(!best||result.score>best.score)best=result;
    }
    return best;
  }
  function fitLoops(loops,targetW,targetH,machineW,machineH,margin=8){
    const b=bounds(loops);const maxW=Math.max(20,Math.min(Number(targetW)||Infinity,Number(machineW||642.62)-margin*2));const maxH=Math.max(20,Math.min(Number(targetH)||Infinity,Number(machineH||591.82)-margin*2));const s=Math.min(maxW/b.width,maxH/b.height);if(!Number.isFinite(s)||s<=0)throw new Error('The traced geometry could not be scaled to the requested size.');const result=loops.map(loop=>loop.map(p=>({x:(p.x-b.minX)*s,y:(b.maxY-p.y)*s})));const rb=bounds(result);return {loops:result,width:rb.width,height:rb.height,scale:s};
  }
  function dxfPolylineR12(loop){
    const lines=['0','POLYLINE','8','0','66','1','70','1'];
    for(const p of loop)lines.push('0','VERTEX','8','0','10',p.x.toFixed(4),'20',p.y.toFixed(4),'30','0');
    lines.push('0','SEQEND','8','0');return lines.join('\n');
  }
  function makeDxf(loops){return `0\nSECTION\n2\nHEADER\n9\n$ACADVER\n1\nAC1009\n9\n$INSUNITS\n70\n4\n0\nENDSEC\n0\nSECTION\n2\nENTITIES\n${loops.map(dxfPolylineR12).join('\n')}\n0\nENDSEC\n0\nEOF\n`;}
  async function convert(file,opts={}){
    const r=await raster(file,opts),candidates=candidateMasks(r,opts),mode=opts.mode||'auto';let best=null;
    if(mode!=='lineart'){for(const c of candidates){const e=evaluateCandidate(c,r,opts.detail||'medium');if(e&&(!best||e.score>best.score))best=e;}}
    let rescueUsed=false;
    if(mode==='lineart'||(mode==='auto'&&(!best||!best.loops?.length||best.fraction<0.001))){
      let rescued=null;
      for(const c of candidates){const e=rescueCandidate(c,r,opts.detail||'medium');if(e&&(!rescued||e.score>rescued.score))rescued=e;}
      if(rescued){best=rescued;rescueUsed=true;}
    }
    if(!best||!best.loops?.length)throw new Error('MERLIN could not isolate enough usable geometry from this image. Try Image type = Line drawing / separated details, then Dark or Light foreground if needed. A very busy photo may still need a tighter crop.');
    const fitted=fitLoops(best.loops,opts.targetWidth,opts.targetHeight,opts.machineWidth,opts.machineHeight,Number(opts.margin||0));
    return {dxf:makeDxf(fitted.loops),width_mm:fitted.width,height_mm:fitted.height,loops:fitted.loops.length,threshold:best.threshold,foreground:best.foreground,method:best.method,subject_fraction:best.fraction,file_format:'AutoCAD R12 ASCII (AC1009)',bridges_added:Number(best.bridges_added||0),components_joined:Number(best.components_joined||1),rescue_used:rescueUsed||Number(best.bridges_added||0)>0};
  }
  window.MERLIN_IMAGE_DXF={convert};
})();
