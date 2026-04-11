#!/usr/bin/env python3
# SPDX-License-Identifier: AGPL-3.0-only

import csv

csv_file = r"C:\Users\isabe\Downloads\Finances - Vision - Mission - Actions - PDF.csv"

with open(csv_file, 'r', encoding='utf-8') as f:
    reader = csv.DictReader(f)
    people = list(reader)

print("🔍 Vérification de Drummondville:\n")
drummond_people = [p for p in people if 'drummond' in p.get('city', '').lower()]

if drummond_people:
    print(f"✅ {len(drummond_people)} personne(s) trouvée(s) avec Drummondville:")
    for p in drummond_people:
        print(f"   - {p.get('first_name', 'Inconnu')}: {p.get('city', '')}, {p.get('province', '')}, {p.get('country', '')}")
else:
    print("ℹ️  Aucune personne avec Drummondville trouvée")




