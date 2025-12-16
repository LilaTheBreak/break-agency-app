#!/usr/bin/env python3
import re
from pathlib import Path
ROOT = Path(__file__).resolve().parent.parent
SCHEMA = ROOT / 'apps' / 'api' / 'prisma' / 'schema.prisma'
BACKUP = SCHEMA.with_suffix('.reconcile.bak')
text = SCHEMA.read_text()
BACKUP.write_text(text)

# parse models
model_pat = re.compile(r"model\s+(\w+)\s+{(.*?)}", re.S)
models = {m.group(1): m.group(2) for m in model_pat.finditer(text)}

# find relation fields that use fields: [...] and references: [...]
rel_field_pat = re.compile(r"^(\s*)(\w+)\s+(\w+\??|\w+\[\])\s+(.*)$", re.M)
relation_attr_pat = re.compile(r"@relation\(([^)]*)\)")
relation_name_pat = re.compile(r'@relation\("([^"]+)"')
fields_kw_pat = re.compile(r'fields\s*:\s*\[([^\]]+)\]')
references_kw_pat = re.compile(r'references\s*:\s*\[([^\]]+)\]')

# collect existing relation names
used_relation_names = set(re.findall(r'@relation\("([^"]+)"\)', text))

# helper
def strip_type(t):
    return t.replace('[]','').replace('?','')

actions = []

for m in model_pat.finditer(text):
    src = m.group(1)
    body = m.group(2)
    for fm in rel_field_pat.finditer(body):
        indent, field_name, field_type, rest = fm.groups()
        rel_match = relation_attr_pat.search(rest)
        if not rel_match:
            continue
        attrs = rel_match.group(1)
        if 'fields' not in attrs or 'references' not in attrs:
            continue
        tgt = strip_type(field_type)
        if tgt not in models:
            continue
        # determine relation name if any
        rn = relation_name_pat.search(rest)
        rel_name = rn.group(1) if rn else None
        # check if target has opposite
        target_body = models[tgt]
        has_opposite = False
        for tfm in rel_field_pat.finditer(target_body):
            _, t_field_name, t_field_type, t_rest = tfm.groups()
            t_target = strip_type(t_field_type)
            if t_target == src:
                has_opposite = True
                break
        if has_opposite:
            continue
        # need to add opposite on target
        # determine opposite field name
        base = src[0].lower()+src[1:]
        opp = base + 's'
        # if conflict, try variants
        tbody = target_body
        counter = 1
        while re.search(rf"\b{opp}\b", tbody):
            opp = base + 's' + str(counter)
            counter += 1
        # determine relation name to use
        if rel_name:
            use_name = rel_name
        else:
            # create unique relation name
            cand = f"{src}{tgt}Relation"
            c = 1
            use_name = cand
            while use_name in used_relation_names:
                use_name = f"{cand}{c}"
                c += 1
            used_relation_names.add(use_name)
            # also need to add this @relation(name) to source field
            # modify source body: replace first occurrence of rel_attr without @relation("...") to include name
            # build pattern to replace inside the specific model block
            sb_pattern = re.compile(rf"(model\s+{src}\s+{{)(.*?)(\n}})", re.S)
            sm = sb_pattern.search(text)
            if sm:
                sblock = sm.group(2)
                # find the specific field line to update
                # build regex for field line
                fpattern = re.compile(rf"(\n\s*{field_name}\s+{field_type}\s+.*?@relation\()([^)]*)(\).*)", re.S)
                fm2 = fpattern.search(sblock)
                if fm2:
                    before = fm2.group(1)
                    inner = fm2.group(2)
                    after = fm2.group(3)
                    new_inner = f'"{use_name}"'
                    new_field_line = before + new_inner + after
                    sblock_new = sblock[:fm2.start()] + new_field_line + sblock[fm2.end():]
                    # replace model block in text and models dict
                    text = text[:sm.start()] + sm.group(1) + sblock_new + sm.group(3) + text[sm.end():]
                    models = {m2.group(1): m2.group(2) for m2 in model_pat.finditer(text)}
                    target_body = models[tgt]
                else:
                    # fallback: append relation name to the @relation(...) by simple replace of first @relation(
                    text = text.replace(f'@relation({attrs})', f'@relation("{use_name}", {attrs})', 1)
                    models = {m2.group(1): m2.group(2) for m2 in model_pat.finditer(text)}
                    target_body = models[tgt]
        # now construct line to insert into target body
        rel_clause = f' @relation("{use_name}")' if use_name else ''
        insert_line = f"  {opp} {src}[] {rel_clause}\n"
        # insert before closing brace of target model
        t_pattern = re.compile(rf"(model\s+{tgt}\s+{{)(.*?)(\n}})", re.S)
        tm = t_pattern.search(text)
        if tm:
            new_tbody = tm.group(2) + '\n' + insert_line
            text = text[:tm.start()] + tm.group(1) + new_tbody + tm.group(3) + text[tm.end():]
            models = {m2.group(1): m2.group(2) for m2 in model_pat.finditer(text)}
            actions.append((tgt, opp, use_name))

# write final
SCHEMA.write_text(text)
print(f'Applied {len(actions)} opposite relation insertions; backup at {BACKUP}')
for a in actions[:200]:
    print(a)
