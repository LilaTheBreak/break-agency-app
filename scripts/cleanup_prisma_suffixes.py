#!/usr/bin/env python3
import re
from pathlib import Path
ROOT = Path(__file__).resolve().parent.parent
SCHEMA = ROOT / 'apps' / 'api' / 'prisma' / 'schema.prisma'
BACKUP = SCHEMA.with_suffix('.prisma.afterfix.bak')
text = SCHEMA.read_text()
BACKUP.write_text(text)
lines = text.splitlines()
new_lines = []
removed = []
pattern = re.compile(r"^\s*(\w+\d+)\s+([\w\[\]\?]+)\b")
for line in lines:
    m = pattern.match(line)
    if m:
        # skip removal if the field name looks intentionally numeric in other contexts? assume safe
        fname = m.group(1)
        removed.append((fname, line))
        continue
    new_lines.append(line)
SCHEMA.write_text('\n'.join(new_lines)+"\n")
print(f'Removed {len(removed)} suffixed fields; backup at {BACKUP}')
for f,l in removed[:50]:
    print(f'- {f}')
