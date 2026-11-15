"""Script pour générer le rapport technique Word FINAL — Mistral activé."""
import sys
sys.stdout.reconfigure(encoding='utf-8')

from docx import Document
from docx.shared import Pt, Inches, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT
import os

BUREAU = "C:/Users/DELL/OneDrive/Bureau"

doc = Document()

style = doc.styles['Normal']
font = style.font
font.name = 'Times New Roman'
font.size = Pt(12)
style.paragraph_format.space_after = Pt(6)
style.paragraph_format.line_spacing = 1.5

def titre(text, level=1):
    h = doc.add_heading(text, level=level)
    for run in h.runs:
        run.font.color.rgb = RGBColor(0, 0, 0)

def para(text, bold_start=None):
    p = doc.add_paragraph()
    p.paragraph_format.line_spacing = 1.5
    if bold_start:
        p.add_run(bold_start).bold = True
        p.add_run(text)
    else:
        p.add_run(text)

def para_italic(text):
    p = doc.add_paragraph()
    p.paragraph_format.line_spacing = 1.5
    p.add_run(text).italic = True

def add_table(headers, rows):
    table = doc.add_table(rows=1 + len(rows), cols=len(headers))
    table.style = 'Light Grid Accent 1'
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    for i, h in enumerate(headers):
        cell = table.rows[0].cells[i]
        cell.text = h
        for p in cell.paragraphs:
            for run in p.runs:
                run.bold = True
                run.font.size = Pt(10)
    for r_idx, row in enumerate(rows):
        for c_idx, val in enumerate(row):
            cell = table.rows[r_idx + 1].cells[c_idx]
            cell.text = str(val)
            for p in cell.paragraphs:
                for run in p.runs:
                    run.font.size = Pt(10)

def ajouter_capture(chemin, legende):
    fichier = os.path.join(BUREAU, chemin)
    if not os.path.exists(fichier):
        para(f"[Image non trouvée : {chemin}]")
        return
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.add_run().add_picture(fichier, width=Inches(5.5))
    p2 = doc.add_paragraph()
    p2.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r = p2.add_run(legende)
    r.italic = True
    r.font.size = Pt(10)
    doc.add_paragraph()


# ═══════════════════════════════════════════
# PAGE DE GARDE
# ═══════════════════════════════════════════
doc.add_paragraph()
doc.add_paragraph()
p = doc.add_paragraph()
p.alignment = WD_ALIGN_PARAGRAPH.CENTER
p.add_run("UNIVERSITÉ DE THIÈS").bold = True
p.runs[0].font.size = Pt(16)

p = doc.add_paragraph()
p.alignment = WD_ALIGN_PARAGRAPH.CENTER
p.add_run("Master 2 Intelligence Artificielle").font.size = Pt(14)

doc.add_paragraph()
doc.add_paragraph()
p = doc.add_paragraph()
p.alignment = WD_ALIGN_PARAGRAPH.CENTER
r = p.add_run("SunuBot — Rapport technique actualisé")
r.bold = True
r.font.size = Pt(18)

doc.add_paragraph()
p = doc.add_paragraph()
p.alignment = WD_ALIGN_PARAGRAPH.CENTER
r = p.add_run("Chatbot multilingue français/wolof avec MCP\npour les services administratifs sénégalais")
r.font.size = Pt(13)
r.italic = True

doc.add_paragraph()
doc.add_paragraph()
p = doc.add_paragraph()
p.alignment = WD_ALIGN_PARAGRAPH.CENTER
p.add_run("Réalisé par : ")
p.add_run("Adama GAYE").bold = True
doc.add_paragraph()
p = doc.add_paragraph()
p.alignment = WD_ALIGN_PARAGRAPH.CENTER
p.add_run("Novembre 2026")
doc.add_page_break()


# ═══════════════════════════════════════════
# 1. ÉCHANGE MCP RÉEL
# ═══════════════════════════════════════════
titre("1. Échange MCP réel avec traces")

para("Dans cette section, je présente un échange réel entre le client et le serveur MCP. "
     "J'ai mis en place un système de traçage qui enregistre chaque échange au format JSON. "
     "À chaque message envoyé par l'utilisateur, une trace complète est générée automatiquement "
     "avec un identifiant unique.")

para("Ce système me permet de voir exactement ce qui se passe à chaque étape : "
     "l'analyse NLP, le routage vers le bon serveur MCP, et la réponse générée. "
     "C'est aussi très utile pour le débogage.")

titre("Exemple : « Comment payer mes impôts ? »", level=2)

para("Le client envoie une requête POST /api/chat. L'orchestrateur transmet au serveur NLP Python "
     "(FastAPI sur le port 8000) qui utilise mBERT et Mistral pour analyser le message.",
     bold_start="Étape 1 — Réception : ")

para("mBERT classifie rapidement (~100 ms) et Mistral affine l'analyse :", bold_start="Étape 2 — Analyse NLP : ")
doc.add_paragraph("Langue : français (confiance : 0.4)", style='List Bullet')
doc.add_paragraph("Intention : question_procedure", style='List Bullet')
doc.add_paragraph("Domaine : dgid (fiscalité)", style='List Bullet')
doc.add_paragraph("Mode : mBERT + Mistral", style='List Bullet')

para("Le routeur MCP sélectionne le serveur « dgid » et les outils get_centre_fiscal, rechercher_contribuable.",
     bold_start="Étape 3 — Routage MCP : ")

para("La réponse est formatée avec les modes de paiement, échéances et enregistrée en base (table conversation_logs). "
     "Temps total : ~150 ms.",
     bold_start="Étape 4 — Réponse : ")

para_italic("Au total, 44 traces ont été enregistrées lors de mes sessions de test. "
            "Elles sont dans le fichier docs/traces/mcp-traces-2026-11-11.json.")


# ═══════════════════════════════════════════
# 2. TABLEAU D'ESSAIS
# ═══════════════════════════════════════════
titre("2. Tableau d'essais détaillé")

para("J'ai effectué une série de 10 tests le 11 novembre 2026 avec le pipeline complet "
     "(mBERT + Mistral). Pour chaque test, j'ai comparé le résultat attendu au résultat obtenu.")

add_table(
    ["N°", "Message", "Langue", "Intent attendu", "Domaine attendu", "Intent obtenu", "Domaine obtenu", "Résultat"],
    [
        ["1", "Bonjour", "FR", "salutation", "general", "salutation", "general", "PASS"],
        ["2", "Na nga def", "WO", "salutation", "general", "salutation", "general", "PASS"],
        ["3", "Comment payer mes impôts ?", "FR", "question_procedure", "dgid", "question_procedure", "dgid", "PASS"],
        ["4", "Je veux mon acte de naissance", "FR", "demande_document", "etat_civil", "demande_document", "etat_civil", "PASS"],
        ["5", "Dama bëgg sama kàrt bëccëg", "WO", "demande_document", "etat_civil", "demande_document", "etat_civil", "PASS"],
        ["6", "Je veux un NINEA", "FR", "demande_document", "dgid", "demande_document", "dgid", "PASS"],
        ["7", "Où est le bureau des impôts ?", "FR", "question_lieu", "dgid", "question_lieu", "dgid", "PASS"],
        ["8", "Combien coûte l'acte ?", "FR", "question_cout", "etat_civil", "question_cout", "etat_civil", "PASS"],
        ["9", "Je veux m'inscrire CNSS", "FR", "demande_inscription", "cnss", "demande_document", "cnss", "PARTIEL"],
        ["10", "Naka laa feyee sama wàll ?", "WO", "question_procedure", "dgid", "question_delai", "general", "ÉCHEC"],
    ]
)
doc.add_paragraph()

titre("Analyse des résultats", level=2)
para("8 tests sur 10 réussis (80%), 1 partiel et 1 échec. "
     "C'est un résultat honnête que je ne cherche pas à embellir.")

para("Le domaine CNSS est bien détecté, mais l'intention « demande_inscription » est confondue "
     "avec « demande_document ». Le corpus manque d'exemples pour cette intention.",
     bold_start="Test 9 (partiel) : ")

para("La phrase wolof « Naka laa feyee sama wàll ? » (Comment payer mes impôts ?) "
     "est mal classée. Le wolof reste le point faible car mBERT n'a pas été pré-entraîné "
     "sur cette langue. Il faudrait enrichir le corpus wolof.",
     bold_start="Test 10 (échec) : ")


# ═══════════════════════════════════════════
# 3. VERSIONS ET COMMANDES
# ═══════════════════════════════════════════
titre("3. Versions et commandes")

para("Voici les versions exactes vérifiées le jour des tests.")

add_table(
    ["Composant", "Version", "Rôle"],
    [
        ["Windows", "11 Pro (10.0.26300)", "Système d'exploitation"],
        ["Node.js", "v26.13.0", "Runtime frontend"],
        ["Next.js", "15.3.3", "Framework React"],
        ["Python", "3.13.13", "Runtime NLP"],
        ["PostgreSQL", "14.23", "Base de données"],
        ["PyTorch", "2.12.1 (CPU)", "Deep learning"],
        ["Transformers", "5.12.1", "HuggingFace (mBERT)"],
        ["Prisma", "ORM", "Accès base depuis Next.js"],
        ["mBERT", "bert-base-multilingual-cased", "Classification (fine-tuné)"],
        ["Mistral", "mistral-small-latest", "LLM via API cloud"],
    ]
)
doc.add_paragraph()

titre("Commandes de lancement", level=2)
para("PostgreSQL 14 doit tourner (port 5433, base « sunubot »).", bold_start="Prérequis : ")
para("", bold_start="1. Serveur NLP : ")
p = doc.add_paragraph()
r = p.add_run("cd prototype/nlp/src\npython -m uvicorn api:app --host 0.0.0.0 --port 8000")
r.font.name = 'Consolas'
r.font.size = Pt(10)

para("", bold_start="2. Frontend : ")
p = doc.add_paragraph()
r = p.add_run("cd prototype/frontend\nnpx next dev -p 5001")
r.font.name = 'Consolas'
r.font.size = Pt(10)

para("http://localhost:5001", bold_start="3. URL : ")
para("moussa.diop@example.com / password123", bold_start="4. Compte test : ")


# ═══════════════════════════════════════════
# 4. RÔLE DE mBERT
# ═══════════════════════════════════════════
titre("4. Rôle précis de mBERT")

titre("Pourquoi mBERT ?", level=2)
para("mBERT (multilingual BERT) est un modèle de langage de Google, pré-entraîné sur 104 langues. "
     "J'ai choisi ce modèle parce que notre chatbot doit comprendre le français et le wolof. "
     "Même si le wolof n'est pas dans les 104 langues, le fine-tuning sur notre corpus bilingue "
     "permet de capturer certains patterns.")

titre("Fonctions dans SunuBot", level=2)
doc.add_paragraph("Classification d'intention : déterminer ce que veut l'utilisateur "
                   "(demande_document, question_procedure, etc.) parmi 8 classes.", style='List Bullet')
doc.add_paragraph("Détection de domaine : identifier le service concerné "
                   "(état civil, DGID, CNSS) pour router vers le bon serveur MCP.", style='List Bullet')

titre("Fine-tuning", level=2)
para("J'ai fine-tuné bert-base-multilingual-cased sur un corpus de 160 phrases bilingues. "
     "Le modèle est sauvegardé dans nlp/models/mbert_finetuned/.")

titre("Jeu de test annoté", level=2)
para("Voici les performances de mBERT seul vs mBERT + correction par règles :")

add_table(
    ["N°", "Texte", "Langue", "Intention correcte", "mBERT brut", "Après correction"],
    [
        ["1", "Bonjour", "FR", "salutation", "salutation", "salutation"],
        ["2", "Na nga def", "WO", "salutation", "inscription", "salutation"],
        ["3", "Je veux mon acte de naissance", "FR", "demande_document", "demande_document", "demande_document"],
        ["4", "Dama bëgg sama kàrt bëccëg", "WO", "demande_document", "demande_document", "demande_document"],
        ["5", "Comment payer mes impôts ?", "FR", "question_procedure", "inscription", "question_procedure"],
        ["6", "Où est le bureau des impôts ?", "FR", "question_lieu", "question_lieu", "question_lieu"],
        ["7", "Combien coûte l'acte ?", "FR", "question_cout", "question_cout", "question_cout"],
        ["8", "Je veux un NINEA", "FR", "demande_document", "salutation", "demande_document"],
        ["9", "Naka laa feyee sama wàll ?", "WO", "question_procedure", "question_delai", "question_delai"],
        ["10", "Inscrire CNSS", "FR", "demande_inscription", "demande_document", "demande_document"],
    ]
)
doc.add_paragraph()
para("Précision mBERT brut : 5/10 (50%)", bold_start="")
para("Précision après correction par règles : 8/10 (80%)", bold_start="")
para("La correction par règles exploite les mots-clés du message pour compenser "
     "les erreurs les plus fréquentes du modèle, surtout sur le wolof.")

titre("Limites", level=2)
doc.add_paragraph("Le wolof n'est pas dans les langues de pré-entraînement de mBERT.", style='List Bullet')
doc.add_paragraph("Le corpus de 160 entrées est petit (idéalement 500-1000).", style='List Bullet')
doc.add_paragraph("Les variantes orthographiques wolof perturbent le tokenizer.", style='List Bullet')


# ═══════════════════════════════════════════
# 5. MODE D'APPEL MISTRAL
# ═══════════════════════════════════════════
titre("5. Mode d'appel à Mistral")

para("Mistral est appelé via l'API cloud de Mistral AI (pas en local).")
para("mistral-small-latest", bold_start="Modèle : ")
para("API REST via le SDK Python mistralai", bold_start="Mode d'appel : ")
para("https://api.mistral.ai", bold_start="Endpoint : ")
para("Variable MISTRAL_API_KEY dans le fichier .env", bold_start="Authentification : ")

titre("Rôle dans le pipeline", level=2)
para("mBERT fait la classification rapide (~100 ms) et Mistral fait l'analyse fine "
     "et la génération de réponse (500 ms à 2 s). Les deux travaillent ensemble.")

add_table(
    ["Mode", "Modèles", "Précision", "Temps"],
    [
        ["1. Complet", "mBERT + Mistral", "Haute", "1-2 s"],
        ["2. Mistral seul", "Mistral API", "Bonne", "1-2 s"],
        ["3. mBERT seul", "mBERT local", "Moyenne (80%)", "~100 ms"],
        ["4. Fallback", "TF-IDF + règles", "Basique", "~10 ms"],
    ]
)
doc.add_paragraph()
para("Lors de mes tests du 11 novembre 2026, le système fonctionnait en mode 1 (mBERT + Mistral).")


# ═══════════════════════════════════════════
# 6. ARCHITECTURE + PARCOURS
# ═══════════════════════════════════════════
titre("6. Architecture et parcours complet")

titre("Vue d'ensemble", level=2)
doc.add_paragraph("Le frontend (Next.js, port 5001) : interface chat, authentification, formulaires.", style='List Bullet')
doc.add_paragraph("Le backend NLP (FastAPI, port 8000) : mBERT + Mistral pour l'analyse.", style='List Bullet')
doc.add_paragraph("La base de données (PostgreSQL 14, port 5433) : comptes, conversations, demandes.", style='List Bullet')

titre("Parcours d'une demande d'acte de naissance", level=2)
etapes = [
    "Le citoyen ouvre http://localhost:5001 dans son navigateur.",
    "Il se connecte avec son email et mot de passe.",
    "Il tape : « Je veux mon acte de naissance ».",
    "Le frontend envoie POST /api/chat au serveur.",
    "L'API transmet au serveur NLP Python (POST /analyser, port 8000).",
    "mBERT classifie : intention = demande_document, domaine = etat_civil.",
    "Mistral affine l'analyse et extrait les entités.",
    "Le routeur MCP sélectionne le serveur « etat-civil » et les outils.",
    "La réponse est construite (pièces requises, coût 200 FCFA, délai 3-5 jours).",
    "La conversation est enregistrée dans PostgreSQL (table conversation_logs).",
    "Une trace MCP JSON est générée avec un identifiant unique.",
    "La réponse s'affiche dans le chat.",
    "Le citoyen peut remplir le formulaire de demande.",
    "La demande est soumise et un numéro de suivi (DEM-xxx) est attribué.",
]
for i, etape in enumerate(etapes, 1):
    p = doc.add_paragraph()
    p.add_run(f"{i}. ").bold = True
    p.add_run(etape)


# ═══════════════════════════════════════════
# SCHÉMA D'ARCHITECTURE
# ═══════════════════════════════════════════
doc.add_page_break()
titre("Schéma d'architecture", level=2)
para("Le schéma ci-dessous montre l'architecture complète de SunuBot "
     "avec les trois couches et les 4 serveurs MCP.")

schema_path = os.path.join(BUREAU, "Memoire", "schema_architecture_sunubot.png")
if os.path.exists(schema_path):
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.add_run().add_picture(schema_path, width=Inches(6.0))
    p2 = doc.add_paragraph()
    p2.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r = p2.add_run("Figure 8 — Architecture globale de SunuBot")
    r.italic = True
    r.font.size = Pt(10)


# ═══════════════════════════════════════════
# 7. CAPTURES D'ÉCRAN
# ═══════════════════════════════════════════
doc.add_page_break()
titre("7. Captures d'écran du prototype")
para("Ces captures ont été prises lors de mes tests du 11 novembre 2026.")

captures = [
    ("capture1_login.png", "Page de connexion", "Figure 1 — Page de connexion de SunuBot",
     "Le citoyen s'authentifie avec son email et mot de passe."),
    ("capture2_interface.png", "Interface du chat", "Figure 2 — Interface après connexion",
     "Après connexion, l'utilisateur accède au chat bilingue."),
    ("capture3_bonjour.png", "Réponse à « Bonjour »", "Figure 3 — Réponse à « Bonjour »",
     "Le chatbot répond avec la liste des services disponibles."),
    ("capture4_impots.png", "Question sur les impôts", "Figure 4 — Réponse fiscalité DGID",
     "Le système détecte le domaine DGID et affiche les modes de paiement."),
    ("capture5_wolof.png", "Message en wolof", "Figure 5 — Réponse en wolof",
     "Le système détecte le wolof et répond dans cette langue."),
    ("capture6_traces.png", "Traces MCP", "Figure 6 — Traces MCP en JSON",
     "L'API /api/traces montre les échanges client-serveur enregistrés."),
    ("pgAdmin avec conversation_logs.png", "Base de données", "Figure 7 — Table conversation_logs",
     "Dans pgAdmin, chaque conversation est bien enregistrée en base."),
]

for filename, section_title, legend, description in captures:
    titre(section_title, level=2)
    para(description)
    ajouter_capture(filename, legend)


# ═══════════════════════════════════════════
# FICHIERS DE PREUVES
# ═══════════════════════════════════════════
doc.add_page_break()
titre("Fichiers de preuves")
add_table(
    ["Fichier", "Contenu"],
    [
        ["docs/traces/mcp-traces-2026-11-11.json", "44 traces MCP réelles"],
        ["docs/traces/essai-parcours-demande-2026-11-02.json", "Parcours de demande vérifié"],
        ["nlp/models/mbert_finetuned/", "Modèle mBERT fine-tuné"],
        ["nlp/data/corpus_wolof_admin.json", "Corpus de 160 entrées bilingues"],
    ]
)


# ═══════════════════════════════════════════
# SAUVEGARDE
# ═══════════════════════════════════════════
output = os.path.join(BUREAU, "Memoire", "Rapport_Technique_SunuBot_Actualise.docx")
doc.save(output)
print(f"Document FINAL sauvegardé : {output}")
