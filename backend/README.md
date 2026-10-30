# Ideal Quality Engineers (I) Pvt. Ltd. (IQE) — Third-Party Inspection (TPI) Forms Module

This module implements the end-to-end lifecycle and pixel-matched PDF generation for the four controlled inspection documents of Ideal Quality Engineers (I) Pvt. Ltd.:

| Form No. | Form Title | Subtitle | Header Sub-line | Pages |
|---|---|---|---|---|
| **IQE-TP-02** | FLASH INSPECTION REPORT | Preliminary communication of inspection outcome and key observations | Third Party Inspection Services | 2 |
| **IQE-TP-03** | INSPECTION VISIT REPORT | Issued by Ideal Quality Engineers (I) Pvt. Ltd. | Third Party Inspection Services | 3 |
| **IQE-TP-04** | INSPECTION RELEASE NOTE (IRN) | Formal release of inspected items for dispatch, subject to the conditions stated herein. | Third Party Inspection Services | 2 |
| **IQE-TP-05** | EXPEDITING VISIT REPORT | Supplier progress, schedule, materials, manufacturing and action follow-up report | Third Party Inspection & Expediting Services | 3 |

---

## 1. Design & PDF Specifications

- **Page Size**: US Letter (8.5 in × 11.0 in, 612 pt × 792 pt portrait).
- **Margins**:
  - `TP-02`: 0.45 in all sides.
  - `TP-03`: 0.55 in all sides.
  - `TP-04` & `TP-05`: 0.55 in top/bottom, 0.50 in left/right.
- **Typography**:
  - Base body font: **Arial** embedded via `@font-face` from `backend/app/pdf/fonts/`.
  - Checkbox glyphs (`☐` U+2610, `☒` U+2612) rendered via **DejaVu Sans** fallback to eliminate tofu characters.
  - Form font sizes: TP-02 (7 pt), TP-03 (8.5 pt), TP-04 (8 pt), TP-05 (7.5 pt).
  - Section headings: Arial Bold `#365F91`, uppercase, with `page-break-after: avoid`.
- **Table Grid**:
  - 0.5 pt solid black borders (`#000000`).
  - Label cells / header rows shaded with `#D9E2F3` light blue.
  - Cell padding: 0 top/bottom, 0.075 in left/right.
- **Running Headers & Footers**:
  - Full-width two-column table running header on every page.
  - Dynamic page counter: `IQE-TP-0X | Rev. 00 | Controlled Document | Page N of M`.

---

## 2. Running Locally

### Backend (FastAPI)
```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

# Run database seed
PYTHONPATH=. python seed_tpi_samples.py

# Start uvicorn server
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

#### Demo data for the execution spine

The people, work-package, assignment, certification, billing and reporting
screens start empty. `seed_spine_demo.py` fills them with a coherent set — 4
jobs, 13 people across every category (inspectors, surveyors, site labour,
admin, HR, IT), 14 work packages spread deliberately across the lifecycle, 4
certifications, 2 invoices, and the exception rows each screen needs (one
package running late, one certification disputed, one invoice 27 days overdue,
one authorization awaiting the Technical Manager's decision, two credentials
inside the 60-day lapse horizon).

```bash
cd backend
PYTHONPATH=. python scripts/seed_spine_demo.py          # seed
PYTHONPATH=. python scripts/seed_spine_demo.py --wipe   # remove only what it seeded
```

Idempotent — running it twice changes nothing. `--wipe` deletes only the
records it created, so it is safe on a database you are also using by hand. It
refuses to run against a database whose name looks like production unless you
pass `--force`. `tests/test_seed_spine_demo.py` executes the script itself
against an in-memory MongoDB, so the seeder is covered by the suite rather than
trusted.

#### Verifying against a real MongoDB

Everything in `tests/` runs against mongomock, which needs no server but is not
MongoDB: it does not enforce indexes, and it has no real concurrency, so a race
cannot appear there. One command checks what the suite structurally cannot:

```bash
PYTHONPATH=. python scripts/verify_against_real_db.py
```

It uses a scratch database (`<your db>__verify`) and drops it afterwards, so it
never touches real data. It checks that declared indexes exist, that identifier
allocation stays unique under concurrent creates, that the `$regex` selections
the migration and `--wipe` paths rely on match only the records they should,
that certification money survives a BSON round trip unchanged, and that the
dashboards' aggregations run on a real server. Exit code 0 means everything the
sandbox could not prove now holds on yours.

#### Migrating the legacy verticals

```bash
PYTHONPATH=. python scripts/migrate_verticals.py --only tpi   # dry run, writes nothing
PYTHONPATH=. python scripts/migrate_verticals.py --only tpi --apply
```

Dry run by default, idempotent, and read-only against the legacy collections —
see `SOW_EXECUTION_ARCHITECTURE.md` open decision 1 before the first real run.

### Frontend (Next.js)
```bash
cd apps/web
npm install
npm run dev
```

---

## 3. Running Acceptance Tests

Run the full pytest suite covering business logic, validation rules, and PDF acceptance:
```bash
cd backend
PYTHONPATH=. pytest tests/test_tpi_business_logic.py tests/test_tpi_pdf_acceptance.py -v
```

### Regenerating Reference Images for Visual Regression
To rasterize PDFs at 100 DPI for comparison:
```bash
python -c '
import pymupdf

forms = ["TP02", "TP03", "TP04", "TP05"]
for code in forms:
    doc = pymupdf.open(f"tests/reference/IQE-{code[:2]}-{code[2:]}_*.pdf")
    for i, page in enumerate(doc):
        pix = page.get_pixmap(dpi=100)
        pix.save(f"tests/reference/{code}_page_{i+1}.png")
'
```

---

## 4. Docker Deployment

A production-ready Dockerfile is provided in `backend/Dockerfile` with all required C libraries (`libpango`, `libcairo`, `libgdk-pixbuf`) and embedded fonts (`fonts-dejavu-core`, `fonts-liberation`, `fontconfig`):

```bash
cd backend
docker build -t iqe-backend:latest .
docker run -p 8000:8000 iqe-backend:latest
```
