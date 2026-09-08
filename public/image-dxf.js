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
    const out=new Uint8Array(mask.length);for(const i of best)out[i]=1;return out;
  }
  function despeckle(mask,w,h,passes=1){
    let cur=mask;
    for(let pass=0;pass<passes;pass++){
      const out=new Uint8Array(cur.length);
      for(let y=1;y<h-1;y++)for(let x=1;x<w-1;x++){
        let n=0;for(let yy=-1;yy<=1;yy++)for(let xx=-1;xx<=1;xx++)if(cur[idx(x+xx,y+yy,w)])n++;
        out[idx(x,y,w)]=n>=5?1:0;
      }
      cur=out;
    }
    return cur;
  }
  function boundaryEdges(mask,w,h){
    const edges=[];
    function add(x1,y1,x2,y2){edges.push({x1,y1,x2,y2});}
    for(let y=0;y<h;y++)for(let x=0;x<w;x++)if(mask[idx(x,y,w)]){
      if(y===0||!mask[idx(x,y-1,w)])add(x,y,x+1,y);
      if(x===w-1||!mask[idx(x+1,y,w)])add(x+1,y,x+1,y+1);
      if(y===h-1||!mask[idx(x,y+1,w)])add(x+1,y+1,x,y+1);
      if(x===0||!mask[idx(x-1,y,w)])add(x,y+1,x,y);
    }
    return edges;
  }
  function stitchEdges(edges){
    const byStart=new Map();
    const key=(x,y)=>x+','+y;
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
  async function imageMask(file,opts={}){
    const bitmap=await createImageBitmap(file);const maxPx=clamp(Number(opts.maxPixels||650),250,1000);const scale=Math.min(1,maxPx/Math.max(bitmap.width,bitmap.height));const w=Math.max(8,Math.round(bitmap.width*scale)),h=Math.max(8,Math.round(bitmap.height*scale));
    const canvas=document.createElement('canvas');canvas.width=w;canvas.height=h;const ctx=canvas.getContext('2d',{willReadFrequently:true});ctx.fillStyle='#fff';ctx.fillRect(0,0,w,h);ctx.drawImage(bitmap,0,0,w,h);bitmap.close();
    const data=ctx.getImageData(0,0,w,h).data;let borderSum=0,borderN=0,allSum=0;
    for(let y=0;y<h;y++)for(let x=0;x<w;x++){const i=(y*w+x)*4,g=(data[i]*0.299+data[i+1]*0.587+data[i+2]*0.114);allSum+=g;if(x<3||y<3||x>=w-3||y>=h-3){borderSum+=g;borderN++;}}
    const avg=allSum/(w*h),border=borderSum/Math.max(1,borderN);const threshold=clamp(Number(opts.threshold||Math.round((avg+border)/2)),40,220);const foreground=opts.foreground==='light'?'light':opts.foreground==='dark'?'dark':(border>avg?'dark':'light');
    const mask=new Uint8Array(w*h);for(let y=0;y<h;y++)for(let x=0;x<w;x++){const i=(y*w+x)*4,g=data[i]*0.299+data[i+1]*0.587+data[i+2]*0.114;mask[idx(x,y,w)]=foreground==='dark'?(g<threshold?1:0):(g>threshold?1:0);}
    return {mask,w,h,threshold,foreground};
  }
  function fitLoops(loops,targetW,targetH,machineW,machineH,margin=8){
    const b=bounds(loops);const maxW=Math.max(20,Math.min(Number(targetW)||Infinity,Number(machineW||642.62)-margin*2));const maxH=Math.max(20,Math.min(Number(targetH)||Infinity,Number(machineH||591.82)-margin*2));const s=Math.min(maxW/b.width,maxH/b.height);const result=loops.map(loop=>loop.map(p=>({x:(p.x-b.minX)*s+margin,y:(b.maxY-p.y)*s+margin})));const rb=bounds(result);return {loops:result,width:rb.width,height:rb.height,scale:s};
  }
  function dxfPolyline(loop){const lines=['0','LWPOLYLINE','8','0','90',String(loop.length),'70','1'];for(const p of loop)lines.push('10',p.x.toFixed(3),'20',p.y.toFixed(3));return lines.join('\n');}
  function makeDxf(loops){return `0\nSECTION\n2\nHEADER\n9\n$INSUNITS\n70\n4\n0\nENDSEC\n0\nSECTION\n2\nENTITIES\n${loops.map(dxfPolyline).join('\n')}\n0\nENDSEC\n0\nEOF\n`;}
  async function convert(file,opts={}){
    let {mask,w,h,threshold,foreground}=await imageMask(file,opts);mask=despeckle(mask,w,h,opts.detail==='high'?0:opts.detail==='low'?2:1);mask=connectedLargest(mask,w,h);let loops=stitchEdges(boundaryEdges(mask,w,h));loops=simplifyLoops(loops,opts.detail==='high'?0.65:opts.detail==='low'?2.2:1.2,opts.detail==='high'?8:opts.detail==='low'?35:18);if(!loops.length)throw new Error('No usable connected silhouette was found. Use a cleaner, higher-contrast image.');
    const outer=loops[0],outerArea=Math.abs(polygonArea(outer));const retained=[outer];for(const l of loops.slice(1)){const a=Math.abs(polygonArea(l));if(a>outerArea*0.0008)retained.push(l);}const fitted=fitLoops(retained,opts.targetWidth,opts.targetHeight,opts.machineWidth,opts.machineHeight,Number(opts.margin||8));
    return {dxf:makeDxf(fitted.loops),width_mm:fitted.width,height_mm:fitted.height,loops:fitted.loops.length,threshold,foreground};
  }
  window.MERLIN_IMAGE_DXF={convert};
})();
