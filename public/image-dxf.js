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
    // Boundary edges are directed with retained pixels on their right. At a
    // junction (common after bridge insertion), blindly taking the first edge
    // can jump onto the wrong contour. Prefer a right turn, then straight,
    // then left, which keeps the same retained region on the right-hand side.
    const byStart=new Map(),key=(x,y)=>x+','+y;
    for(let i=0;i<edges.length;i++){
      const e=edges[i],k=key(e.x1,e.y1);
      if(!byStart.has(k))byStart.set(k,[]);
      byStart.get(k).push(i);
    }
    const used=new Uint8Array(edges.length),loops=[];
    const direction=e=>e.x2>e.x1?0:e.y2>e.y1?1:e.x2<e.x1?2:3; // E,S,W,N
    const turnRank=(prev,next)=>{const turn=(next-prev+4)%4;return turn===1?0:turn===0?1:turn===3?2:3;};
    for(let seed=0;seed<edges.length;seed++){
      if(used[seed])continue;
      const start=edges[seed],sx=start.x1,sy=start.y1,loop=[];
      let ei=seed,prevDir=direction(start),guard=0,closed=false;
      while(ei!=null&&!used[ei]&&guard++<edges.length+20){
        const e=edges[ei];used[ei]=1;loop.push({x:e.x1,y:e.y1});
        if(e.x2===sx&&e.y2===sy){loop.push({x:sx,y:sy});closed=true;break;}
        const available=(byStart.get(key(e.x2,e.y2))||[]).filter(j=>!used[j]);
        if(!available.length){ei=null;break;}
        available.sort((a,b)=>turnRank(prevDir,direction(edges[a]))-turnRank(prevDir,direction(edges[b])));
        ei=available[0];prevDir=direction(edges[ei]);
      }
      if(closed&&loop.length>=5)loops.push(loop);
    }
    return loops;
  }
  function simplifyClosedLoop(points,tolerance){
    // RDP cannot be run on [p0...p0] directly: identical endpoints make the
    // baseline zero-length and collapse a valid closed polygon to two points.
    // Pick two far-apart anchors, simplify the two open arcs independently,
    // then join them back into a closed polygon.
    if(points.length<4)return points.slice();
    const farthestFrom=start=>{
      let best=0,bestD=-1;const a=points[start];
      for(let i=0;i<points.length;i++){
        const dx=points[i].x-a.x,dy=points[i].y-a.y,d=dx*dx+dy*dy;
        if(d>bestD){bestD=d;best=i;}
      }
      return best;
    };
    const a=farthestFrom(0),b=farthestFrom(a);
    if(a===b)return points.slice();
    const arc=(from,to)=>{
      const out=[points[from]];let i=from,guard=0;
      while(i!==to&&guard++<=points.length){i=(i+1)%points.length;out.push(points[i]);}
      return out;
    };
    const one=rdp(arc(a,b),tolerance),two=rdp(arc(b,a),tolerance);
    const joined=one.slice(0,-1).concat(two.slice(0,-1));
    const clean=[];
    for(const p of joined){const q=clean[clean.length-1];if(!q||p.x!==q.x||p.y!==q.y)clean.push(p);}
    return clean;
  }
  function simplifyLoops(loops,tolerance,minArea){
    const out=[];
    for(const loop of loops){
      const closed=loop.slice();
      if(closed.length>1&&closed[0].x===closed[closed.length-1].x&&closed[0].y===closed[closed.length-1].y)closed.pop();
      if(closed.length<4)continue;
      const simple=simplifyClosedLoop(closed,tolerance);
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

  function highContrastFraction(r){
    let extreme=0,dark=0,light=0;
    for(const g of r.gray){if(g<64){dark++;extreme++;}else if(g>192){light++;extreme++;}}
    return {fraction:extreme/r.gray.length,dark:dark/r.gray.length,light:light/r.gray.length};
  }
  function centerOfComponent(c){return {x:(c.minX+c.maxX)/2,y:(c.minY+c.maxY)/2};}
  function componentUnionBounds(comps){
    let minX=Infinity,minY=Infinity,maxX=-Infinity,maxY=-Infinity;
    for(const c of comps){minX=Math.min(minX,c.minX);minY=Math.min(minY,c.minY);maxX=Math.max(maxX,c.maxX);maxY=Math.max(maxY,c.maxY);}
    return {minX,minY,maxX,maxY};
  }
  function highContrastStencilCandidate(r,opts,detail){
    const contrast=highContrastFraction(r);if(contrast.fraction<0.90)return null;
    const requested=opts.foreground==='dark'||opts.foreground==='light'?opts.foreground:null;
    const foreground=requested||(r.borderLum<128?'light':'dark');
    let mask=thresholdMask(r.gray,r.otsu,foreground);
    const minPixels=Math.max(4,Math.floor(r.w*r.h*0.000006));
    const comps=componentList(mask,r.w,r.h,minPixels,180);if(!comps.length)return null;
    const largest=comps[0],imageArea=r.w*r.h;
    const coreMin=Math.max(imageArea*0.015,largest.size*0.12);
    const core=comps.filter(c=>c.size>=coreMin);if(!core.length)core.push(largest);
    const cb=componentUnionBounds(core),ex=r.w*0.02,ey=r.h*0.02;
    const minKeep=Math.max(24,imageArea*0.00035,largest.size*0.0025);
    const kept=comps.filter(c=>{
      if(c.size<minKeep)return false;const cc=centerOfComponent(c);
      return cc.x>=cb.minX-ex&&cc.x<=cb.maxX+ex&&cc.y>=cb.minY-ey&&cc.y<=cb.maxY+ey;
    }).slice(0,42);
    if(!kept.length)return null;
    const out=new Uint8Array(mask.length);for(const c of kept)for(const pi of c.pixels)out[pi]=1;
    let bridges=0,maxBridge=0;
    if(kept.length>1){
      const edges=[];
      for(let i=0;i<kept.length;i++)for(let j=i+1;j<kept.length;j++){
        const pair=nearestPair(kept[i].boundary,kept[j].boundary);if(pair)edges.push({i,j,...pair});
      }
      edges.sort((a,b)=>a.distance-b.distance);
      const parent=kept.map((_,i)=>i),find=i=>{let x=i;while(parent[x]!==x){parent[x]=parent[parent[x]];x=parent[x];}return x;};
      const maxGap=Math.max(24,Math.min(Math.max(r.w,r.h)*0.10,95));
      const radius=detail==='high'?2.5:detail==='low'?4.5:3.5;
      for(const e of edges){const ra=find(e.i),rb=find(e.j);if(ra===rb)continue;if(e.distance>maxGap)continue;parent[rb]=ra;drawBridge(out,r.w,r.h,e.a,e.b,radius);bridges++;maxBridge=Math.max(maxBridge,e.distance);if(bridges===kept.length-1)break;}
      const root=find(0);if(kept.some((_,i)=>find(i)!==root))return null;
    }
    const largestConnected=connectedLargest(out,r.w,r.h),fraction=largestConnected.size/imageArea;
    if(largestConnected.size<Math.max(40,imageArea*0.01)||fraction>0.90)return null;
    const loops=loopsFromConnectedMask(largestConnected.mask,r.w,r.h,detail);if(!loops.length)return null;
    return {method:`high-contrast ${foreground} stencil / structural merge`,mask:largestConnected.mask,loops,fraction,score:1000+fraction*100,threshold:r.otsu,foreground,bridges_added:bridges,components_joined:kept.length,high_contrast:true,max_bridge_px:maxBridge,contrast_fraction:contrast.fraction};
  }
  function loopsFromConnectedMask(mask,w,h,detail){
    const rawLoops=stitchEdges(boundaryEdges(mask,w,h));
    const pixelArea=w*h;
    const minArea=detail==='high'?Math.max(5,pixelArea*0.000015):detail==='low'?Math.max(100,pixelArea*0.00018):Math.max(35,pixelArea*0.00007);
    const loops=simplifyLoops(rawLoops,detail==='high'?0.5:detail==='low'?2.1:1.0,minArea);
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
      const result={...c,mask:largest.mask,method:`${c.method} / ${v.name}`,loops,fraction,score,bridges_added:0};if(!best||result.score>best.score)best=result;
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
      const result={...c,mask:joined.mask,method:`${c.method} / ${base.name} / connectivity rescue`,loops,fraction:joined.fraction,score,bridges_added:joined.bridges,components_joined:joined.kept};
      if(!best||result.score>best.score)best=result;
    }
    return best;
  }
  function photoStencilCandidate(r,opts,detail){
    const requested=opts.foreground==='dark'||opts.foreground==='light'?opts.foreground:null;
    const foreground=requested||(r.borderLum<=r.avg?'dark':'light');
    const thresholds=[r.otsu,clamp(Math.round((r.otsu+r.avg)/2),25,230),clamp(r.otsu+(foreground==='dark'?18:-18),25,230)];
    let best=null;
    for(const t of thresholds){
      let mask=thresholdMask(r.gray,t,foreground);
      const minKeep=Math.max(18,Math.floor(r.w*r.h*(detail==='high'?0.00006:detail==='low'?0.00035:0.00016)));
      mask=removeSmallIslandsMask(mask,r.w,r.h,minKeep);
      if(detail!=='high')mask=closeMask(mask,r.w,r.h,1);
      const framePx=Math.max(3,Math.round(Math.min(r.w,r.h)*0.012));
      mask=addFrameMask(mask,r.w,r.h,framePx);
      let bridges=0;
      const comps=componentList(mask,r.w,r.h,4,160);
      if(comps.length>1){try{const joined=autoConnectMask(mask,r.w,r.h,detail);mask=joined.mask;bridges=joined.bridges;}catch{continue;}}
      const largest=connectedLargest(mask,r.w,r.h),fraction=largest.size/(r.w*r.h);
      if(fraction<0.04||fraction>0.82)continue;
      const loops=loopsFromConnectedMask(largest.mask,r.w,r.h,detail);if(!loops.length)continue;
      const score=180-Math.abs(fraction-0.34)*140-Math.min(35,loops.length*.4)-bridges*.35;
      const cand={mask:largest.mask,loops,method:`photo stencil ${foreground} / threshold ${t} / connected frame`,foreground,threshold:t,fraction,score,bridges_added:bridges,components_joined:Math.max(1,comps.length),photo_stencil:true};
      if(!best||cand.score>best.score)best=cand;
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
  async function prepare(file,opts={}){
    const r=await raster(file,opts),candidates=candidateMasks(r,opts),mode=opts.mode||'auto',detail=opts.detail||'medium';let best=null;
    if(mode==='stencil'||mode==='auto'){const stencil=highContrastStencilCandidate(r,opts,detail);if(stencil)best=stencil;}
    if(!best&&(mode==='photo'||mode==='auto')){const photo=photoStencilCandidate(r,opts,detail);if(photo)best=photo;}
    if(!best&&mode!=='lineart'&&mode!=='photo'){for(const c of candidates){const e=evaluateCandidate(c,r,detail);if(e&&(!best||e.score>best.score))best=e;}}
    let rescueUsed=Boolean(best?.high_contrast);
    if(!best&&(mode==='lineart'||mode==='auto')){let rescued=null;for(const c of candidates){const e=rescueCandidate(c,r,detail);if(e&&(!rescued||e.score>rescued.score))rescued=e;}if(rescued){best=rescued;rescueUsed=true;}}
    if(!best||!best.mask){
      const foreground=opts.foreground==='dark'||opts.foreground==='light'?opts.foreground:(r.borderLum<=r.avg?'dark':'light');
      let mask=thresholdMask(r.gray,r.otsu,foreground);
      const on=mask.reduce((a,v)=>a+v,0);
      if(on<8||on>mask.length-8)mask=thresholdMask(r.gray,r.otsu,foreground==='dark'?'light':'dark');
      best={mask,method:`editable fallback ${foreground} / Otsu ${r.otsu}`,foreground,threshold:r.otsu,bridges_added:0,components_joined:componentList(mask,r.w,r.h,3,500).length||1};
    }
    return {w:r.w,h:r.h,rgba:new Uint8ClampedArray(r.rgba),gray:new Float32Array(r.gray),mask:new Uint8Array(best.mask),originalMask:new Uint8Array(best.mask),method:best.method,foreground:best.foreground,threshold:best.threshold,detail,rescue_used:rescueUsed||Number(best.bridges_added||0)>0,bridges_added:Number(best.bridges_added||0),components_joined:Number(best.components_joined||1),source_name:file.name||'image'};
  }
  function componentCount(mask,w,h,minPixels=2){return componentList(mask,w,h,minPixels,500).length;}
  function invertMask(mask){const out=new Uint8Array(mask.length);for(let i=0;i<mask.length;i++)out[i]=mask[i]?0:1;return out;}
  function keepLargestMask(mask,w,h){return connectedLargest(mask,w,h).mask;}
  function removeSmallIslandsMask(mask,w,h,minPixels){const comps=componentList(mask,w,h,1,1000),out=new Uint8Array(mask.length);for(const c of comps)if(c.size>=minPixels)for(const pi of c.pixels)out[pi]=1;return out;}
  function autoConnectMask(mask,w,h,detail='medium'){const comps=componentList(mask,w,h,4,100);if(comps.length<=1)return {mask:new Uint8Array(mask),bridges:0};const joined=bridgeComponents(mask,w,h,detail);if(!joined)throw new Error('MERLIN could not safely auto-connect all retained-steel islands. Paint a bridge manually or remove the unwanted islands.');return {mask:joined.mask,bridges:joined.bridges};}
  function addFrameMask(mask,w,h,thicknessPx=8){const out=new Uint8Array(mask);const t=Math.max(1,Math.round(thicknessPx));for(let y=0;y<h;y++)for(let x=0;x<w;x++)if(x<t||y<t||x>=w-t||y>=h-t)out[idx(x,y,w)]=1;return out;}
  function maskBounds(mask,w,h){let minX=Infinity,minY=Infinity,maxX=-Infinity,maxY=-Infinity,count=0;for(let y=0;y<h;y++)for(let x=0;x<w;x++)if(mask[idx(x,y,w)]){minX=Math.min(minX,x);minY=Math.min(minY,y);maxX=Math.max(maxX,x);maxY=Math.max(maxY,y);count++;}return count?{minX,minY,maxX,maxY,width:maxX-minX+1,height:maxY-minY+1}:null;}
  function diskFullyMetal(mask,w,h,cx,cy,r){for(let y=Math.floor(cy-r);y<=Math.ceil(cy+r);y++)for(let x=Math.floor(cx-r);x<=Math.ceil(cx+r);x++){if(x<0||y<0||x>=w||y>=h)return false;if((x-cx)*(x-cx)+(y-cy)*(y-cy)<=r*r&&!mask[idx(x,y,w)])return false;}return true;}
  function addMountingHolesMask(mask,w,h,{count=2,holeRadiusPx=4,clearancePx=3,insetPx=14}={}){
    const out=new Uint8Array(mask),safeR=holeRadiusPx+clearancePx,b=maskBounds(mask,w,h);if(!b)throw new Error('No retained steel exists for mounting holes.');
    const targets=count===4?[[b.minX+insetPx,b.minY+insetPx],[b.maxX-insetPx,b.minY+insetPx],[b.minX+insetPx,b.maxY-insetPx],[b.maxX-insetPx,b.maxY-insetPx]]:[[b.minX+insetPx,b.minY+insetPx],[b.maxX-insetPx,b.minY+insetPx]];
    const placed=[];
    for(const [tx,ty] of targets){let best=null,bestD=Infinity;const maxSearch=Math.max(w,h);for(let rad=0;rad<=maxSearch&&!best;rad+=3){for(let a=0;a<Math.PI*2;a+=Math.PI/12){const x=Math.round(tx+Math.cos(a)*rad),y=Math.round(ty+Math.sin(a)*rad);if(x<safeR||y<safeR||x>=w-safeR||y>=h-safeR)continue;if(diskFullyMetal(out,w,h,x,y,safeR)){const d=(x-tx)*(x-tx)+(y-ty)*(y-ty);if(d<bestD){best={x,y};bestD=d;}}}}if(!best)throw new Error(`Could not place all ${count} mounting holes inside retained steel.`);drawDisk(out,w,h,best.x,best.y,holeRadiusPx);for(let y=Math.floor(best.y-holeRadiusPx);y<=Math.ceil(best.y+holeRadiusPx);y++)for(let x=Math.floor(best.x-holeRadiusPx);x<=Math.ceil(best.x+holeRadiusPx);x++)if(x>=0&&y>=0&&x<w&&y<h&&(x-best.x)*(x-best.x)+(y-best.y)*(y-best.y)<=holeRadiusPx*holeRadiusPx)out[idx(x,y,w)]=0;placed.push(best);}
    return {mask:out,placed};
  }
  function finalize(state,opts={}){
    const detail=opts.detail||state.detail||'medium',comps=componentList(state.mask,state.w,state.h,3,500);
    if(!comps.length)throw new Error('There is no retained steel in the editor.');
    if(comps.length>1)throw new Error(`CUT-READY BLOCKED: retained steel has ${comps.length} disconnected pieces. Use Auto-connect steel, paint bridges, or remove islands before creating the DXF.`);
    const loops=loopsFromConnectedMask(state.mask,state.w,state.h,detail);if(!loops.length)throw new Error('No closed CNC contours could be produced from the edited metal mask.');
    const fitted=fitLoops(loops,opts.targetWidth,opts.targetHeight,opts.machineWidth,opts.machineHeight,Number(opts.margin||0));
    return {dxf:makeDxf(fitted.loops),width_mm:fitted.width,height_mm:fitted.height,loops:fitted.loops.length,file_format:'AutoCAD R12 ASCII (AC1009)',method:state.method,component_count:1};
  }
  async function convert(file,opts={}){const state=await prepare(file,opts);return finalize(state,opts);}
  function selfTestGeometry(){
    // Pure geometry regression: two retained regions joined by a bridge plus
    // one enclosed cut-out. This catches the exact V9.0 failure where valid
    // closed contours were found and then collapsed during simplification.
    const w=64,h=48,mask=new Uint8Array(w*h);
    for(let y=6;y<=38;y++)for(let x=5;x<=26;x++)mask[idx(x,y,w)]=1;
    for(let y=10;y<=34;y++)for(let x=34;x<=56;x++)mask[idx(x,y,w)]=1;
    drawBridge(mask,w,h,{x:26,y:22},{x:34,y:22},2.5);
    for(let y=16;y<=24;y++)for(let x=12;x<=19;x++)mask[idx(x,y,w)]=0;
    const loops=loopsFromConnectedMask(mask,w,h,'medium');
    if(loops.length<2)throw new Error(`Image-DXF geometry self-test failed: expected outer contour and cut-out, got ${loops.length}.`);
    if(loops.some(loop=>loop.length<3))throw new Error('Image-DXF geometry self-test failed: degenerate contour.');
    return {ok:true,loops:loops.length};
  }
  window.MERLIN_IMAGE_DXF={convert,prepare,finalize,selfTest:selfTestGeometry,componentCount,invertMask,keepLargestMask,removeSmallIslandsMask,autoConnectMask,addFrameMask,addMountingHolesMask,dilate,erode};
})();
