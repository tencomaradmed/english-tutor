# 🚀 Rychlý návod - Deployment English Tutor

## ✅ Co jsem připravil

1. ✅ **Procfile** pro Railway
2. ✅ **render.yaml** pro Render
3. ✅ **package.json** s engines
4. ✅ **Návody** pro Railway a Render

## 🎯 Doporučený postup

### Varianta A: Railway.app (Doporučeno - rychlejší)

1. **Připravte GitHub:**
   ```bash
   git add .
   git commit -m "Připraveno pro deployment"
   git push origin main
   ```

2. **Deploy na Railway:**
   - Jděte na https://railway.app
   - Přihlaste se přes GitHub
   - "New Project" → "Deploy from GitHub"
   - Vyberte repo: `tencomaradmed/justenglish`
   - **Settings → Root Directory:** `backend`
   - **Variables:** Přidejte:
     - `OPENAI_API_KEY=sk-...`
     - `FRONTEND_URL=https://vas-frontend.com`
   - Zkopírujte URL (např. `https://xxx.up.railway.app`)

3. **Nastavte Frontend:**
   ```bash
   cd frontend
   echo "REACT_APP_API_URL=https://xxx.up.railway.app" > .env
   npm run build
   ```
   Nahrajte `build/` na FTP.

### Varianta B: Render.com (Alternativa)

1. **Připravte GitHub:** (stejně jako výše)

2. **Deploy na Render:**
   - Jděte na https://render.com
   - Přihlaste se přes GitHub
   - "New +" → "Web Service"
   - Vyberte repo: `tencomaradmed/justenglish`
   - **Build Command:** `cd backend && npm install`
   - **Start Command:** `cd backend && npm start`
   - **Environment Variables:** (stejné jako Railway)
   - Zkopírujte URL

3. **Nastavte Frontend:** (stejně jako výše)

## 📝 Podrobné návody

- **Railway:** Viz `RAILWAY_DEPLOY.md`
- **Render:** Viz `RENDER_DEPLOY.md`

## ⚠️ Důležité poznámky

1. **SQLite databáze:**
   - Na Railway/Render se ukládá do ephemeral storage
   - Při restartu se může resetovat
   - Pro produkci zvažte PostgreSQL (Railway má addon)

2. **OpenAI API Key:**
   - Získejte na https://platform.openai.com/api-keys
   - **NIKDY** ho nedávejte do frontendu!

3. **CORS:**
   - Backend má `app.use(cors())` - povolí všechny originy
   - Pro produkci můžete omezit na konkrétní domény

## 🎉 Hotovo!

Po deploymentu:
- Backend běží na Railway/Render
- Frontend běží na vašem FTP
- Aplikace je funkční!

---

**Potřebujete pomoc?** Zkontrolujte logy v Railway/Render dashboardu.

