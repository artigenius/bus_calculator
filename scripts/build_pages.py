"""Build four portable calculators using only the Python standard library."""
from html import escape
from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[1]
PRODUCT_IDS = ('internship', 'growth', 'evp', 'championship')


def build():
    template = (ROOT / 'src/calculator.template.html').read_text(encoding='utf-8')
    for product_id in PRODUCT_IDS:
        model = (ROOT / f'src/products/{product_id}.js').read_text(encoding='utf-8')
        title = re.search(r"name:'([^']+)'", model)[1]
        description = re.search(r"intro:'([^']+)'", model)[1]
        page = template
        for token, value in {
            '__PRODUCT_ID__': product_id,
            '__PRODUCT_MODEL__': model,
            '__PAGE_TITLE__': escape(title, quote=True),
            '__PAGE_DESCRIPTION__': escape(description, quote=True),
        }.items():
            page = page.replace(token, value)
        (ROOT / f'{product_id}.html').write_text(page, encoding='utf-8')
        print(f'Built {product_id}.html')


if __name__ == '__main__':
    build()
