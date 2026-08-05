#!/usr/bin/env python3
from __future__ import annotations
from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[1]
PUBLIC = ROOT / 'public'
ENTRY = PUBLIC / 'merlin.js'
OUTPUT = ROOT / '.tmp' / 'merlin-browser-bundle.js'
IMPORT_RE = re.compile(r"\bimport\s*([^;]+?)\s*from\s*['\"]([^'\"]+)['\"]\s*;")
SIDE_IMPORT_RE = re.compile(r"\bimport\s+['\"]([^'\"]+)['\"]\s*;")
EXPORT_DECL_RE = re.compile(r"\bexport\s+(?=(?:async\s+)?(?:class|function|const|let|var)\s+([A-Za-z_$][\w$]*))")
EXPORT_LIST_RE = re.compile(r"^\s*export\s*\{([^}]+)\}\s*;?\s*$", re.M)
EXPORT_DEFAULT_RE = re.compile(r"\bexport\s+default\s+")
REEXPORT_RE = re.compile(r"\bexport\s*\{([^}]+)\}\s*from\s*['\"]([^'\"]+)['\"]\s*;?")

def module_id(path: Path) -> str:
    return path.relative_to(PUBLIC).as_posix()

def resolve(path: Path, specifier: str) -> Path:
    if not specifier.startswith('.'):
        raise RuntimeError(f'Unsupported bare import {specifier!r} in {path}')
    target = (path.parent / specifier).resolve()
    if not target.exists():
        raise FileNotFoundError(f'Missing module {specifier!r} from {path}')
    return target

def imports(path: Path) -> list[Path]:
    text = path.read_text(encoding='utf-8')
    specs = [match.group(2) for match in IMPORT_RE.finditer(text)]
    specs.extend(match.group(1) for match in SIDE_IMPORT_RE.finditer(text))
    specs.extend(match.group(2) for match in REEXPORT_RE.finditer(text))
    return [resolve(path, specifier) for specifier in specs]

def ordered(entry: Path) -> list[Path]:
    result=[]; visiting=set(); visited=set()
    def visit(path: Path):
        path=path.resolve()
        if path in visited: return
        if path in visiting: raise RuntimeError(f'Client module cycle involving {module_id(path)}')
        visiting.add(path)
        for dependency in imports(path): visit(dependency)
        visiting.remove(path); visited.add(path); result.append(path)
    visit(entry)
    return result

def import_binding(clause: str, dependency_id: str) -> str:
    clause=' '.join(clause.split()); source=f'__modules[{dependency_id!r}]'
    if clause.startswith('{'):
        items=[]
        for item in clause.strip()[1:-1].split(','):
            item=item.strip()
            if not item: continue
            if ' as ' in item:
                original,local=[part.strip() for part in item.split(' as ',1)]; items.append(f'{original}: {local}')
            else: items.append(item)
        return f"const {{ {', '.join(items)} }} = {source};"
    if clause.startswith('* as '): return f"const {clause[5:].strip()} = {source};"
    if ',' in clause:
        default_name,remainder=[part.strip() for part in clause.split(',',1)]
        lines=[f'const {default_name} = {source}.default;']
        lines.append(import_binding(remainder,dependency_id))
        return '\n'.join(lines)
    return f'const {clause} = {source}.default;'

def transform(path: Path, is_entry: bool) -> str:
    text=path.read_text(encoding='utf-8'); bindings=[]
    def replace_import(match):
        clause,specifier=match.group(1),match.group(2)
        bindings.append(import_binding(clause,module_id(resolve(path,specifier))))
        return ''
    text=IMPORT_RE.sub(replace_import,text)
    text=SIDE_IMPORT_RE.sub(lambda match: (resolve(path,match.group(1)) and ''),text)
    exports={}
    def replace_reexport(match):
        dependency_id=module_id(resolve(path,match.group(2)))
        for raw in match.group(1).split(','):
            raw=raw.strip()
            if not raw: continue
            if ' as ' in raw:
                original,exported=[part.strip() for part in raw.split(' as ',1)]
            else:
                original=exported=raw
            local=f'__reexport_{len(bindings)}_{exported}'
            bindings.append(f'const {local} = __modules[{dependency_id!r}].{original};')
            exports[exported]=local
        return ''
    text=REEXPORT_RE.sub(replace_reexport,text)
    for match in EXPORT_DECL_RE.finditer(text): exports[match.group(1)]=match.group(1)
    text=EXPORT_DECL_RE.sub('',text)
    def replace_export_list(match):
        for raw in match.group(1).split(','):
            raw=raw.strip()
            if not raw: continue
            if ' as ' in raw: local,exported=[part.strip() for part in raw.split(' as ',1)]
            else: local=exported=raw
            exports[exported]=local
        return ''
    text=EXPORT_LIST_RE.sub(replace_export_list,text)
    if EXPORT_DEFAULT_RE.search(text): raise RuntimeError(f'Default export not supported: {path}')
    prelude='\n'.join(bindings)
    if is_entry: return f"// ENTRY: {module_id(path)}\n(() => {{\n{prelude}\n{text}\n}})();"
    returned=', '.join(f'{name}: {local}' if name != local else name for name,local in exports.items())
    return f"// MODULE: {module_id(path)}\n__modules[{module_id(path)!r}] = (() => {{\n{prelude}\n{text}\nreturn Object.freeze({{{returned}}});\n}})();"

def main():
    paths=ordered(ENTRY)
    OUTPUT.parent.mkdir(parents=True,exist_ok=True)
    chunks=['/* MERLIN V20.20 BROWSER ACCEPTANCE BUNDLE — generated for testing only. */',"'use strict';",'const __modules = Object.create(null);']
    chunks.extend(transform(path,path==ENTRY) for path in paths)
    OUTPUT.write_text('\n\n'.join(chunks)+'\n',encoding='utf-8')
    print(f'Wrote {OUTPUT.relative_to(ROOT)} from {len(paths)} modules')

if __name__=='__main__': main()
