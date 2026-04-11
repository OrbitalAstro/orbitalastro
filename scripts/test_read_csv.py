#!/usr/bin/env python3
# SPDX-License-Identifier: AGPL-3.0-only

"""Script de test pour vérifier la lecture du fichier CSV."""

import csv
from pathlib import Path

csv_file = Path(r"C:\Users\isabe\Downloads\Finances - Vision - Mission - Actions - PDF.csv")

print("🔍 Test de lecture du fichier CSV\n")
print(f"📁 Fichier: {csv_file}\n")

# Essayer différents encodages
encodings = ['utf-8', 'utf-8-sig', 'latin-1', 'cp1252', 'iso-8859-1']
encoding_used = None

for encoding in encodings:
    try:
        with open(csv_file, 'r', encoding=encoding) as f:
            reader = csv.DictReader(f)
            first_row = next(reader)
            encoding_used = encoding
            print(f"✅ Encodage détecté: {encoding}\n")
            break
    except:
        continue

if not encoding_used:
    print("❌ Impossible de lire le fichier")
    exit(1)

# Lire toutes les données
with open(csv_file, 'r', encoding=encoding_used) as f:
    reader = csv.DictReader(f)
    
    print("📋 Colonnes détectées:")
    print(f"   {', '.join(reader.fieldnames)}\n")
    
    people = []
    for i, row in enumerate(reader, 1):
        # Normaliser l'heure (gérer les variations de nom de colonne)
        birth_time_raw = (
            row.get('birth_time', '').strip() or 
            row.get('birth:_time', '').strip() or  # Avec deux-points
            row.get('birt:_time', '').strip() or 
            row.get('birt_time', '').strip()
        )
        
        person = {
            'first_name': row.get('first_name', '').strip(),
            'birth_date': row.get('birth_date', '').strip(),
            'birth_time': birth_time_raw,
            'city': row.get('city', '').strip(),
            'province': row.get('province', '').strip(),
            'country': row.get('country', '').strip(),
        }
        people.append(person)
        
        # Afficher les 5 premières pour vérification
        if i <= 5:
            print(f"👤 Personne {i}:")
            print(f"   Nom: {person['first_name']}")
            print(f"   Date: {person['birth_date']}")
            print(f"   Heure: {person['birth_time']}")
            print(f"   Lieu: {person['city']}, {person['province']}, {person['country']}")
            print()

print(f"✅ Total: {len(people)} personnes trouvées\n")

# Vérifier les données
errors = []
for i, person in enumerate(people, 1):
    if not person['first_name']:
        errors.append(f"Personne {i}: Nom manquant")
    if not person['birth_date']:
        errors.append(f"Personne {i}: Date manquante")
    if not person['birth_time']:
        errors.append(f"Personne {i}: Heure manquante")
    if not person['city']:
        errors.append(f"Personne {i}: Ville manquante")
    if not person['country']:
        errors.append(f"Personne {i}: Pays manquant")

if errors:
    print("⚠️  Erreurs détectées:")
    for error in errors:
        print(f"   {error}")
else:
    print("✅ Toutes les données sont valides!")

