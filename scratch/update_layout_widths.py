import os

files = [
    r"src\app\(student)\progress\page.tsx",
    r"src\app\(student)\offers\page.tsx",
    r"src\app\(student)\notifications\page.tsx",
    r"src\app\(student)\drives\page.tsx",
    r"src\app\(student)\documents\page.tsx",
    r"src\app\(student)\dashboard\page.tsx",
    r"src\app\(student)\applications\page.tsx"
]

repo_root = r"c:\Users\Pavithran\Placely"

for rel_path in files:
    abs_path = os.path.join(repo_root, rel_path)
    if os.path.exists(abs_path):
        with open(abs_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        new_content = content.replace('max-w-[1400px]', 'max-w-7xl')
        
        if new_content != content:
            with open(abs_path, 'w', encoding='utf-8') as f:
                f.write(new_content)
            print(f"Updated {rel_path}")
        else:
            print(f"No change in {rel_path}")
    else:
        print(f"File not found: {abs_path}")
