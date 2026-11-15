"""Ajoute le schéma d'architecture au document Word."""
import sys
sys.stdout.reconfigure(encoding='utf-8')

from docx import Document
from docx.shared import Pt, Inches, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
import os

BUREAU = "C:/Users/DELL/OneDrive/Bureau"
OUTPUT = os.path.join(BUREAU, "Memoire", "Rapport_Technique_SunuBot_Actualise.docx")
SCHEMA = os.path.join(BUREAU, "Memoire", "schema_architecture_sunubot.png")

doc = Document(OUTPUT)

# Trouver la section 6 (architecture) et ajouter le schéma après le texte existant
# On ajoute une nouvelle page avec le schéma
doc.add_page_break()

h = doc.add_heading("Schéma d'architecture (vue graphique)", level=2)
for run in h.runs:
    run.font.color.rgb = RGBColor(0, 0, 0)

p = doc.add_paragraph()
p.paragraph_format.line_spacing = 1.5
p.add_run(
    "Le schéma ci-dessous présente l'architecture complète de SunuBot. "
    "On y voit les trois couches principales (interface, traitement NLP, données) "
    "ainsi que les 4 serveurs MCP qui gèrent chacun un domaine administratif."
)

# Ajouter l'image
p = doc.add_paragraph()
p.alignment = WD_ALIGN_PARAGRAPH.CENTER
run = p.add_run()
run.add_picture(SCHEMA, width=Inches(6.0))

# Légende
p_leg = doc.add_paragraph()
p_leg.alignment = WD_ALIGN_PARAGRAPH.CENTER
run_leg = p_leg.add_run("Figure 8 — Architecture globale de SunuBot")
run_leg.italic = True
run_leg.font.size = Pt(10)

doc.save(OUTPUT)
print(f"Schéma ajouté au document : {OUTPUT}")
