"""
Second patch for the same class of bug: gradio_client's internal
_json_schema_to_python_type() (note the leading underscore -- this is
different from the public json_schema_to_python_type() patched earlier)
raises APIInfoParseError when it receives a bare boolean schema (True/False)
instead of a dict, e.g. from "additionalProperties": true in the API spec.
 
This inserts a guard at the top of that function so it returns "Any"
immediately when given a bool, instead of raising.
 
Usage:
    python patch_gradio_client_v2.py
"""
 
import gradio_client
import os
import re
 
utils_path = os.path.join(os.path.dirname(gradio_client.__file__), "utils.py")
print(f"Patching: {utils_path}")
 
with open(utils_path, "r", encoding="utf-8") as f:
    content = f.read()
 
if "def _json_schema_to_python_type" not in content:
    print("Could not find _json_schema_to_python_type in this file -- gradio_client version may differ from expected.")
    raise SystemExit(1)
 
if "isinstance(schema, bool)" in content and "_json_schema_to_python_type" in content.split("isinstance(schema, bool)")[0][-200:]:
    print("Looks like this may already be patched near _json_schema_to_python_type. Proceeding cautiously anyway.")
 
# Match the function signature line (may span one line) ending in "):" or ") -> str:" etc.
pattern = re.compile(r"(def _json_schema_to_python_type\([^)]*\)[^:\n]*:\n)")
match = pattern.search(content)
 
if not match:
    print("Could not locate the function signature line via regex.")
    print("Showing the relevant section so we can patch manually:")
    idx = content.find("def _json_schema_to_python_type")
    print(content[idx:idx+300])
    raise SystemExit(1)
 
insert_point = match.end()
guard = '    if isinstance(schema, bool):\n        return "Any"\n'
 
# Avoid double-patching
already_there = content[insert_point:insert_point + len(guard) + 20]
if "isinstance(schema, bool)" in already_there:
    print("Guard already present right after the function signature. No changes made.")
else:
    content = content[:insert_point] + guard + content[insert_point:]
    with open(utils_path, "w", encoding="utf-8") as f:
        f.write(content)
    print("Inserted bool guard directly inside _json_schema_to_python_type().")
    print("Re-run check_api.py now.")
 