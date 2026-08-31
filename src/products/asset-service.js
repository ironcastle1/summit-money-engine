import fs from 'node:fs';
import path from 'node:path';
import { id, sha256 } from '../util/id.js';
import { safeFilename } from '../services/filesystem.js';

const IMAGE_EXT = new Set(['.png','.jpg','.jpeg','.webp','.gif','.bmp','.tif','.tiff','.heic']);
const LISTING_EXT = new Set(['.txt','.md','.csv','.html','.htm']);
const DOCUMENT_EXT = new Set(['.pdf','.doc','.docx','.rtf','.odt','.xlsx','.xls']);

function rootFor(productCode){return path.resolve(process.env.MERLIN_PRODUCT_DIR || './data/products', productCode);}
function kindFor(name, override){
  if(override && ['photos','listings','production','costing','documents','assets'].includes(override)) return override;
  const ext=path.extname(name||'').toLowerCase();
  if(IMAGE_EXT.has(ext))return 'photos';
  if(LISTING_EXT.has(ext))return 'listings';
  if(DOCUMENT_EXT.has(ext))return 'documents';
  return 'assets';
}
export function storeProductAssets(db, productId, files, kindOverride=null){
  const p=db.prepare('SELECT id,product_code FROM products WHERE id=?').get(productId);
  if(!p)throw Object.assign(new Error('Product not found'),{status:404});
  const out=[];
  for(const f of files||[]){
    const kind=kindFor(f.originalname,kindOverride);const dir=path.join(rootFor(p.product_code),kind);fs.mkdirSync(dir,{recursive:true});
    const aid=id('ASSET');const base=safeFilename(f.originalname);const stored=`${aid}_${base}`;const full=path.join(dir,stored);fs.writeFileSync(full,f.buffer);
    db.prepare(`INSERT INTO product_assets (id,product_id,asset_kind,original_filename,stored_path,sha256,mime_type,size_bytes) VALUES (?,?,?,?,?,?,?,?)`).run(aid,productId,kind,f.originalname,full,sha256(f.buffer),f.mimetype||null,Number(f.size||f.buffer.length||0));
    out.push(db.prepare('SELECT * FROM product_assets WHERE id=?').get(aid));
  }
  return out;
}
export function listProductAssets(db,productId){return db.prepare('SELECT * FROM product_assets WHERE product_id=? ORDER BY created_at DESC').all(productId);}
