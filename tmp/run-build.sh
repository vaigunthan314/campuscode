cd "/Users/vaigunthansl/Desktop/Rebuild /"
pkill -f 'vite' 2>/dev/null
sleep 1
echo "=== typecheck ==="
npx tsc -b --pretty false 2>&1 | sed -n '1,120p'
TC=$?
echo "typecheck_exit=$TC"
echo "=== build ==="
npx vite build 2>&1 | sed -n '1,160p'
B=$?
echo "build_exit=$B"
echo "=== artifacts ==="
ls -la dist/index.html dist/assets 2>/dev/null
#!/bin/bash
