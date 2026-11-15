"""Ajoute les captures d'écran au rapport Word existant."""
import sys
sys.stdout.reconfigure(encoding='utf-8')

from docx import Document
from docx.shared import Pt, Inches, Cm, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT
import os

BUREAU = "C:/Users/DELL/OneDrive/Bureau"
OUTPUT = os.path.join(BUREAU, "Memoire", "Rapport_Technique_SunuBot_Actualise.docx")

doc = Document(OUTPUT)

# ── Style utilitaire ──
def titre(text, level=1):
    h = doc.add_heading(text, level=level)
    for run in h.runs:
        run.font.color.rgb = RGBColor(0, 0, 0)
    return h

def para(text, bold_start=None):
    p = doc.add_paragraph()
    p.paragraph_format.line_spacing = 1.5
    if bold_start:
        run_b = p.add_run(bold_start)
        run_b.bold = True
        p.add_run(text)
    else:
        p.add_run(text)
    return p

def ajouter_capture(chemin, legende):
    """Ajoute une image centrée avec légende."""
    fichier = os.path.join(BUREAU, chemin)
    if not os.path.exists(fichier):
        para(f"[Image non trouvée : {chemin}]")
        return

    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    run = p.add_run()
    run.add_picture(fichier, width=Inches(5.5))

    p_leg = doc.add_paragraph()
    p_leg.alignment = WD_ALIGN_PARAGRAPH.CENTER
    run_leg = p_leg.add_run(legende)
    run_leg.italic = True
    run_leg.font.size = Pt(10)
    doc.add_paragraph()


# ══════════════════════════════════════════════════════════════
# ANNEXE : CAPTURES D'ÉCRAN
# ══════════════════════════════════════════════════════════════

doc.add_page_break()

titre("7. Captures d'écran du prototype", level=1)

para(
    "Cette section présente les captures d'écran que j'ai prises lors de mes tests "
    "du 11 novembre 2026. Elles montrent le parcours complet de l'utilisateur, "
    "depuis la connexion jusqu'à la vérification en base de données."
)

# Capture 1 : Login
titre("Page de connexion", level=2)
para(
    "Voici la page d'accueil du chatbot. Le citoyen doit s'authentifier "
    "avec son email et mot de passe pour accéder au service."
)
ajouter_capture("capture1_login.png", "Figure 1 — Page de connexion de SunuBot")

# Capture 2 : Interface
titre("Interface du chat", level=2)
para(
    "Après connexion, l'utilisateur accède à l'interface de chat. "
    "Il peut écrire son message en français ou en wolof, et choisir "
    "la langue manuellement si besoin."
)
ajouter_capture("capture2_interface.png", "Figure 2 — Interface du chatbot après connexion")

# Capture 3 : Bonjour
titre("Test : salutation en français", level=2)
para(
    "Quand l'utilisateur tape « Bonjour », le chatbot répond avec un message "
    "de bienvenue et liste les services disponibles (état civil, DGID, CNSS, formulaires)."
)
ajouter_capture("capture3_bonjour.png", "Figure 3 — Réponse du chatbot à « Bonjour »")

# Capture 4 : Impôts
titre("Test : question sur les impôts", level=2)
para(
    "Pour la question « Comment payer mes impôts ? », le système détecte l'intention "
    "question_procedure et le domaine dgid. Il affiche les modes de paiement "
    "et les échéances fiscales."
)
ajouter_capture("capture4_impots.png", "Figure 4 — Réponse à « Comment payer mes impôts ? »")

# Capture 5 : Wolof
titre("Test : message en wolof", level=2)
para(
    "Ici j'ai testé avec la salutation wolof « Na nga def ». Le système détecte "
    "automatiquement le wolof et répond dans cette langue. C'est le cœur du projet : "
    "pouvoir servir les citoyens dans leur langue maternelle."
)
ajouter_capture("capture5_wolof.png", "Figure 5 — Réponse en wolof à « Na nga def »")

# Capture 6 : Traces
titre("Traces MCP en JSON", level=2)
para(
    "L'API /api/traces expose les traces MCP de la session en cours. "
    "Chaque trace contient l'échange complet : requête client, analyse NLP, "
    "routage MCP, réponse et enregistrement en base."
)
ajouter_capture("capture6_traces.png", "Figure 6 — Traces MCP au format JSON")

# Capture 7 : pgAdmin
titre("Vérification en base de données", level=2)
para(
    "Dans pgAdmin, on peut voir que chaque conversation est bien enregistrée "
    "dans la table conversation_logs. On y retrouve le message, la langue détectée, "
    "l'intention classifiée et la date."
)
ajouter_capture("pgAdmin avec conversation_logs.png", "Figure 7 — Table conversation_logs dans pgAdmin")


# ══════════════════════════════════════════════════════════════
# SAUVEGARDE
# ══════════════════════════════════════════════════════════════

doc.save(OUTPUT)
print(f"Document mis à jour avec captures : {OUTPUT}")
