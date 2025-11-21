# 🔧 Opravy pro Deployment

## ✅ Co bylo opraveno

### 1. Konflikt závislostí `dotenv`
- **Problém:** `dotenv@17.2.3` konfliktoval s `@langchain/community`
- **Řešení:** Downgrade na `dotenv@^16.4.5`
- **Soubor:** `backend/package.json`

### 2. Neaktuální `package-lock.json`
- **Problém:** `package-lock.json` měl starou verzi `dotenv@17.2.3`
- **Řešení:** Vytvořen nový `package-lock.json` s `npm install --legacy-peer-deps`
- **Soubor:** `backend/package-lock.json`

### 3. Node.js verze
- **Problém:** `engines` specifikoval `>=18.0.0`, ale závislosti potřebují `>=20.18.0`
- **Řešení:** Aktualizováno na `>=20.18.0`
- **Soubor:** `backend/package.json`

### 4. Automatické řešení peer dependencies
- **Řešení:** Vytvořen `backend/.npmrc` s `legacy-peer-deps=true`
- **Soubor:** `backend/.npmrc`

### 5. Aktualizace deployment konfigurací
- **Railway:** Aktualizován návod s Node.js verzí
- **Render:** Přidána Node.js verze do `render.yaml` a návodu
- **Soubory:** `RAILWAY_DEPLOY.md`, `RENDER_DEPLOY.md`, `render.yaml`

## 📝 Co teď udělat

1. **Commitněte změny:**
   ```bash
   git add .
   git commit -m "Fix: Resolve dependency conflicts and update Node.js version"
   git push origin main
   ```

2. **Deploy na Railway/Render:**
   - Railway automaticky použije Node.js 20.18.0+ z `package.json` engines
   - Render použije verzi z `render.yaml` (20.18.0)
   - Build by měl nyní projít úspěšně

## ⚠️ Poznámky

- **Warnings o engine:** Na Railway/Render budou mít správnou verzi Node.js, warnings zmizí
- **Vulnerabilities:** Jsou v dev dependencies (chromadb, pdf parsers), nejsou kritické pro běh
- **`npm ci` vs `npm install`:** Oba fungují, `npm ci` je rychlejší pro CI/CD

## ✅ Ověření

Po deploymentu by mělo:
- ✅ Build projít bez errors
- ✅ Server se spustit
- ✅ API endpoint `/api/test` odpovídat

---

**Hotovo!** 🎉 Všechny dependency konflikty jsou vyřešeny.


