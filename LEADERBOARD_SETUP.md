# Typo Leaderboard Setup Guide

## Setup Schritte

### 1. Frontend updaten (Vite App)
Die `main.js` und `index.html` sind bereits konfiguriert um Scores zu speichern und das Leaderboard anzuzeigen.

**Wichtig:** Ersetze in `main.js` (Zeile ~63) die `API_BASE` URL:
```javascript
const API_BASE = 'https://typo-api.YOUR_DOMAIN.workers.dev';
```

### 2. Cloudflare D1 Database erstellen

1. Gehe auf [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Navigiere zu **D1 SQL Database**
3. Klicke **Create Database**
4. Gib den Namen ein: `typo`
5. Klicke **Create**

Notiere dir die **Database ID** aus den Details.

### 3. Datenbank-Schema initialisieren

```bash
cd worker
npm install -g wrangler  # Falls nicht installiert
wrangler d1 execute typo --file schema.sql
```

### 4. Cloudflare Worker deployen

1. **Wrangler konfigurieren:**
   ```bash
   wrangler login
   ```

2. **wrangler.toml updaten** mit deiner **Database ID** und deiner Domain:
   ```toml
   [[d1_databases]]
   binding = "DB"
   database_name = "typo"
   database_id = "YOUR_DATABASE_ID"
   ```

3. **Worker deployen:**
   ```bash
   wrangler deploy
   ```

4. Notiere die Ausgabe-URL (z.B. `typo-api.workers.dev`)

### 5. Frontend aktualisieren

Ersetze in `main.js`:
```javascript
const API_BASE = 'https://typo-api.workers.dev'; // Deine Worker URL
```

### 6. App rebuilden und deployen

```bash
npm run build
# Dann auf Cloudflare Pages deployen
```

## API Endpoints

- **GET** `/api/scores` — Hole Top 100 Scores
- **POST** `/api/scores` — Speichere neuen Score
  ```json
  { "name": "PlayerName", "score": 1250 }
  ```

## Troubleshooting

**CORS Fehler?**
- Der Worker hat bereits CORS Headers eingebaut

**Datenbank zeigt keine Daten?**
- Stelle sicher, dass `schema.sql` ausgeführt wurde
- Überprüfe die Database ID in `wrangler.toml`

**Worker antwortet nicht?**
- Überprüfe deine Internet-Verbindung
- Siehe Logs auf Cloudflare Dashboard

---

Das war's! Dein Leaderboard sollte jetzt funktionieren.
