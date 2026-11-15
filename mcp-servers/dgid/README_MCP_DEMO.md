# Démonstration d'un échange MCP réel

Cette démonstration établit une communication réelle entre un client MCP et le
serveur DGID du prototype. Le client utilise le SDK MCP et le transport `stdio`.
Il négocie la session, découvre les outils, appelle `get_centre_fiscal` pour la
région de Thiès et sauvegarde les messages JSON-RPC échangés.

Les données retournées proviennent du jeu local de démonstration `src/data.ts`.
Le serveur n'est pas connecté au système d'information officiel de la DGID.

## Environnement vérifié

- Node.js : `v26.13.0`
- npm : `11.16.0`
- `@modelcontextprotocol/sdk` : `1.29.0`
- TypeScript : `6.0.3`
- Zod : `4.4.3`
- Transport : `stdio`

## Commande de reproduction

Dans PowerShell, depuis le répertoire du serveur DGID :

```powershell
cd C:\Users\DELL\OneDrive\Bureau\Memoire\prototype\mcp-servers\dgid
npm run demo:mcp
```

Le script compile le serveur, le démarre comme processus enfant du client MCP,
liste les outils, appelle `get_centre_fiscal` avec `region: "Thiès"`, puis ferme
la session. Il affiche la réponse et crée une trace JSON dans `traces\`.

Pour installer les dépendances si nécessaire :

```powershell
npm ci
```

## Contenu de la trace

Le fichier `traces\mcp-exchange-<date>.json` conserve les messages échangés dans
les deux sens, dont `initialize`, `notifications/initialized`, `tools/list` et
`tools/call`, ainsi que les réponses du serveur. Il indique le nom/version du
serveur, le transport utilisé et la nature locale des données.

Lors de l'exécution de référence du 2 novembre 2026, le client a découvert les
outils du serveur et reçu une réponse sans erreur à l'appel
`get_centre_fiscal`. Cette trace prouve l'échange MCP entre les deux processus;
elle ne prouve ni une connexion à la DGID officielle ni l'intégration de cet
échange dans le chat web.
