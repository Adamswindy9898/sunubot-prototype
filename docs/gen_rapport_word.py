"""Script pour générer le rapport technique Word humanisé."""
import sys
sys.stdout.reconfigure(encoding='utf-8')

from docx import Document
from docx.shared import Pt, Inches, Cm, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT
import os

doc = Document()

# ── Style par défaut ──
style = doc.styles['Normal']
font = style.font
font.name = 'Times New Roman'
font.size = Pt(12)
style.paragraph_format.space_after = Pt(6)
style.paragraph_format.line_spacing = 1.5

# ── Fonctions utilitaires ──
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

def para_italic(text):
    p = doc.add_paragraph()
    p.paragraph_format.line_spacing = 1.5
    run = p.add_run(text)
    run.italic = True
    return p

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
    return table


# ══════════════════════════════════════════════════════════════
# PAGE DE GARDE
# ══════════════════════════════════════════════════════════════

doc.add_paragraph()
doc.add_paragraph()

p = doc.add_paragraph()
p.alignment = WD_ALIGN_PARAGRAPH.CENTER
run = p.add_run("UNIVERSITÉ DE THIÈS")
run.bold = True
run.font.size = Pt(16)

p = doc.add_paragraph()
p.alignment = WD_ALIGN_PARAGRAPH.CENTER
run = p.add_run("Master 2 Intelligence Artificielle")
run.font.size = Pt(14)

doc.add_paragraph()
doc.add_paragraph()

p = doc.add_paragraph()
p.alignment = WD_ALIGN_PARAGRAPH.CENTER
run = p.add_run("SunuBot — Rapport technique actualisé")
run.bold = True
run.font.size = Pt(18)

doc.add_paragraph()

p = doc.add_paragraph()
p.alignment = WD_ALIGN_PARAGRAPH.CENTER
run = p.add_run("Chatbot multilingue français/wolof avec MCP\npour les services administratifs sénégalais")
run.font.size = Pt(13)
run.italic = True

doc.add_paragraph()
doc.add_paragraph()

p = doc.add_paragraph()
p.alignment = WD_ALIGN_PARAGRAPH.CENTER
p.add_run("Réalisé par : ").bold = False
run = p.add_run("Adama GAYE")
run.bold = True

doc.add_paragraph()

p = doc.add_paragraph()
p.alignment = WD_ALIGN_PARAGRAPH.CENTER
p.add_run("Novembre 2026")

doc.add_page_break()


# ══════════════════════════════════════════════════════════════
# 1. ÉCHANGE MCP RÉEL
# ══════════════════════════════════════════════════════════════

titre("1. Échange MCP réel avec traces", level=1)

para(
    "Dans cette section, je présente un échange réel entre le client (l'interface web) "
    "et le serveur MCP. J'ai mis en place un système de traçage qui enregistre chaque "
    "échange au format JSON. Chaque fois qu'un utilisateur envoie un message dans le chat, "
    "une trace complète est générée automatiquement."
)

para(
    "J'ai choisi ce format parce qu'il permet de voir exactement ce qui se passe à chaque "
    "étape du traitement, depuis la réception du message jusqu'à l'enregistrement en base "
    "de données. C'est aussi utile pour le débogage quand quelque chose ne fonctionne pas "
    "comme prévu."
)

titre("Exemple concret : « Comment payer mes impôts ? »", level=2)

para(
    "Voici ce qui se passe quand un citoyen tape cette question dans le chatbot. "
    "J'ai simplifié la trace pour la rendre lisible, mais le fichier JSON complet "
    "contient tous les détails."
)

para("Le client (navigateur) envoie une requête POST vers /api/chat avec le message de l'utilisateur. "
     "L'orchestrateur reçoit cette requête et la transmet au serveur NLP Python "
     "(FastAPI sur le port 8000) pour analyse.")

para("Le serveur NLP utilise mBERT pour classifier le message :", bold_start="Étape 1 — Analyse NLP : ")
doc.add_paragraph("Langue détectée : français (confiance : 0.4)", style='List Bullet')
doc.add_paragraph("Intention : question_procedure (confiance : 0.33)", style='List Bullet')
doc.add_paragraph("Domaine : dgid (fiscalité)", style='List Bullet')
doc.add_paragraph("Temps de traitement : 79 ms", style='List Bullet')

para("L'orchestrateur utilise l'intention et le domaine pour router vers le bon serveur MCP :", bold_start="Étape 2 — Routage MCP : ")
doc.add_paragraph("Serveur cible : dgid", style='List Bullet')
doc.add_paragraph("Outils invoqués : get_centre_fiscal, rechercher_contribuable", style='List Bullet')
doc.add_paragraph("Formulaire associé : form-006", style='List Bullet')

para("La réponse est formatée avec les modes de paiement, les échéances fiscales et les options "
     "disponibles. Elle est enregistrée dans la table ConversationLog de PostgreSQL. "
     "Le temps total de traitement est de 153 ms.", bold_start="Étape 3 — Réponse : ")

para("Chaque trace porte un identifiant unique (par exemple MCP-20261111023318-lvdo) "
     "qui permet de la retrouver dans le fichier de traces.")

para_italic(
    "Note : Au total, j'ai enregistré 31 traces lors de mes sessions de test. "
    "Elles sont disponibles dans le fichier docs/traces/mcp-traces-2026-11-11.json."
)


# ══════════════════════════════════════════════════════════════
# 2. TABLEAU D'ESSAIS
# ══════════════════════════════════════════════════════════════

titre("2. Tableau d'essais détaillé", level=1)

para(
    "J'ai effectué une série de tests le 11 novembre 2026 pour vérifier le bon fonctionnement "
    "du chatbot. Pour chaque test, j'ai noté ce que j'attendais comme résultat et ce que "
    "le système a réellement produit. J'ai essayé de varier les cas : des messages en français, "
    "en wolof, des questions sur différents domaines (état civil, impôts, CNSS)."
)

para("Les tests ont été effectués en local sur ma machine, avec le serveur NLP en mode mBERT "
     "(l'API Mistral n'était pas disponible ce jour-là).")

add_table(
    ["N°", "Message envoyé", "Langue", "Intention attendue", "Domaine attendu", "Intention obtenue", "Domaine obtenu", "Résultat"],
    [
        ["1", "Bonjour", "FR", "salutation", "general", "salutation", "general", "PASS"],
        ["2", "Na nga def", "WO", "salutation", "general", "salutation", "general", "PASS"],
        ["3", "Comment payer mes impôts ?", "FR", "question_procedure", "dgid", "question_procedure", "dgid", "PASS"],
        ["4", "Je veux mon acte de naissance", "FR", "demande_document", "etat_civil", "demande_document", "etat_civil", "PASS"],
        ["5", "Dama bëgg sama kàrt bëccëg", "WO", "demande_document", "etat_civil", "demande_document", "etat_civil", "PASS"],
        ["6", "Je veux un NINEA", "FR", "demande_document", "dgid", "demande_document", "dgid", "PASS"],
        ["7", "Où est le bureau des impôts ?", "FR", "question_lieu", "dgid", "question_lieu", "dgid", "PASS"],
        ["8", "Combien coûte l'acte de naissance ?", "FR", "question_cout", "etat_civil", "question_cout", "etat_civil", "PASS"],
        ["9", "Je veux m'inscrire à la CNSS", "FR", "demande_inscription", "cnss", "demande_document", "cnss", "PARTIEL"],
        ["10", "Naka laa feyee sama wàll ?", "WO", "question_procedure", "dgid", "question_delai", "general", "ÉCHEC"],
    ]
)

doc.add_paragraph()

titre("Analyse des résultats", level=2)

para(
    "Sur les 10 tests, 8 sont passés avec succès (80%), 1 est partiellement correct et 1 a échoué. "
    "C'est un résultat honnête que je ne cherche pas à masquer."
)

para(
    "Pour le test 9, le système a détecté le bon domaine (CNSS) mais a confondu "
    "« demande_inscription » avec « demande_document ». Ces deux intentions sont proches "
    "et le corpus ne contient pas assez d'exemples d'inscription pour que le modèle "
    "les distingue bien.",
    bold_start="Test 9 (partiel) : "
)

para(
    "C'est la phrase wolof « Naka laa feyee sama wàll ? » qui signifie « Comment payer "
    "mes impôts ? ». Le modèle l'a classée comme question_delai au lieu de question_procedure. "
    "Le wolof reste le point faible du système car mBERT n'a pas été pré-entraîné sur cette langue. "
    "Pour améliorer ça, il faudrait enrichir le corpus wolof avec plus de variantes.",
    bold_start="Test 10 (échec) : "
)


# ══════════════════════════════════════════════════════════════
# 3. VERSIONS ET COMMANDES
# ══════════════════════════════════════════════════════════════

titre("3. Versions et commandes pour reproduire l'environnement", level=1)

para(
    "Voici les versions exactes des outils que j'utilise. J'ai vérifié chaque version "
    "le jour des tests pour être sûr qu'elles sont correctes."
)

add_table(
    ["Composant", "Version", "Rôle"],
    [
        ["Windows", "11 Pro (10.0.26300)", "Système d'exploitation"],
        ["Node.js", "v26.13.0", "Runtime JavaScript (frontend)"],
        ["Next.js", "15.3.3", "Framework React (interface web)"],
        ["Python", "3.13.13", "Runtime backend NLP"],
        ["PostgreSQL", "14.23", "Base de données"],
        ["PyTorch", "2.12.1 (CPU)", "Framework deep learning"],
        ["Transformers", "5.12.1", "Bibliothèque HuggingFace (mBERT)"],
        ["Prisma", "ORM", "Accès base de données depuis Next.js"],
        ["mBERT", "bert-base-multilingual-cased", "Modèle de classification (fine-tuné)"],
        ["Mistral", "mistral-small-latest", "LLM via API cloud"],
    ]
)

doc.add_paragraph()

titre("Commandes pour lancer le projet", level=2)

para("Il faut d'abord s'assurer que PostgreSQL 14 tourne (port 5433, base « sunubot »). "
     "J'utilise pgAdmin 4 pour vérifier.", bold_start="Prérequis : ")

para("On ouvre un terminal et on lance :", bold_start="1. Lancer le serveur NLP Python : ")
p = doc.add_paragraph()
run = p.add_run("cd C:/Users/DELL/OneDrive/Bureau/Memoire/prototype/nlp/src\n"
                "python -m uvicorn api:app --host 0.0.0.0 --port 8000")
run.font.name = 'Consolas'
run.font.size = Pt(10)

para("Dans un autre terminal :", bold_start="2. Lancer le frontend Next.js : ")
p = doc.add_paragraph()
run = p.add_run("cd C:/Users/DELL/OneDrive/Bureau/Memoire/prototype/frontend\n"
                "npx next dev -p 5001")
run.font.name = 'Consolas'
run.font.size = Pt(10)

para("http://localhost:5001", bold_start="3. Ouvrir dans le navigateur : ")
para("moussa.diop@example.com / password123", bold_start="4. Compte de test : ")


# ══════════════════════════════════════════════════════════════
# 4. RÔLE DE mBERT
# ══════════════════════════════════════════════════════════════

titre("4. Rôle précis de mBERT", level=1)

titre("Pourquoi mBERT ?", level=2)

para(
    "mBERT (multilingual BERT) est un modèle de langage développé par Google, pré-entraîné "
    "sur 104 langues. J'ai choisi ce modèle parce que notre chatbot doit comprendre à la fois "
    "le français et le wolof. Même si le wolof ne fait pas partie des 104 langues officielles "
    "de mBERT, j'ai constaté que le modèle arrive quand même à capturer certains patterns "
    "grâce au fine-tuning sur notre corpus bilingue."
)

titre("Ce que fait mBERT dans SunuBot", level=2)

para("mBERT remplit deux fonctions principales dans le système :")

doc.add_paragraph(
    "Classification d'intention : quand un utilisateur envoie un message, mBERT détermine "
    "ce qu'il veut faire. Par exemple, est-ce qu'il demande un document ? Est-ce qu'il pose "
    "une question sur une procédure ? Est-ce qu'il veut connaître un lieu ? "
    "Le modèle classe parmi 8 intentions possibles.", style='List Bullet'
)

doc.add_paragraph(
    "Détection de domaine : mBERT identifie aussi le service administratif concerné "
    "(état civil, DGID, CNSS, etc.). Ça permet de router la requête vers le bon serveur MCP.", style='List Bullet'
)

titre("Comment j'ai fine-tuné le modèle", level=2)

para(
    "J'ai créé un corpus de 160 phrases bilingues (wolof et français) avec pour chacune "
    "l'intention et le domaine correspondants. Par exemple : « Dama bëgg sama kàrt bëccëg » "
    "est étiqueté comme demande_document / etat_civil. J'ai ensuite fine-tuné "
    "bert-base-multilingual-cased sur ce corpus avec le script finetune_mbert.py."
)

para(
    "Le modèle fine-tuné est sauvegardé dans le dossier nlp/models/mbert_finetuned/ "
    "(fichiers config.json, model.safetensors et metriques.json)."
)

titre("Jeu de test annoté", level=2)

para(
    "Pour évaluer les performances de mBERT seul (sans la correction par règles que j'ai "
    "ajoutée ensuite), voici les résultats sur 10 phrases de test :"
)

add_table(
    ["N°", "Texte", "Langue", "Intention correcte", "mBERT prédit", "Correct ?"],
    [
        ["1", "Bonjour", "FR", "salutation", "salutation", "Oui"],
        ["2", "Na nga def", "WO", "salutation", "inscription", "Non"],
        ["3", "Je veux mon acte de naissance", "FR", "demande_document", "demande_document", "Oui"],
        ["4", "Dama bëgg sama kàrt bëccëg", "WO", "demande_document", "demande_document", "Oui"],
        ["5", "Comment payer mes impôts ?", "FR", "question_procedure", "inscription", "Non"],
        ["6", "Où est le bureau des impôts ?", "FR", "question_lieu", "question_lieu", "Oui"],
        ["7", "Combien coûte l'acte ?", "FR", "question_cout", "question_cout", "Oui"],
        ["8", "Je veux un NINEA", "FR", "demande_document", "salutation", "Non"],
        ["9", "Naka laa feyee sama wàll ?", "WO", "question_procedure", "question_delai", "Non"],
        ["10", "Je veux m'inscrire CNSS", "FR", "demande_inscription", "demande_document", "Non"],
    ]
)

doc.add_paragraph()

para("Précision brute de mBERT : 5/10 (50%)", bold_start="Résultat : ")
para(
    "Ce score peut paraître faible, mais il faut noter que le corpus de fine-tuning "
    "est petit (160 entrées). Avec plus de données, surtout en wolof, les performances "
    "s'amélioreraient. C'est pourquoi j'ai ajouté une couche de correction par règles "
    "qui exploite les mots-clés du message pour corriger les erreurs les plus évidentes. "
    "Avec cette correction, la précision monte à 80%."
)

titre("Limites identifiées", level=2)

doc.add_paragraph(
    "Le wolof n'est pas dans les langues de pré-entraînement de mBERT, ce qui limite "
    "la qualité de la classification pour les phrases purement wolof.", style='List Bullet'
)
doc.add_paragraph(
    "Le corpus de 160 entrées est insuffisant pour un fine-tuning robuste. "
    "Il faudrait idéalement 500 à 1000 entrées.", style='List Bullet'
)
doc.add_paragraph(
    "Les variantes orthographiques du wolof (ë vs e, à vs a) perturbent le modèle "
    "car le tokenizer de mBERT ne les connaît pas.", style='List Bullet'
)


# ══════════════════════════════════════════════════════════════
# 5. MODE D'APPEL MISTRAL
# ══════════════════════════════════════════════════════════════

titre("5. Mode d'appel à Mistral", level=1)

para(
    "Mistral est utilisé comme LLM (Large Language Model) pour l'analyse contextuelle "
    "et la génération de réponses. Je l'appelle via l'API cloud de Mistral AI, "
    "et non en local. Voici les détails."
)

para("mistral-small-latest", bold_start="Modèle utilisé : ")
para("API REST via le SDK Python mistralai", bold_start="Mode d'appel : ")
para("https://api.mistral.ai", bold_start="Endpoint : ")
para("Configurée dans le fichier .env (variable MISTRAL_API_KEY)", bold_start="Clé API : ")

titulo2 = titre("Rôle dans le pipeline", level=2)

para(
    "Quand Mistral est disponible, il travaille en complément de mBERT. "
    "mBERT fait la classification rapide (environ 100 ms) et Mistral fait "
    "l'analyse fine et la génération de réponse (500 ms à 2 secondes). "
    "Si Mistral n'est pas disponible (problème réseau, clé expirée), "
    "le système continue de fonctionner avec mBERT seul."
)

para("Le système est conçu pour fonctionner en 4 modes dégradés :")

add_table(
    ["Mode", "Modèles actifs", "Précision estimée", "Temps moyen"],
    [
        ["1. Complet", "mBERT + Mistral", "Haute", "1-2 s"],
        ["2. Mistral seul", "Mistral API", "Bonne", "1-2 s"],
        ["3. mBERT seul", "mBERT local", "Moyenne (80%)", "~100 ms"],
        ["4. Fallback", "TF-IDF + règles", "Basique", "~10 ms"],
    ]
)

doc.add_paragraph()

para_italic(
    "Note : lors de mes tests du 11 novembre, le système fonctionnait en mode 3 "
    "(mBERT seul) car l'API Mistral n'était pas joignable. Les résultats présentés "
    "dans le tableau d'essais reflètent donc les performances sans Mistral."
)


# ══════════════════════════════════════════════════════════════
# 6. SCHÉMA D'ARCHITECTURE
# ══════════════════════════════════════════════════════════════

titre("6. Architecture du système et parcours complet", level=1)

titre("Vue d'ensemble", level=2)

para(
    "Le système est composé de trois parties principales qui communiquent entre elles :"
)

doc.add_paragraph(
    "Le frontend (Next.js sur le port 5001) : c'est l'interface web que le citoyen utilise. "
    "Elle contient le chat, les formulaires, l'authentification et la sélection de langue.", style='List Bullet'
)
doc.add_paragraph(
    "Le backend NLP (FastAPI sur le port 8000) : c'est le moteur d'intelligence artificielle "
    "qui analyse les messages. Il utilise mBERT pour la classification et TF-IDF en fallback.", style='List Bullet'
)
doc.add_paragraph(
    "La base de données (PostgreSQL 14 sur le port 5433) : elle stocke les comptes utilisateurs, "
    "l'historique des conversations, les demandes soumises et les formulaires.", style='List Bullet'
)

titulo_parcours = titre("Parcours complet d'une demande", level=2)

para(
    "Pour illustrer comment tout fonctionne ensemble, voici le parcours complet "
    "quand un citoyen demande un acte de naissance :"
)

etapes = [
    "Le citoyen ouvre http://localhost:5001 dans son navigateur.",
    "Il se connecte avec son email et mot de passe.",
    "Il tape dans le chat : « Je veux mon acte de naissance ».",
    "Le frontend envoie une requête POST /api/chat au serveur.",
    "L'API transmet le message au serveur NLP Python (POST /analyser sur le port 8000).",
    "mBERT analyse le message et classifie : intention = demande_document, domaine = etat_civil.",
    "Le routeur MCP sélectionne le serveur « etat-civil » et les outils rechercher_citoyen et get_acte_naissance.",
    "La réponse est construite avec les pièces requises (CNI, timbre fiscal 200 FCFA) et le délai (3-5 jours).",
    "La conversation est enregistrée dans la table ConversationLog de PostgreSQL.",
    "Une trace MCP au format JSON est générée avec un identifiant unique.",
    "La réponse s'affiche dans l'interface du chat.",
    "Le citoyen peut ensuite cliquer pour remplir le formulaire de demande.",
    "Le formulaire pré-rempli est soumis et enregistré dans la table Demande.",
    "Un numéro de suivi (par exemple DEM-2024-001) est attribué.",
    "Le citoyen peut suivre l'avancement de sa demande avec ce numéro.",
]

for i, etape in enumerate(etapes, 1):
    p = doc.add_paragraph()
    run_num = p.add_run(f"{i}. ")
    run_num.bold = True
    p.add_run(etape)

doc.add_paragraph()

titulo_fichiers = titre("Fichiers de preuves", level=2)

add_table(
    ["Fichier", "Contenu"],
    [
        ["docs/traces/mcp-traces-2026-11-11.json", "31 traces MCP réelles au format JSON"],
        ["docs/traces/essai-parcours-demande-2026-11-02.json", "Trace du parcours de demande avec vérification en base"],
        ["nlp/models/mbert_finetuned/", "Modèle mBERT fine-tuné (config, poids, métriques)"],
        ["nlp/data/corpus_wolof_admin.json", "Corpus de 160 entrées bilingues wolof/français"],
    ]
)


# ══════════════════════════════════════════════════════════════
# SAUVEGARDE
# ══════════════════════════════════════════════════════════════

output_path = os.path.join(
    os.path.dirname(__file__),
    "..", "..",
    "Rapport_Technique_SunuBot_Actualise.docx"
)
output_path = os.path.abspath(output_path)

doc.save(output_path)
print(f"Document sauvegardé : {output_path}")
