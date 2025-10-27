#!/usr/bin/env python3
"""Add rate limiting to public APIs"""

import os
import re

APIS = [
    'src/app/api/professional/confirm/[token]/route.ts',
    'src/app/api/proposals/[id]/accept/route.ts',
    'src/app/api/proposals/[id]/reject/route.ts',
    'src/app/api/quotations/[id]/respond/route.ts',
    'src/app/api/webhooks/clerk/route.ts',
    'src/app/api/mapbox/directions/route.ts',
    'src/app/api/mapbox/isochrone/route.ts',
    'src/app/api/upload/route.ts',
]

IMPORT = "import { rateLimit, RateLimitPresets, createRateLimitError } from '@/lib/rate-limit';"

RATE_LIMIT_CODE = """    // Rate Limiting
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    const rateLimitResult = await rateLimit(ip, RateLimitPresets.PUBLIC_API);
    if (!rateLimitResult.success) {
      return NextResponse.json(createRateLimitError(rateLimitResult), {
        status: 429,
        headers: {
          'X-RateLimit-Limit': rateLimitResult.limit.toString(),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': new Date(rateLimitResult.reset).toISOString(),
          'Retry-After': Math.ceil((rateLimitResult.reset - Date.now()) / 1000).toString(),
        }
      });
    }

"""

for api_path in APIS:
    try:
        with open(api_path, 'r', encoding='utf-8') as f:
            content = f.read()

        # Skip if already has rate limiting
        if 'rateLimit(' in content:
            print(f"  ⏭️  {api_path} - já tem")
            continue

        # Add import
        if IMPORT not in content:
            # Find last import
            imports = re.findall(r"import .+?;", content)
            if imports:
                last_import = imports[-1]
                content = content.replace(last_import, f"{last_import}\n{IMPORT}")

        # Add rate limiting after try {
        if 'try {' in content:
            content = content.replace('try {\n', f'try {{\n{RATE_LIMIT_CODE}')
        else:
            # Add after function declaration
            match = re.search(r'(export async function (?:GET|POST|PATCH|DELETE)[^{]+\{\n)', content)
            if match:
                content = content.replace(match.group(1), f'{match.group(1)}{RATE_LIMIT_CODE}')

        # Save
        with open(api_path, 'w', encoding='utf-8') as f:
            f.write(content)

        print(f"  ✅ {api_path}")
    except Exception as e:
        print(f"  ❌ {api_path} - {e}")

print("\n✅ Concluído!")
