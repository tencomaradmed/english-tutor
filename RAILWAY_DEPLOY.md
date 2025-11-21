# 🚂 Deployment na Railway.app - Krok za krokem

## 📋 Co potřebujete

1. GitHub účet (máte: https://github.com/tencomaradmed/justenglish.git)
2. Railway.app účet (zdarma)
3. OpenAI API klíč

## 🚀 Krok 1: Připravte Backend

### 1.1 Zkontrolujte soubory

Ujistěte se, že máte v `backend/`:
- ✅ `package.json` (máte)
- ✅ `server.js` (máte)
- ✅ `database.js` (máte)
- ✅ `Procfile` (vytvořil jsem)
- ✅ `.gitignore` (máte)

### 1.2 Commitněte změny do GitHubu

```bash
cd /Users/davidsvarc/projekty/english-tutor
git add .
git commit -m "Připraveno pro Railway deployment"
git push origin main
```

## 🚂 Krok 2: Deployment na Railway

### 2.1 Vytvořte účet na Railway

1. Jděte na https://railway.app
2. Klikněte "Start a New Project"
3. Přihlaste se pomocí GitHubu
4. Povolte přístup k vašemu repo

### 2.2 Vytvořte nový projekt

1. Klikněte "New Project"
2. Vyberte "Deploy from GitHub repo"
3. Vyberte repo: `tencomaradmed/justenglish`
4. Railway automaticky detekuje Node.js projekt

### 2.3 Nastavte Root Directory a Build Command

1. V projektu klikněte na "Settings"
2. Najděte "Root Directory"
3. Nastavte na: `backend`
4. Najděte "Build Command" (pokud je k dispozici)
5. Nastavte na: `npm install --legacy-peer-deps`
6. Uložte

### 2.4 Nastavte Environment Variables

1. V projektu klikněte na "Variables"
2. Přidejte tyto proměnné:

```
PORT=3001
OPENAI_API_KEY=sk-vas-openai-api-key
FRONTEND_URL=https://vas-frontend-url.com
NODE_ENV=production
```

**Důležité:**
- `OPENAI_API_KEY` - získejte na https://platform.openai.com/api-keys
- `FRONTEND_URL` - URL vašeho frontendu (kde nahrajete build)

### 2.5 Spusťte Deployment

1. Railway automaticky začne buildovat
2. Počkejte na "Deploy Successful"
3. Klikněte na "Settings" → "Generate Domain"
4. Zkopírujte URL (např. `https://your-app.up.railway.app`)

## ✅ Krok 3: Nastavte Frontend

### 3.1 Vytvořte `.env` v `frontend/`

```env
REACT_APP_API_URL=https://your-app.up.railway.app
```

(Nahraďte URL vaší Railway aplikace)

### 3.2 Vytvořte build

```bash
cd frontend
npm install
npm run build
```

### 3.3 Nahrajte na FTP

Nahrajte obsah `frontend/build/` na váš FTP server.

## 🔍 Ověření

1. Otevřete Railway URL v prohlížeči
2. Měli byste vidět: `{"message":"Backend funguje!"}`
3. Otevřete frontend URL
4. Aplikace by měla fungovat!

## 🐛 Řešení problémů

### Build selhává
- Zkontrolujte, že Root Directory je nastaveno na `backend`
- Zkontrolujte logy v Railway (Deployments → View Logs)

### API nefunguje
- Zkontrolujte, že `OPENAI_API_KEY` je správně nastaven
- Zkontrolujte CORS - Railway automaticky povolí všechny originy

### Databáze se resetuje
- SQLite soubor se ukládá do ephemeral storage
- Pro produkci zvažte PostgreSQL (Railway má addon)

## 💡 Tipy

- Railway má zdarma $5 kredit měsíčně
- Automatické deployment při push do GitHubu
- HTTPS automaticky
- Logy jsou dostupné v Railway dashboardu

---

**Hotovo!** 🎉 Vaše aplikace běží na Railway!

