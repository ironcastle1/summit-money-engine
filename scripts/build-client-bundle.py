#!/usr/bin/env python3
from __future__ import annotations
from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[1]
PUBLIC = ROOT / 'public'
ENTRY = PUBLIC / 'app.js'
OUTPUT = PUBLIC / 'app.bundle.js'

IMPORT_RE = re.compile(r"^\s*import\s+(.+?)\s+from\s+['\"]([^'\"]+)['\"]\s*;\s*$", re.M | re.S)
SIDE_IMPORT_RE = re.compile(r"^\s*import\s+['\"]([^'\"]+)['\"]\s*;\s*$", re.M)
EXPORT_DECL_RE = re.compile(r"\bexport\s+(?=(?:async\s+)?(?:class|function|const|let|var)\s+([A-Za-z_$][\w$]*))")
EXPORT_LIST_RE = re.compile(r"^\s*export\s*\{([^}]+)\}\s*;?\s*$", re.M)
EXPORT_DEFAULT_RE = re.compile(r"\bexport\s+default\s+")


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
    return [resolve(path, spec) for spec in specs]


def ordered(entry: Path) -> list[Path]:
    result: list[Path] = []
    visiting: set[Path] = set()
    visited: set[Path] = set()

    def visit(path: Path) -> None:
        path = path.resolve()
        if path in visited:
            return
        if path in visiting:
            chain = ' -> '.join(module_id(item) for item in visiting)
            raise RuntimeError(f'Client module cycle: {chain} -> {module_id(path)}')
        visiting.add(path)
        for dependency in imports(path):
            visit(dependency)
        visiting.remove(path)
        visited.add(path)
        result.append(path)

    visit(entry)
    return result


def import_binding(clause: str, dependency_id: str) -> str:
    clause = ' '.join(clause.split())
    source = f'__modules[{dependency_id!r}]'
    if clause.startswith('{'):
        items = []
        for item in clause.strip()[1:-1].split(','):
            item = item.strip()
            if not item:
                continue
            if ' as ' in item:
                original, local = [part.strip() for part in item.split(' as ', 1)]
                items.append(f'{original}: {local}')
            else:
                items.append(item)
        return f"const {{ {', '.join(items)} }} = {source};"
    if clause.startswith('* as '):
        return f"const {clause[5:].strip()} = {source};"
    if ',' in clause:
        default_name, remainder = [part.strip() for part in clause.split(',', 1)]
        lines = [f'const {default_name} = {source}.default;']
        if remainder.startswith('{'):
            lines.append(import_binding(remainder, dependency_id))
        elif remainder.startswith('* as '):
            lines.append(f"const {remainder[5:].strip()} = {source};")
        return '\n'.join(lines)
    return f'const {clause} = {source}.default;'


def transform(path: Path, is_entry: bool) -> str:
    text = path.read_text(encoding='utf-8')
    bindings: list[str] = []

    def replace_import(match: re.Match[str]) -> str:
        clause, specifier = match.group(1), match.group(2)
        bindings.append(import_binding(clause, module_id(resolve(path, specifier))))
        return ''

    text = IMPORT_RE.sub(replace_import, text)

    def replace_side(match: re.Match[str]) -> str:
        resolve(path, match.group(1))
        return ''

    text = SIDE_IMPORT_RE.sub(replace_side, text)
    exports: dict[str, str] = {}
    for match in EXPORT_DECL_RE.finditer(text):
        name = match.group(1)
        exports[name] = name
    text = EXPORT_DECL_RE.sub('', text)

    def replace_export_list(match: re.Match[str]) -> str:
        for raw in match.group(1).split(','):
            raw = raw.strip()
            if not raw:
                continue
            if ' as ' in raw:
                local, exported = [part.strip() for part in raw.split(' as ', 1)]
            else:
                local = exported = raw
            exports[exported] = local
        return ''

    text = EXPORT_LIST_RE.sub(replace_export_list, text)
    if EXPORT_DEFAULT_RE.search(text):
        raise RuntimeError(f'Default export is not supported by this bundle builder: {path}')

    prelude = '\n'.join(bindings)
    if is_entry:
        return f"// ENTRY: {module_id(path)}\n(() => {{\n{prelude}\n{text}\n}})();"
    returned = ', '.join(f'{name}: {local}' if name != local else name for name, local in exports.items())
    return f"// MODULE: {module_id(path)}\n__modules[{module_id(path)!r}] = (() => {{\n{prelude}\n{text}\nreturn Object.freeze({{{returned}}});\n}})();"


def main() -> None:
    paths = ordered(ENTRY)
    chunks = [
        '/* MERLIN CLIENT BUNDLE — generated; edit source modules, not this file. */',
        "'use strict';",
        'const __modules = Object.create(null);'
    ]
    chunks.extend(transform(path, path == ENTRY) for path in paths)
    OUTPUT.write_text('\n\n'.join(chunks) + '\n', encoding='utf-8')
    print(f'Wrote {OUTPUT.relative_to(ROOT)} from {len(paths)} modules')

if __name__ == '__main__':
    main()
