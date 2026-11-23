"""
Applies all three gradio_client 0.14.0 schema-parsing fixes in one go.
Safe to re-run: each patch is skipped if it is already applied.

Run from color-service with the venv active:
    python patch_gradio_client.py
"""

import os
import re

import gradio_client

utils_path = os.path.join(os.path.dirname(gradio_client.__file__), "utils.py")
print(f"Patching: {utils_path}")

with open(utils_path, "r", encoding="utf-8") as f:
    content = f.read()

changed = False

# Patch A: get_type() crashes on bare bool schemas
old_a = 'def get_type(schema: dict):\n    if "const" in schema:\n'
new_a = 'def get_type(schema: dict):\n    if isinstance(schema, bool):\n        return "Any"\n    if "const" in schema:\n'
if 'def get_type(schema: dict):\n    if isinstance(schema, bool):' in content:
    print("Patch A (get_type bool guard): already applied")
elif old_a in content:
    content = content.replace(old_a, new_a, 1)
    changed = True
    print("Patch A (get_type bool guard): applied")
else:
    print("Patch A: pattern not found")

# Patch B: public json_schema_to_python_type() falls back to "Any" on errors
old_b = '''def json_schema_to_python_type(schema: Any) -> str:
    type_ = _json_schema_to_python_type(schema, schema.get("$defs"))
    return type_.replace(CURRENT_FILE_DATA_FORMAT, "filepath")'''
new_b = '''def json_schema_to_python_type(schema: Any) -> str:
    try:
        type_ = _json_schema_to_python_type(schema, schema.get("$defs"))
        return type_.replace(CURRENT_FILE_DATA_FORMAT, "filepath")
    except Exception:
        return "Any"'''
if 'except Exception:\n        return "Any"' in content:
    print("Patch B (try/except fallback): already applied")
elif old_b in content:
    content = content.replace(old_b, new_b, 1)
    changed = True
    print("Patch B (try/except fallback): applied")
else:
    print("Patch B: pattern not found")

# Patch C: bool guard inside the private _json_schema_to_python_type()
pattern = re.compile(r"(def _json_schema_to_python_type\([^)]*\)[^:\n]*:\n)")
match = pattern.search(content)
guard = '    if isinstance(schema, bool):\n        return "Any"\n'
if not match:
    print("Patch C: could not find _json_schema_to_python_type")
else:
    after = content[match.end():match.end() + len(guard) + 20]
    if "isinstance(schema, bool)" in after:
        print("Patch C (private function bool guard): already applied")
    else:
        content = content[:match.end()] + guard + content[match.end():]
        changed = True
        print("Patch C (private function bool guard): applied")

if changed:
    with open(utils_path, "w", encoding="utf-8") as f:
        f.write(content)
    print("\nDone. Changes written.")
else:
    print("\nNo changes needed.")