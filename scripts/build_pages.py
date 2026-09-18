"""Build four portable calculators using only the Python standard library."""
from html import escape
import json
from pathlib import Path
import re
from zipfile import ZipFile, ZIP_DEFLATED

ROOT = Path(__file__).resolve().parents[1]
PRODUCT_IDS = ('internship', 'growth', 'evp', 'certification')
SOURCE_LINKS = {
    'internship': {'e2': ['C17'], 'e3': ['C26', 'C28']},
    'growth': {'e1': ['C49'], 'e2': ['C59'], 'e3': ['C65'], 'e4': ['C72']},
    'evp': {'e1': ['C97'], 'e2': ['C103'], 'e3': ['C115']},
    'certification': {'e1': ['C146', 'C148'], 'e3': ['C166'], 'e4': ['C162', 'C163']},
}


def build():
    template = (ROOT / 'src/calculator.template.html').read_text(encoding='utf-8')
    reference = json.loads((ROOT / 'source_files/model-2026-reference.json').read_text(encoding='utf-8'))
    for product_id in PRODUCT_IDS:
        model = (ROOT / f'src/products/{product_id}.js').read_text(encoding='utf-8')
        title = re.search(r"name:'([^']+)'", model)[1]
        description = re.search(r"intro:'([^']+)'", model)[1]
        links = {effect: [reference['links'][cell] for cell in cells]
                 for effect, cells in SOURCE_LINKS[product_id].items()}
        model += '\nPRODUCTS.' + product_id + '.sourceLinks = ' + json.dumps(links) + ';\n'
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
    # The former fourth product has been replaced by certification.
    (ROOT / 'championship.html').write_text('''<!doctype html>
<html lang="ru"><head><meta charset="utf-8">
<meta http-equiv="refresh" content="0;url=certification.html">
<title>Сертификация</title></head><body>
<p>Четвёртый продукт обновлён: <a href="certification.html">Сертификация</a>.</p>
</body></html>''', encoding='utf-8')
    with ZipFile(ROOT / 'calculators-standalone.zip', 'w', ZIP_DEFLATED) as archive:
        for product_id in PRODUCT_IDS:
            archive.write(ROOT / f'{product_id}.html', f'{product_id}.html')
        archive.writestr('README.txt', 'Калькуляторы Changellenge >>\n\n'
                         'Откройте нужный HTML-файл в браузере. Интернет не требуется.\n'
                         'internship.html — Стажировки\ngrowth.html — Кейс-чемпионат для сотрудников\n'
                         'evp.html — EVP (разработка и активация)\ncertification.html — Сертификация\n'
                         'Допущения и особенности расчётов указаны на страницах.\n')


if __name__ == '__main__':
    build()
