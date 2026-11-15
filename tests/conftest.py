"""
Configuration pytest pour SunuBot
"""
import sys
import os

# Ajouter le dossier nlp/src au path pour tous les tests
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "nlp", "src"))
