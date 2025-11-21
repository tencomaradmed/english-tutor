# 🚂 Deployment Frontendu na Railway - Krok za krokem

## 📋 Přehled

Railway podporuje nasazení React frontendu jako statického webu. Můžete mít backend i frontend na Railway jako dva samostatné services.

## 🚀 Krok 1: Připravte Frontend

### 1.1 Zkontrolujte soubory

Ujistěte se, že máte v `frontend/`:
- ✅ `package.json` (máte)
- ✅ `Procfile` (vytvořil jsem)
- ✅ Build script funguje

### 1.2 Commitněte změny

```bash
git add frontend/Procfile frontend/package.json
git commit -m "Add Railway frontend deployment config"
git push origin main
```

## 🚂 Krok 2: Vytvořte Frontend Service na Railway

### 2.1 Přidejte nový service

1. V Railway dashboardu klikněte na váš projekt
2. Klikněte **"+ New"** → **"GitHub Repo"**
3. Vyberte stejný repo: `tencomaradmed/justenglish`
4. Railway vytvoří nový service

### 2.2 Nastavte Root Directory

1. V novém service klikněte na **"Settings"**
2. Najděte **"Root Directory"**
3. Nastavte na: `frontend`
4. Uložte

### 2.3 Nastavte Build a Start Commands

1. V **"Settings"** → **"Deploy"**
2. **Build Command:** `npm install && npm run build`
3. **Start Command:** `npm run serve`
4. Uložte

### 2.4 Nastavte Environment Variables

1. V service klikněte na **"Variables"**
2. Přidejte:

```
REACT_APP_API_URL=https://your-backend-service.up.railway.app
PORT=3000
NODE_ENV=production
```

**Důležité:**
- `REACT_APP_API_URL` - URL vašeho **backend** service na Railway
- Zkopírujte URL z backend service (Settings → Generate Domain)

### 2.5 Spusťte Deployment

1. Railway automaticky začne buildovat
2. Počkejte na "Deploy Successful"
3. Klikněte na **"Settings"** → **"Generate Domain"**
4. Zkopírujte frontend URL (např. `https://your-frontend.up.railway.app`)

## ✅ Krok 3: Aktualizujte Backend CORS (pokud je potřeba)

Backend už má `cors()` middleware, který by měl povolit všechny originy. Pokud máte problémy:

1. V backend service → **"Variables"**
2. Přidejte:
```
FRONTEND_URL=https://your-frontend.up.railway.app
```

## 🔍 Ověření

1. Otevřete frontend URL v prohlížeči
2. Aplikace by se měla načíst
3. Zkuste spustit lekci - měla by komunikovat s backendem

## 🐛 Řešení problémů

### Build selhává
- Zkontrolujte, že Root Directory je `frontend`
- Zkontrolujte logy v Railway (Deployments → View Logs)
- Ujistěte se, že `npm run build` funguje lokálně

### Frontend se nenačítá
- Zkontrolujte, že `REACT_APP_API_URL` je správně nastaven
- Zkontrolujte konzoli prohlížeče (F12) pro chyby
- Ujistěte se, že backend URL je správná

### API volání nefungují
- Zkontrolujte CORS v backendu
- Zkontrolujte, že `REACT_APP_API_URL` ukazuje na správný backend service
- Zkontrolujte Network tab v prohlížeči (F12)

## 💡 Tipy

- **Monorepo Setup:** Railway automaticky detekuje změny v `frontend/` a redeployuje
- **Automatické deployment:** Při push do GitHubu se oba services automaticky redeployují
- **Náklady:** Oba services se počítají do vašeho $5 měsíčního kreditu
- **HTTPS:** Automaticky pro oba services

## 📊 Struktura na Railway

```
Projekt: english-tutor
├── Service 1: backend
│   ├── Root Directory: backend
│   ├── Build: npm install --legacy-peer-deps
│   ├── Start: npm start
│   └── URL: https://backend.up.railway.app
│
└── Service 2: frontend
    ├── Root Directory: frontend
    ├── Build: npm install && npm run build
    ├── Start: npm run serve
    └── URL: https://frontend.up.railway.app
```

---

**Hotovo!** 🎉 Váš frontend i backend běží na Railway!

