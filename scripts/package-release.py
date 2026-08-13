from pathlib import Path
import hashlib,json,zipfile,shutil,subprocess,os
ROOT=Path(__file__).resolve().parents[1]
OUT=Path('/mnt/data')
NAME='MERLIN_DARK_BLUE_MAP_V7'
EXCLUDE_TOP={'release','browser-output','actual-screenshots','screenshots-v7','screenshots-v7-http','.git','node_modules','runtime','runtime-test'}

def files():
    rows=[]
    for p in ROOT.rglob('*'):
        if not p.is_file():continue
        rel=p.relative_to(ROOT)
        if rel.parts and rel.parts[0] in EXCLUDE_TOP:continue
        if any(part in {'__pycache__'} for part in rel.parts):continue
        rows.append(p)
    return sorted(rows,key=lambda p:p.relative_to(ROOT).as_posix())

def sha(path):
    h=hashlib.sha256()
    with path.open('rb') as f:
        for chunk in iter(lambda:f.read(1024*1024),b''):h.update(chunk)
    return h.hexdigest()

def write_zip(path,rows):
    if path.exists():path.unlink()
    with zipfile.ZipFile(path,'w',zipfile.ZIP_DEFLATED,compresslevel=9) as z:
        for p in rows:z.write(p,p.relative_to(ROOT).as_posix())

rows=files()
complete=OUT/f'{NAME}_COMPLETE.zip';write_zip(complete,rows)
parts=[]
for i,start in enumerate(range(0,len(rows),90),1):
    path=OUT/f'{NAME}_PART_{i:02d}.zip';chunk=rows[start:start+90];write_zip(path,chunk);parts.append((path,chunk))
manifest={
    'release':NAME,
    'repositoryFileCount':len(rows),
    'completeArchive':{'file':complete.name,'sha256':sha(complete),'sizeBytes':complete.stat().st_size},
    'parts':[{'file':p.name,'fileCount':len(chunk),'sha256':sha(p),'paths':[x.relative_to(ROOT).as_posix() for x in chunk]} for p,chunk in parts],
    'files':[{'path':p.relative_to(ROOT).as_posix(),'sizeBytes':p.stat().st_size,'sha256':sha(p)} for p in rows]
}
manifest_path=OUT/f'{NAME}_MANIFEST.json';manifest_path.write_text(json.dumps(manifest,indent=2)+'\n')
sha_path=OUT/f'{NAME}_SHA256.txt';sha_path.write_text('\n'.join([f'{sha(complete)}  {complete.name}',* [f'{sha(p)}  {p.name}' for p,_ in parts],f'{sha(manifest_path)}  {manifest_path.name}'])+'\n')
print(json.dumps({'complete':str(complete),'repositoryFiles':len(rows),'parts':[{'path':str(p),'files':len(c)} for p,c in parts],'manifest':str(manifest_path),'sha256':str(sha_path)},indent=2))
