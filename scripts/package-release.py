from pathlib import Path
import zipfile, hashlib, json, os, shutil, sys
root=Path(__file__).resolve().parents[1]
outdir=Path(sys.argv[1] if len(sys.argv)>1 else '/mnt/data')
outdir.mkdir(parents=True,exist_ok=True)
base='MERLIN_WORKING_V8'
skip_dirs={'.git','node_modules','runtime','browser-output','screenshots','__pycache__'}
skip_names={'MERLIN_V8_STATIC_VERIFY.json','MERLIN_V8_HTTP_SMOKE.json'}
files=[]
for p in root.rglob('*'):
    if not p.is_file(): continue
    rel=p.relative_to(root)
    if any(part in skip_dirs for part in rel.parts): continue
    if p.name in skip_names: continue
    if p.suffix in {'.zip'}: continue
    files.append(rel)
files=sorted(files,key=lambda p:str(p).lower())
complete=outdir/f'{base}_COMPLETE.zip'
with zipfile.ZipFile(complete,'w',zipfile.ZIP_DEFLATED,compresslevel=6) as z:
    for rel in files:z.write(root/rel,rel.as_posix())
# GitHub browser upload batches: <=90 files so safely below 100.
parts=[]
for i in range(0,len(files),90):
    batch=files[i:i+90]; zp=outdir/f'{base}_PART_{i//90+1:02d}.zip'
    with zipfile.ZipFile(zp,'w',zipfile.ZIP_DEFLATED,compresslevel=6) as z:
        for rel in batch:z.write(root/rel,rel.as_posix())
    parts.append({'name':zp.name,'files':len(batch),'sha256':hashlib.sha256(zp.read_bytes()).hexdigest()})
manifest=[]
for rel in files:
    b=(root/rel).read_bytes();manifest.append({'path':rel.as_posix(),'bytes':len(b),'sha256':hashlib.sha256(b).hexdigest()})
report={'base':base,'files':len(files),'complete':{'name':complete.name,'bytes':complete.stat().st_size,'sha256':hashlib.sha256(complete.read_bytes()).hexdigest()},'parts':parts,'manifest':manifest}
(outdir/f'{base}_MANIFEST.json').write_text(json.dumps(report,indent=2))
(outdir/f'{base}_SHA256.txt').write_text(report['complete']['sha256']+'  '+complete.name+'\n'+''.join(f"{x['sha256']}  {x['name']}\n" for x in parts))
print(json.dumps({'complete':str(complete),'files':len(files),'parts':parts},indent=2))
