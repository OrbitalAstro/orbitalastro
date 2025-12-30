#!/usr/bin/env python3
"""Créer un fichier CSV de test avec seulement 2 personnes."""

import csv
from pathlib import Path

source_file = Path(r"C:\Users\isabe\Downloads\Finances - Vision - Mission - Actions - PDF.csv")
test_file = Path("test_2_personnes.csv")

print("📝 Création d'un fichier de test avec 2 personnes...\n")

with open(source_file, 'r', encoding='utf-8') as f:
    reader = csv.DictReader(f)
    fieldnames = reader.fieldnames
    people = list(reader)

# Prendre les 2 premières personnes
test_people = people[:2]

with open(test_file, 'w', encoding='utf-8', newline='') as f:
    writer = csv.DictWriter(f, fieldnames=fieldnames)
    writer.writeheader()
    writer.writerows(test_people)

print(f"✅ Fichier de test créé: {test_file.absolute()}")
print(f"\n👥 Personnes dans le test:")
for i, person in enumerate(test_people, 1):
    print(f"   {i}. {person.get('first_name', 'Inconnu')} - {person.get('city', '')}, {person.get('province', '')}, {person.get('country', '')}")
print(f"\n📋 Prêt pour le test!")




