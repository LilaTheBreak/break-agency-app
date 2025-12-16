#!/usr/bin/env python3
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SCHEMA = ROOT / 'apps' / 'api' / 'prisma' / 'schema.prisma'
BACKUP = SCHEMA.with_suffix('.prisma.bak')

def read():
    return SCHEMA.read_text()

def write(txt):
    SCHEMA.write_text(txt)

# naive model parser
model_re = re.compile(r"model\s+(\w+)\s+{(.*?)}", re.S)
rel_field_re = re.compile(r"^(\s*)(\w+)\s+(\w+\??|\w+\[\])\s+.*@relation\(([^)]*)\).*$", re.M)
relation_name_re = re.compile(r'@relation\("([^"]+)"')
fields_kw_re = re.compile(r'fields\s*:\s*\[([^\]]+)\]')
references_kw_re = re.compile(r'references\s*:\s*\[([^\]]+)\]')


def pluralize(name):
    # simple plural: add s, handle trailing y
    if name.endswith('y'):
        return name[:-1] + 'ies'
    return name + 's'


def camel_lower(name):
    return name[0].lower() + name[1:]


def ensure_relation_name(attr_text, suggested):
    # if attr_text contains @relation("Name"), return name, else return None
    m = re.search(r'@relation\("([^"]+)"', attr_text)
    if m:
        return m.group(1)
    return None


def main():
    txt = read()
    (BACKUP).write_text(txt)
    models = {m.group(1): m.group(2) for m in model_re.finditer(txt)}

    edits = []
    for m in model_re.finditer(txt):
        model_name = m.group(1)
        body = m.group(2)
        for fm in rel_field_re.finditer(body):
            indent, field_name, field_type, rel_attrs = fm.groups()
            # only consider fields that use fields: [...] and references: [...]
            if 'fields' not in rel_attrs or 'references' not in rel_attrs:
                continue
            # determine target model (strip [] and ?)
            target = field_type.replace('[]','').replace('?','')
            target = target.strip()
            if target not in models:
                continue
            rel_name = ensure_relation_name(rel_attrs, None)
            # determine suggested relation name
            if rel_name:
                name = rel_name
            else:
                name = f"{model_name}{target}Relation"
            # check if target already has opposite field referencing model_name
            target_body = models[target]
            # if any field in target body has type model_name or model_name[] with same relation name, skip
            exists = False
            for tm in rel_field_re.finditer(target_body):
                t_indent, t_field, t_type, t_attrs = tm.groups()
                t_target = t_type.replace('[]','').replace('?','').strip()
                if t_target == model_name:
                    # if relation names both present and equal OR no names used, consider exists
                    t_rel = ensure_relation_name(t_attrs, None)
                    if (rel_name and t_rel == rel_name) or (not rel_name and not t_rel):
                        exists = True
                        break
            if exists:
                continue
            # construct opposite field name
            base = camel_lower(model_name)
            plural = pluralize(base)
            suffix = ''
            if rel_name:
                if 'Author' in rel_name:
                    suffix = 'Authored'
                elif 'Resolver' in rel_name or 'Resolved' in rel_name:
                    suffix = 'Resolved'
                elif 'Brand' in rel_name:
                    suffix = 'ForBrand'
                elif 'Creator' in rel_name:
                    suffix = 'ForCreator'
                else:
                    suffix = ''
            opp_field = plural + suffix
            # ensure unique name in target body
            counter = 1
            candidate = opp_field
            while re.search(rf"\b{candidate}\b", target_body):
                candidate = opp_field + str(counter)
                counter += 1
            opp_field = candidate
            # ensure target line uses same @relation(name)
            relation_clause = f'@relation("{name}")' if rel_name or True else ''
            # build insertion line
            line = f"  {opp_field} {model_name}[] {relation_clause}\n"
            # store edit: append line into target model before its closing '}'
            edits.append((target, line))
    # apply edits grouped by model
    if not edits:
        print('No edits necessary')
        return
    new_txt = txt
    for target, line in edits:
        # find model block and insert before ending '}' of that model
        pattern = re.compile(rf"(model\s+{target}\s+{{)(.*?)(\n}})", re.S)
        m = pattern.search(new_txt)
        if not m:
            continue
        start, body, end = m.group(1), m.group(2), m.group(3)
        # insert line before closing
        new_body = body + '\n' + line
        new_txt = new_txt[:m.start()] + start + new_body + end + new_txt[m.end():]
    write(new_txt)
    print(f'Applied {len(edits)} edits and backed up original to {BACKUP}')

if __name__ == '__main__':
    main()
