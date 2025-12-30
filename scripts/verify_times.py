#!/usr/bin/env python3
"""Vérifier que toutes les heures sont présentes dans le CSV."""

import csv
from pathlib import Path

csv_file = Path(r"C:\Users\isabe\Downloads\Finances - Vision - Mission - Actions - PDF.csv")

print("🔍 Vérification des heures dans le fichier CSV\n")

with open(csv_file, 'r', encoding='utf-8') as f:
    reader = csv.DictReader(f)
    people = list(reader)

print(f"📊 Total de personnes: {len(people)}\n")

# Vérifier les heures
missing_times = []
for i, person in enumerate(people, 1):
    birth_time = person.get('birth:_time', '').strip() or person.get('birth_time', '').strip()
    if not birth_time:
        missing_times.append((i, person.get('first_name', 'Inconnu')))

if missing_times:
    print(f"⚠️  {len(missing_times)} personne(s) sans heure:")
    for line_num, name in missing_times:
        print(f"   Ligne {line_num + 1}: {name}")
else:
    print("✅ Toutes les personnes ont une heure!")
    print("\n📋 Exemples d'heures trouvées:")
    for i, person in enumerate(people[:5], 1):
        birth_time = person.get('birth:_time', '').strip() or person.get('birth_time', '').strip()
        print(f"   {person.get('first_name', 'Inconnu')}: {birth_time}")




