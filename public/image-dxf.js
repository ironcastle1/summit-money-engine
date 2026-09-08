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
  function chaikinClosed(loop,iterations=1){
    let pts=loop.slice();
    for(let it=0;it<iterations;it++){
      if(pts.length<3)break;
      const out=[];
      for(let i=0;i<pts.length;i++){
        const a=pts[i],b=pts[(i+1)%pts.length];
        out.push({x:a.x*0.75+b.x*0.25,y:a.y*0.75+b.y*0.25});
        out.push({x:a.x*0.25+b.x*0.75,y:a.y*0.25+b.y*0.75});
      }
      pts=out;
    }
    return pts;
  }
  function smoothingSpec(level='medium',detail='medium'){
    if(level==='none')return {iterations:0,tolerance:detail==='high'?0.45:detail==='low'?1.8:0.9};
    if(level==='light')return {iterations:1,tolerance:detail==='high'?0.35:detail==='low'?1.35:0.7};
    if(level==='strong')return {iterations:3,tolerance:detail==='high'?0.28:detail==='low'?0.95:0.48};
    return {iterations:2,tolerance:detail==='high'?0.30:detail==='low'?1.10:0.55};
  }
  function smoothMaskEdges(mask,w,h,passes=1){
    let cur=new Uint8Array(mask);
    for(let pass=0;pass<passes;pass++){
      const out=new Uint8Array(cur);
      for(let y=1;y<h-1;y++)for(let x=1;x<w-1;x++){
        const at=idx(x,y,w);let n=0;
        for(let yy=-1;yy<=1;yy++)for(let xx=-1;xx<=1;xx++)n+=cur[idx(x+xx,y+yy,w)]?1:0;
        if(cur[at])out[at]=n>=4?1:0;
        else out[at]=n>=6?1:0;
      }
      cur=out;
    }
    return cur;
  }
  function simplifyLoops(loops,tolerance,minArea,smoothing='medium',detail='medium'){
    const out=[],spec=smoothingSpec(smoothing,detail);
    for(const loop of loops){
      const closed=loop.slice();
      if(closed.length>1&&closed[0].x===closed[closed.length-1].x&&closed[0].y===closed[closed.length-1].y)closed.pop();
      if(closed.length<4)continue;
      const rounded=spec.iterations?chaikinClosed(closed,spec.iterations):closed;
      const simple=simplifyClosedLoop(rounded,Math.max(0.15,Number(tolerance||spec.tolerance)));
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
  function loopsFromConnectedMask(mask,w,h,detail,smoothing='light'){
    const rawLoops=stitchEdges(boundaryEdges(mask,w,h));
    const pixelArea=w*h;
    const minArea=detail==='high'?Math.max(5,pixelArea*0.000015):detail==='low'?Math.max(100,pixelArea*0.00018):Math.max(35,pixelArea*0.00007);
    const spec=smoothingSpec(smoothing,detail);
    const loops=simplifyLoops(rawLoops,spec.tolerance,minArea,smoothing,detail);
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
  function luminanceQuantiles(gray,levels=4){
    const hist=new Uint32Array(256);for(const g of gray)hist[clamp(Math.round(g),0,255)]++;
    const thresholds=[],total=gray.length;let cumulative=0,next=1;
    for(let i=0;i<256&&next<levels;i++){
      cumulative+=hist[i];
      while(next<levels&&cumulative>=total*(next/levels)){thresholds.push(i);next++;}
    }
    while(thresholds.length<levels-1)thresholds.push(Math.round(255*(thresholds.length+1)/levels));
    return thresholds;
  }
  function detectImageRegions(gray,w,h,{detail='medium',levels=null,maxRegions=320,rgba=null}={}){
    const toneLevels=levels|| (detail==='high'?5:detail==='low'?3:4),thresholds=luminanceQuantiles(gray,toneLevels),n=w*h;
    const bands=new Uint8Array(n),visited=new Uint8Array(n),labels=new Int32Array(n),queue=new Int32Array(n),all=[];
    for(let i=0;i<n;i++){let band=0;while(band<thresholds.length&&gray[i]>thresholds[band])band++;bands[i]=band;}
    const minPixels=detail==='high'?Math.max(8,Math.floor(n*0.000018)):detail==='low'?Math.max(90,Math.floor(n*0.00022)):Math.max(28,Math.floor(n*0.00007));
    const dirs=[1,-1,w,-w];
    for(let seed=0;seed<n;seed++){
      if(visited[seed])continue;const band=bands[seed];let head=0,tail=0;queue[tail++]=seed;visited[seed]=1;const pixels=[];let sum=0,minX=w,maxX=0,minY=h,maxY=0;
      while(head<tail){const pi=queue[head++],x=pi%w,y=Math.floor(pi/w);pixels.push(pi);sum+=gray[pi];minX=Math.min(minX,x);maxX=Math.max(maxX,x);minY=Math.min(minY,y);maxY=Math.max(maxY,y);
        if(x+1<w){const q=pi+1;if(!visited[q]&&bands[q]===band){visited[q]=1;queue[tail++]=q;}}
        if(x>0){const q=pi-1;if(!visited[q]&&bands[q]===band){visited[q]=1;queue[tail++]=q;}}
        if(y+1<h){const q=pi+w;if(!visited[q]&&bands[q]===band){visited[q]=1;queue[tail++]=q;}}
        if(y>0){const q=pi-w;if(!visited[q]&&bands[q]===band){visited[q]=1;queue[tail++]=q;}}
      }
      if(pixels.length>=minPixels){
        let sr=0,sg=0,sb=0;if(rgba){for(const pi of pixels){const si=pi*4;sr+=rgba[si];sg+=rgba[si+1];sb+=rgba[si+2];}}
        all.push({pixels,size:pixels.length,meanLum:sum/pixels.length,meanR:rgba?sr/pixels.length:sum/pixels.length,meanG:rgba?sg/pixels.length:sum/pixels.length,meanB:rgba?sb/pixels.length:sum/pixels.length,band,minX,maxX,minY,maxY});
      }
    }
    all.sort((a,b)=>b.size-a.size);const kept=all.slice(0,maxRegions),regions=[];
    for(let r=0;r<kept.length;r++){const id=r+1,c=kept[r];for(const pi of c.pixels)labels[pi]=id;regions.push({id,size:c.size,meanLum:c.meanLum,meanR:c.meanR,meanG:c.meanG,meanB:c.meanB,band:c.band,minX:c.minX,maxX:c.maxX,minY:c.minY,maxY:c.maxY});}
    let palette,colourLabels;
    if(rgba){
      const direct=buildPixelPalette(rgba,w,h,{maxColours:detail==='high'?16:detail==='low'?8:12,tolerance:detail==='high'?24:detail==='low'?44:32});palette=direct.palette;colourLabels=direct.colourLabels;
      for(const r of regions){let best=null,bd=Infinity;for(const c of palette){const d=Math.hypot(r.meanR-c.r,r.meanG-c.g,r.meanB-c.b);if(d<bd){bd=d;best=c;}}r.colour_id=best?.id||0;if(best&&!best.region_ids.includes(r.id))best.region_ids.push(r.id);}
    }else{palette=buildColourPalette(regions,{maxColours:detail==='high'?18:detail==='low'?8:12,tolerance:detail==='high'?30:detail==='low'?52:40});colourLabels=new Int16Array(n);for(let i=0;i<labels.length;i++){const rid=labels[i];if(rid)colourLabels[i]=regions[rid-1]?.colour_id||0;}}
    return {labels,regions,thresholds,levels:toneLevels,minPixels,palette,colourLabels};
  }
  function colourDistance(a,b){return Math.hypot(Number(a.meanR??a.r)-Number(b.meanR??b.r),Number(a.meanG??a.g)-Number(b.meanG??b.g),Number(a.meanB??a.b)-Number(b.meanB??b.b));}
  function rgbHex(r,g,b){const c=v=>clamp(Math.round(v),0,255).toString(16).padStart(2,'0');return `#${c(r)}${c(g)}${c(b)}`;}
  function buildPixelPalette(rgba,w,h,{maxColours=12,tolerance=34}={}){
    if(!rgba||!rgba.length)return {palette:[],colourLabels:new Int16Array(w*h)};
    const bins=new Map(),n=w*h,stride=Math.max(1,Math.floor(Math.sqrt(n/180000)));
    for(let i=0;i<n;i+=stride){
      const si=i*4,r=rgba[si],g=rgba[si+1],b=rgba[si+2];
      const key=((r>>4)<<8)|((g>>4)<<4)|(b>>4);
      let bin=bins.get(key);if(!bin){bin={count:0,r:0,g:0,b:0};bins.set(key,bin);}
      bin.count++;bin.r+=r;bin.g+=g;bin.b+=b;
    }
    const seeds=[...bins.values()].map(b=>({count:b.count,r:b.r/b.count,g:b.g/b.count,b:b.b/b.count})).sort((a,b)=>b.count-a.count).slice(0,96);
    const clusters=[];
    for(const seed of seeds){
      let best=null,bestD=Infinity;for(const c of clusters){const d=Math.hypot(seed.r-c.r,seed.g-c.g,seed.b-c.b);if(d<bestD){bestD=d;best=c;}}
      if(!best||bestD>tolerance){clusters.push({id:clusters.length+1,r:seed.r,g:seed.g,b:seed.b,count:seed.count});continue;}
      const total=best.count+seed.count;best.r=(best.r*best.count+seed.r*seed.count)/total;best.g=(best.g*best.count+seed.g*seed.count)/total;best.b=(best.b*best.count+seed.b*seed.count)/total;best.count=total;
    }
    while(clusters.length>maxColours){
      let ai=0,bi=1,bd=Infinity;for(let i=0;i<clusters.length;i++)for(let j=i+1;j<clusters.length;j++){const d=Math.hypot(clusters[i].r-clusters[j].r,clusters[i].g-clusters[j].g,clusters[i].b-clusters[j].b);if(d<bd){bd=d;ai=i;bi=j;}}
      const a=clusters[ai],b=clusters[bi],total=a.count+b.count;a.r=(a.r*a.count+b.r*b.count)/total;a.g=(a.g*a.count+b.g*b.count)/total;a.b=(a.b*a.count+b.b*b.count)/total;a.count=total;clusters.splice(bi,1);
    }
    clusters.sort((a,b)=>b.count-a.count);clusters.forEach((c,i)=>{c.id=i+1;c.hex=rgbHex(c.r,c.g,c.b);c.region_ids=[];c.pixel_count=0;c.pixel_percent=0;});
    const colourLabels=new Int16Array(n);
    for(let i=0;i<n;i++){const si=i*4,r=rgba[si],g=rgba[si+1],b=rgba[si+2];let best=clusters[0],bd=Infinity;for(const c of clusters){const d=(r-c.r)*(r-c.r)+(g-c.g)*(g-c.g)+(b-c.b)*(b-c.b);if(d<bd){bd=d;best=c;}}if(best){colourLabels[i]=best.id;best.pixel_count++;}}
    for(const c of clusters)c.pixel_percent=c.pixel_count/Math.max(1,n)*100;
    return {palette:clusters,colourLabels};
  }
  function buildColourPalette(regions,{maxColours=12,tolerance=40}={}){
    const clusters=[];
    for(const region of [...regions].sort((a,b)=>b.size-a.size)){
      let best=null,bestD=Infinity;
      for(const c of clusters){const d=colourDistance(region,c);if(d<bestD){bestD=d;best=c;}}
      if(!best||bestD>tolerance){best={id:clusters.length+1,r:region.meanR,g:region.meanG,b:region.meanB,size:0,region_ids:[]};clusters.push(best);}
      const old=best.size,total=old+region.size;best.r=(best.r*old+region.meanR*region.size)/Math.max(1,total);best.g=(best.g*old+region.meanG*region.size)/Math.max(1,total);best.b=(best.b*old+region.meanB*region.size)/Math.max(1,total);best.size=total;best.region_ids.push(region.id);
    }
    while(clusters.length>maxColours){
      let ai=0,bi=1,bd=Infinity;for(let i=0;i<clusters.length;i++)for(let j=i+1;j<clusters.length;j++){const d=colourDistance(clusters[i],clusters[j]);if(d<bd){bd=d;ai=i;bi=j;}}
      const a=clusters[ai],b=clusters[bi],total=a.size+b.size;a.r=(a.r*a.size+b.r*b.size)/total;a.g=(a.g*a.size+b.g*b.size)/total;a.b=(a.b*a.size+b.b*b.size)/total;a.size=total;a.region_ids.push(...b.region_ids);clusters.splice(bi,1);
    }
    clusters.sort((a,b)=>b.size-a.size);clusters.forEach((c,i)=>{c.id=i+1;c.hex=rgbHex(c.r,c.g,c.b);c.meanLum=.2126*c.r+.7152*c.g+.0722*c.b;});
    const byRegion={};for(const c of clusters)for(const id of c.region_ids)byRegion[id]=c.id;
    for(const r of regions)r.colour_id=byRegion[r.id]||0;
    return clusters;
  }
  function colourRegionIds(regionData,colourIds){const chosen=new Set(Array.from(colourIds||[],Number)),out=[];for(const r of regionData?.regions||[])if(chosen.has(Number(r.colour_id)))out.push(r.id);return out;}
  function setColourValues(mask,colourLabels,colourIds,value){const chosen=new Set(Array.from(colourIds||[],Number)),out=new Uint8Array(mask);if(!chosen.size)return out;for(let i=0;i<out.length;i++)if(chosen.has(Number(colourLabels?.[i]||0)))out[i]=value?1:0;return out;}
  function colourAt(colourLabels,w,h,x,y){x=clamp(Math.round(x),0,w-1);y=clamp(Math.round(y),0,h-1);return Number(colourLabels?.[idx(x,y,w)]||0);}
  function snapMaskToRegions(mask,regionData){
    const out=new Uint8Array(mask),metal=new Uint32Array(regionData.regions.length+1),total=new Uint32Array(regionData.regions.length+1);
    for(let i=0;i<regionData.labels.length;i++){const id=regionData.labels[i];if(!id)continue;total[id]++;if(mask[i])metal[id]++;}
    const assignments={};
    for(const region of regionData.regions){const value=metal[region.id]/Math.max(1,total[region.id])>=0.5?1:0;assignments[region.id]=value?'metal':'cutout';}
    for(let i=0;i<regionData.labels.length;i++){const id=regionData.labels[i];if(id)out[i]=assignments[id]==='metal'?1:0;}
    return {mask:out,assignments};
  }
  function setRegionValues(mask,labels,regionIds,value){
    const chosen=new Set(Array.from(regionIds||[],Number)),out=new Uint8Array(mask);if(!chosen.size)return out;
    for(let i=0;i<labels.length;i++)if(chosen.has(labels[i]))out[i]=value?1:0;return out;
  }
  function regionAt(labels,w,h,x,y,searchRadius=7){
    x=clamp(Math.round(x),0,w-1);y=clamp(Math.round(y),0,h-1);let id=labels[idx(x,y,w)];if(id)return id;
    for(let r=1;r<=searchRadius;r++)for(let yy=Math.max(0,y-r);yy<=Math.min(h-1,y+r);yy++)for(let xx=Math.max(0,x-r);xx<=Math.min(w-1,x+r);xx++){if(Math.abs(xx-x)!==r&&Math.abs(yy-y)!==r)continue;id=labels[idx(xx,yy,w)];if(id)return id;}
    return 0;
  }
  function similarRegionIds(regionData,regionId,tolerance=18){const base=regionData.regions.find(r=>r.id===Number(regionId));if(!base)return[];return regionData.regions.filter(r=>Math.abs(r.meanLum-base.meanLum)<=tolerance&&Math.abs(r.band-base.band)<=1).map(r=>r.id);}
  function bboxDistance(a,b){
    const dx=a.maxX<b.minX?b.minX-a.maxX:b.maxX<a.minX?a.minX-b.maxX:0;
    const dy=a.maxY<b.minY?b.minY-a.maxY:b.maxY<a.minY?a.minY-b.maxY:0;
    return Math.hypot(dx,dy);
  }
  function autoBuildViableNetwork(mask,w,h,detail='medium'){
    const area=w*h,minPixels=Math.max(5,Math.floor(area*0.000012));
    const all=componentList(mask,w,h,minPixels,180);
    if(!all.length)return {mask:new Uint8Array(mask.length),bridges:0,kept_components:0,dropped_components:0,source_components:0,max_gap_px:0};
    const largest=all[0],minKeep=Math.max(minPixels,Math.floor(largest.size*0.0012),Math.floor(area*0.000018));
    const comps=all.filter(c=>c.size>=minKeep).slice(0,120);
    if(comps.length===1){const out=new Uint8Array(mask.length);for(const pi of comps[0].pixels)out[pi]=1;return {mask:out,bridges:0,kept_components:1,dropped_components:all.length-1,source_components:all.length,max_gap_px:0};}
    const maxDim=Math.max(w,h),maxGap=Math.max(14,Math.min(detail==='high'?maxDim*0.045:detail==='low'?maxDim*0.085:maxDim*0.065,95));
    const edges=[];
    for(let i=0;i<comps.length;i++)for(let j=i+1;j<comps.length;j++){
      if(bboxDistance(comps[i],comps[j])>maxGap*1.35)continue;
      const pair=nearestPair(comps[i].boundary,comps[j].boundary);if(pair&&pair.distance<=maxGap)edges.push({i,j,...pair});
    }
    const parent=comps.map((_,i)=>i),find=i=>{let x=i;while(parent[x]!==x){parent[x]=parent[parent[x]];x=parent[x];}return x;},join=(a,b)=>{a=find(a);b=find(b);if(a!==b)parent[b]=a;};
    for(const e of edges)join(e.i,e.j);
    const groups=new Map();for(let i=0;i<comps.length;i++){const r=find(i);if(!groups.has(r))groups.set(r,[]);groups.get(r).push(i);}
    let keepIds=[0],bestWeight=-1;
    for(const ids of groups.values()){
      const weight=ids.reduce((sum,i)=>sum+comps[i].size,0)*(1+Math.min(ids.length,25)*0.012);
      if(weight>bestWeight){bestWeight=weight;keepIds=ids;}
    }
    const keepSet=new Set(keepIds),out=new Uint8Array(mask.length);for(const ci of keepIds)for(const pi of comps[ci].pixels)out[pi]=1;
    const candidateEdges=edges.filter(e=>keepSet.has(e.i)&&keepSet.has(e.j)).sort((a,b)=>a.distance-b.distance);
    const p2=comps.map((_,i)=>i),f2=i=>{let x=i;while(p2[x]!==x){p2[x]=p2[p2[x]];x=p2[x];}return x;};
    const radius=detail==='high'?1.35:detail==='low'?2.8:2.0;let bridges=0,totalBridge=0;
    for(const e of candidateEdges){let a=f2(e.i),b=f2(e.j);if(a===b)continue;p2[b]=a;drawBridge(out,w,h,e.a,e.b,radius);bridges++;totalBridge+=e.distance;}
    const connected=connectedLargest(out,w,h).mask;
    return {mask:connected,bridges,bridge_length_px:totalBridge,kept_components:keepIds.length,dropped_components:Math.max(0,all.length-keepIds.length),source_components:all.length,max_gap_px:maxGap};
  }
  function regionToneMask(state,regionData,foreground){
    const out=new Uint8Array(state.mask.length),threshold=Number.isFinite(Number(state.threshold))?Number(state.threshold):128;
    const metal=new Uint32Array(regionData.regions.length+1),total=new Uint32Array(regionData.regions.length+1);
    for(let i=0;i<regionData.labels.length;i++){const id=regionData.labels[i];if(!id)continue;total[id]++;if(state.mask[i])metal[id]++;}
    const assignments={};
    for(const r of regionData.regions){
      const overlap=metal[r.id]/Math.max(1,total[r.id]);
      let value=foreground==='dark'?r.meanLum<=threshold+10:r.meanLum>=threshold-10;
      if(overlap>=0.72)value=true;
      if(overlap<=0.04&&Math.abs(r.meanLum-threshold)<7)value=false;
      assignments[r.id]=value?1:0;
    }
    for(let i=0;i<regionData.labels.length;i++){const id=regionData.labels[i];if(id)out[i]=assignments[id]||0;}
    return out;
  }
  function scoreAutoNetwork(result,w,h){
    const on=result.mask.reduce((a,v)=>a+v,0),coverage=on/(w*h),border=borderRatio(result.mask,w,h);
    if(coverage<0.025||coverage>0.82)return -Infinity;
    return 180-Math.abs(coverage-0.34)*170-border*95+Math.min(result.kept_components,35)*0.7-Math.min(result.bridges,60)*0.28-Math.min(result.dropped_components,100)*0.025;
  }
  function autoInterpretWholeImage(state,regionData,{detail='medium'}={}){
    const requested=state.foreground==='dark'||state.foreground==='light'?state.foreground:null;
    const choices=requested?[requested]:['dark','light'];let best=null;
    for(const fg of choices){
      const regionMask=regionToneMask(state,regionData,fg),network=autoBuildViableNetwork(regionMask,state.w,state.h,detail),score=scoreAutoNetwork(network,state.w,state.h);
      if(Number.isFinite(score)&&(!best||score>best.score))best={...network,score,foreground:fg};
    }
    if(!best){
      const snapped=snapMaskToRegions(state.mask,regionData).mask,network=autoBuildViableNetwork(snapped,state.w,state.h,detail);best={...network,score:scoreAutoNetwork(network,state.w,state.h),foreground:state.foreground||'auto'};
    }
    return best;
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
  function fillRect(mask,w,h,x0,y0,x1,y1,value=1){for(let y=Math.max(0,Math.floor(y0));y<=Math.min(h-1,Math.ceil(y1));y++)for(let x=Math.max(0,Math.floor(x0));x<=Math.min(w-1,Math.ceil(x1));x++)mask[idx(x,y,w)]=value?1:0;}
  function addFrameMountingHolesMask(mask,w,h,{count=4,holeRadiusPx=4,clearancePx=3,insetPx=14,frameThicknessPx=8}={}){
    const out=new Uint8Array(mask),safeR=Math.max(holeRadiusPx+clearancePx,holeRadiusPx+1),frame=Math.max(1,frameThicknessPx),inset=Math.max(safeR+1,insetPx);
    const targets=count===4?[[inset,inset],[w-1-inset,inset],[inset,h-1-inset],[w-1-inset,h-1-inset]]:[[inset,inset],[w-1-inset,inset]];
    const placed=[];
    for(const [cx,cy] of targets){
      const pad=safeR+2;drawDisk(out,w,h,cx,cy,pad);
      if(cy<h/2)fillRect(out,w,h,cx-pad,0,cx+pad,Math.max(frame,cy));else fillRect(out,w,h,cx-pad,Math.min(cy,h-1-frame),cx+pad,h-1);
      if(count===4){if(cx<w/2)fillRect(out,w,h,0,cy-pad,Math.max(frame,cx),cy+pad);else fillRect(out,w,h,Math.min(cx,w-1-frame),cy-pad,w-1,cy+pad);}
      for(let y=Math.floor(cy-holeRadiusPx);y<=Math.ceil(cy+holeRadiusPx);y++)for(let x=Math.floor(cx-holeRadiusPx);x<=Math.ceil(cx+holeRadiusPx);x++)if(x>=0&&y>=0&&x<w&&y<h&&(x-cx)*(x-cx)+(y-cy)*(y-cy)<=holeRadiusPx*holeRadiusPx)out[idx(x,y,w)]=0;
      placed.push({x:cx,y:cy});
    }
    return {mask:out,placed,frame_applied:true};
  }
  function finalize(state,opts={}){
    const detail=opts.detail||state.detail||'medium',smoothing=opts.smoothing||'medium',comps=componentList(state.mask,state.w,state.h,3,500);
    if(!comps.length)throw new Error('There is no retained steel in the editor.');
    if(comps.length>1)throw new Error(`CUT-READY BLOCKED: retained steel has ${comps.length} disconnected pieces. Use Auto-connect steel, paint bridges, or remove islands before creating the DXF.`);
    const vectorMask=smoothing==='none'?state.mask:smoothMaskEdges(state.mask,state.w,state.h,smoothing==='strong'?2:1);
    const loops=loopsFromConnectedMask(vectorMask,state.w,state.h,detail,smoothing);if(!loops.length)throw new Error('No closed CNC contours could be produced from the edited metal mask.');
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
  window.MERLIN_IMAGE_DXF={convert,prepare,finalize,selfTest:selfTestGeometry,componentCount,invertMask,keepLargestMask,removeSmallIslandsMask,autoConnectMask,autoBuildViableNetwork,autoInterpretWholeImage,addFrameMask,addMountingHolesMask,addFrameMountingHolesMask,smoothMaskEdges,dilate,erode,detectImageRegions,snapMaskToRegions,setRegionValues,setColourValues,regionAt,colourAt,similarRegionIds,buildColourPalette,buildPixelPalette,colourRegionIds};
})();
