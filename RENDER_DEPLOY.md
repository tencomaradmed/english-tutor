# 🎨 Deployment na Render.com - Krok za krokem

## 📋 Co potřebujete

1. GitHub účet (máte: https://github.com/tencomaradmed/justenglish.git)
2. Render.com účet (zdarma)
3. OpenAI API klíč

## 🚀 Krok 1: Připravte Backend

### 1.1 Vytvořte `render.yaml`

Vytvořil jsem soubor `render.yaml` v root adresáři projektu.

### 1.2 Commitněte změny do GitHubu

```bash
cd /Users/davidsvarc/projekty/english-tutor
git add .
git commit -m "Připraveno pro Render deployment"
git push origin main
```

## 🎨 Krok 2: Deployment na Render

### 2.1 Vytvořte účet na Render

1. Jděte na https://render.com
2. Klikněte "Get Started for Free"
3. Přihlaste se pomocí GitHubu
4. Povolte přístup k vašemu repo

### 2.2 Vytvořte nový Web Service

1. V Dashboard klikněte "New +"
2. Vyberte "Web Service"
3. Vyberte repo: `tencomaradmed/justenglish`
4. Klikněte "Connect"

### 2.3 Nastavte konfiguraci

Vyplňte formulář:

- **Name:** `english-tutor-api` (nebo jak chcete)
- **Environment:** `Node`
- **Build Command:** `cd backend && npm install`
- **Start Command:** `cd backend && npm start`
- **Plan:** Free (nebo Starter pro více zdrojů)

### 2.4 Nastavte Environment Variables

V sekci "Environment Variables" přidejte:

```
PORT=3001
OPENAI_API_KEY=sk-vas-openai-api-key
FRONTEND_URL=https://vas-frontend-url.com
NODE_ENV=production
```

**Důležité:**
- `OPENAI_API_KEY` - získejte na https://platform.openai.com/api-keys
- `FRONTEND_URL` - URL vašeho frontendu

### 2.5 Spusťte Deployment

1. Klikněte "Create Web Service"
2. Render začne buildovat
3. Počkejte na "Live" status
4. Zkopírujte URL (např. `https://your-app.onrender.com`)

## ✅ Krok 3: Nastavte Frontend

### 3.1 Vytvořte `.env` v `frontend/`

```env
REACT_APP_API_URL=https://your-app.onrender.com
```

(Nahraďte URL vaší Render aplikace)

### 3.2 Vytvořte build

```bash
cd frontend
npm install
npm run build
```

### 3.3 Nahrajte na FTP

Nahrajte obsah `frontend/build/` na váš FTP server.

## 🔍 Ověření

1. Otevřete Render URL v prohlížeči
2. Měli byste vidět: `{"message":"Backend funguje!"}`
3. Otevřete frontend URL
4. Aplikace by měla fungovat!

## 🐛 Řešení problémů

### Build selhává
- Zkontrolujte logy v Render (Events tab)
- Ujistěte se, že Build Command je správně nastaven

### Aplikace se uspí
- Render Free tier uspává aplikaci po 15 minutách nečinnosti
- První request může trvat 30-60 sekund (cold start)
- Pro produkci zvažte Starter plan ($7/měsíc)

### API nefunguje
- Zkontrolujte, že `OPENAI_API_KEY` je správně nastaven
- Zkontrolujte CORS v `server.js`

## 💡 Tipy

- Render Free tier je zdarma, ale má cold starts
- Automatické deployment při push do GitHubu
- HTTPS automaticky
- Logy jsou dostupné v Render dashboardu

---

**Hotovo!** 🎉 Vaše aplikace běží na Render!

