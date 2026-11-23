import gradio_client.utils as gc_utils

_orig_get_type = gc_utils.get_type
_orig_j2p = gc_utils._json_schema_to_python_type

def _safe_get_type(schema):
    if isinstance(schema, bool):
        return "Any"
    return _orig_get_type(schema)

def _safe_j2p(schema, defs=None):
    if isinstance(schema, bool):
        return "Any"
    return _orig_j2p(schema, defs)

gc_utils.get_type = _safe_get_type
gc_utils._json_schema_to_python_type = _safe_j2p
