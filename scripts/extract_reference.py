"""Read cached Excel results and hyperlinks; never recalculate or edit the source."""
import json
from pathlib import Path
from zipfile import ZipFile
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / 'source_files/3_2026_financial_benefits.xlsx'
SHEET = 'Эконом. эффективность 2026 '
NS = {'m': 'http://schemas.openxmlformats.org/spreadsheetml/2006/main'}
REL = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships'


def extract():
    with ZipFile(SOURCE) as archive:
        workbook = ET.fromstring(archive.read('xl/workbook.xml'))
        sheet = next(s for s in workbook.find('m:sheets', NS) if s.attrib['name'] == SHEET)
        relations = {r.attrib['Id']: r.attrib['Target'] for r in
                     ET.fromstring(archive.read('xl/_rels/workbook.xml.rels'))}
        target = relations[sheet.attrib[f'{{{REL}}}id']]
        target = target.lstrip('/') if target.startswith('/') else 'xl/' + target
        xml = ET.fromstring(archive.read(target))
        cells = {}
        for cell in xml.findall('.//m:sheetData/m:row/m:c', NS):
            address = cell.attrib['r']
            if not address.startswith('B') or not address[1:].isdigit() or int(address[1:]) > 181:
                continue
            value = cell.find('m:v', NS)
            if value is None or cell.attrib.get('t', 'n') != 'n':
                continue
            formula = cell.find('m:f', NS)
            cells[address] = {'value': float(value.text),
                              'formula': '=' + formula.text if formula is not None and formula.text else None}
            if formula is not None and formula.attrib:
                cells[address]['formulaAttributes'] = formula.attrib
        sheet_path = Path(target)
        relpath = str(sheet_path.parent / '_rels' / (sheet_path.name + '.rels'))
        links_by_id = {r.attrib['Id']: r.attrib['Target'] for r in
                       ET.fromstring(archive.read(relpath))}
        links = {link.attrib['ref']: links_by_id[link.attrib[f'{{{REL}}}id']]
                 for link in xml.findall('m:hyperlinks/m:hyperlink', NS)
                 if f'{{{REL}}}id' in link.attrib}
    output = {'source': SOURCE.name, 'originalName': '2026-Финансовая выгода для клиентов .xlsx',
              'sheet': SHEET, 'cells': cells, 'links': links}
    (ROOT / 'source_files/model-2026-reference.json').write_text(
        json.dumps(output, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    print(f'Extracted {len(cells)} numeric cells and {len(links)} hyperlinks from {SHEET!r}')


if __name__ == '__main__':
    extract()
