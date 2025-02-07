import os
import json

def find_imports(file_path):
    imports = []
    try:
        with open(file_path, 'r') as f:
            for line in f:
                line = line.strip()
                if line.startswith('import '):
                    imports.append(line)
    except:
        pass
    return imports

def generate_context_anchor():
    structure = {}

    # The trick: we prune dirs in-place so os.walk doesn't even descend into them.
    for root, dirs, files in os.walk('.'):
        # Modify `dirs` so it doesn’t walk into hidden dirs or node_modules.
        dirs[:] = [
            d for d in dirs
            if not d.startswith('.') and d != 'node_modules'
        ]

        # Now root won't even contain node_modules or hidden .dirs
        rel_path = os.path.relpath(root)

        structure[rel_path] = {
            'files': files,
            'dependencies': {
                f: find_imports(os.path.join(root, f))
                for f in files
                if f.endswith(('.js', '.jsx', '.ts'))
            }
        }

    return structure

if __name__ == "__main__":
    data = generate_context_anchor()
    print(json.dumps(data, indent=2))
