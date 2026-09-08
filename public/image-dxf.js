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
  function erode(mask,w,h){
    const out=new Uint8Array(mask.length);
    for(let y=1;y<h-1;y++)for(let x=1;x<w-1;x++){
      let keep=1;
      for(let yy=-1;yy<=1&&keep;yy++)for(let xx=-1;xx<=1;xx++)if(!mask[idx(x+xx,y+yy,w)]){keep=0;break;}
      out[idx(x,y,w)]=keep;
    }
    return out;
  }
  function dilate(mask,w,h){
    const out=new Uint8Array(mask.length);
    for(let y=0;y<h;y++)for(let x=0;x<w;x++)if(mask[idx(x,y,w)]){
      for(let yy=-1;yy<=1;yy++)for(let xx=-1;xx<=1;xx++){const nx=x+xx,ny=y+yy;if(nx>=0&&ny>=0&&nx<w&&ny<h)out[idx(nx,ny,w)]=1;}
    }
    return out;
  }
  function closeMask(mask,w,h,passes=1){let cur=mask;for(let i=0;i<passes;i++)cur=erode(dilate(cur,w,h),w,h);return cur;}
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
    const bitmap=await createImageBitmap(file);const maxPx=clamp(Number(opts.maxPixels||750),250,1200);const scale=Math.min(1,maxPx/Math.max(bitmap.width,bitmap.height));const w=Math.max(8,Math.round(bitmap.width*scale)),h=Math.max(8,Math.round(bitmap.height*scale));
    const canvas=document.createElement('canvas');canvas.width=w;canvas.height=h;const ctx=canvas.getContext('2d',{willReadFrequently:true});ctx.fillStyle='#fff';ctx.fillRect(0,0,w,h);ctx.drawImage(bitmap,0,0,w,h);bitmap.close();
    const rgba=ctx.getImageData(0,0,w,h).data,gray=new Float32Array(w*h);let borderR=0,borderG=0,borderB=0,borderN=0,all=0,borderLum=0;
    for(let y=0;y<h;y++)for(let x=0;x<w;x++){
      const p=idx(x,y,w),i=p*4,r=rgba[i],g=rgba[i+1],b=rgba[i+2],lum=r*.299+g*.587+b*.114;gray[p]=lum;all+=lum;
      if(x<4||y<4||x>=w-4||y>=h-4){borderR+=r;borderG+=g;borderB+=b;borderLum+=lum;borderN++;}
    }
    return {rgba,gray,w,h,avg:all/(w*h),borderLum:borderLum/Math.max(1,borderN),borderRGB:[borderR/borderN,borderG/borderN,borderB/borderN],otsu:otsu(gray)};
  }
  function thresholdMask(gray,threshold,foreground){const mask=new Uint8Array(gray.length);for(let i=0;i<gray.length;i++)mask[i]=foreground==='dark'?(gray[i]<threshold?1:0):(gray[i]>threshold?1:0);return mask;}
  function borderDifferenceMask(r,threshold){
    const [br,bg,bb]=r.borderRGB,mask=new Uint8Array(r.w*r.h);
    for(let p=0;p<mask.length;p++){const i=p*4,dr=r.rgba[i]-br,dg=r.rgba[i+1]-bg,db=r.rgba[i+2]-bb;const d=Math.sqrt(dr*dr+dg*dg+db*db);mask[p]=d>threshold?1:0;}
    return mask;
  }
  function candidateMasks(r,opts){
    const requested=opts.foreground==='dark'||opts.foreground==='light'?opts.foreground:null;
    const auto=Math.round((r.avg+r.borderLum)/2),base=[r.otsu,auto,r.otsu-35,r.otsu+35,r.otsu-18,r.otsu+18].map(v=>clamp(Math.round(v),25,230));
    const unique=[...new Set(base)],list=[];
    const fore=requested?[requested]:['dark','light'];
    for(const f of fore)for(const t of unique){list.push({method:`${f} threshold ${t}`,mask:thresholdMask(r.gray,t,f),threshold:t,foreground:f});}
    for(const t of [18,28,40,55,75,95])list.push({method:`background separation ${t}`,mask:borderDifferenceMask(r,t),threshold:t,foreground:'background-separated'});
    return list;
  }
  function evaluateCandidate(c,r,detail){
    const variants=[{name:'raw',mask:c.mask},{name:'closed',mask:closeMask(c.mask,r.w,r.h,1)},{name:'closed-2',mask:closeMask(c.mask,r.w,r.h,2)},{name:'closed-4',mask:closeMask(c.mask,r.w,r.h,4)}];
    if(detail!=='high')variants.push({name:'cleaned',mask:despeckle(closeMask(c.mask,r.w,r.h,1),r.w,r.h,1)});
    let best=null;
    for(const v of variants){
      const largest=connectedLargest(v.mask,r.w,r.h),fraction=largest.size/(r.w*r.h);
      if(largest.size<Math.max(24,Math.floor(r.w*r.h*0.00025))||fraction>0.94)continue;
      const rawLoops=stitchEdges(boundaryEdges(largest.mask,r.w,r.h));
      const loops=simplifyLoops(rawLoops,detail==='high'?0.55:detail==='low'?2.0:1.0,detail==='high'?3:detail==='low'?18:7);
      if(!loops.length)continue;
      const outerArea=Math.abs(polygonArea(loops[0]));if(outerArea<8)continue;
      const retained=[loops[0]];for(const l of loops.slice(1)){const a=Math.abs(polygonArea(l));if(a>outerArea*0.0006)retained.push(l);}
      let borderHits=0;for(let x=0;x<r.w;x++){if(largest.mask[idx(x,0,r.w)])borderHits++;if(largest.mask[idx(x,r.h-1,r.w)])borderHits++;}for(let y=1;y<r.h-1;y++){if(largest.mask[idx(0,y,r.w)])borderHits++;if(largest.mask[idx(r.w-1,y,r.w)])borderHits++;}const borderRatio=borderHits/Math.max(1,2*r.w+2*r.h-4);const coverageScore=fraction<=0.65?fraction*100:65-(fraction-0.65)*120;const score=coverageScore+(Math.min(largest.size,50000)/50000*8)+(Math.min(retained.length,20)*0.15)-(borderRatio*70)-(fraction>0.88?25:0);
      const result={...c,method:`${c.method} / ${v.name}`,loops:retained,fraction,score};if(!best||result.score>best.score)best=result;
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
    const r=await raster(file,opts),candidates=candidateMasks(r,opts);let best=null;
    for(const c of candidates){const e=evaluateCandidate(c,r,opts.detail||'medium');if(e&&(!best||e.score>best.score))best=e;}
    if(!best||!best.loops?.length)throw new Error('MERLIN could not isolate a usable subject from this image after multiple automatic passes. Try cropping closer to the subject or choose Dark/Light foreground manually.');
    const fitted=fitLoops(best.loops,opts.targetWidth,opts.targetHeight,opts.machineWidth,opts.machineHeight,Number(opts.margin||0));
    return {dxf:makeDxf(fitted.loops),width_mm:fitted.width,height_mm:fitted.height,loops:fitted.loops.length,threshold:best.threshold,foreground:best.foreground,method:best.method,subject_fraction:best.fraction,file_format:'AutoCAD R12 ASCII (AC1009)'};
  }
  window.MERLIN_IMAGE_DXF={convert};
})();
