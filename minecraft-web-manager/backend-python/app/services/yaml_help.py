from typing import Dict, List


def extract_yaml_comments(raw: str) -> Dict[str, str]:
    """Extract comments preceding keys and map them to dotted key paths.

    This is a lightweight parser: it walks lines, tracks indentation stack
    and assigns the most recent contiguous comment block to the following key.
    It supports nested mappings but not full YAML syntax.
    """
    lines = raw.splitlines()
    stack: List[tuple[int, str]] = []  # (indent, key)
    result: Dict[str, str] = {}
    comment_buffer: List[str] = []

    def current_path_with(key: str) -> str:
        parts = [p for _, p in stack] + [key]
        return '.'.join(parts)

    for line in lines:
        if not line.strip():
            # blank line resets comment buffer
            comment_buffer = []
            continue
        stripped = line.lstrip('\t')
        indent = len(line) - len(stripped)
        s = stripped.strip()
        if s.startswith('#'):
            comment_buffer.append(s.lstrip('# ').rstrip())
            continue

        # key line? (simple heuristic)
        if ':' in stripped and not stripped.strip().startswith('-'):
            key = stripped.split(':', 1)[0].strip()
            # adjust stack according to indent
            while stack and stack[-1][0] >= indent:
                stack.pop()
            stack.append((indent, key))
            if comment_buffer:
                path = '.'.join([p for _, p in stack])
                result[path] = '\n'.join(comment_buffer)
                comment_buffer = []
            continue

        # list item or other; clear comment buffer
        comment_buffer = []

    return result
