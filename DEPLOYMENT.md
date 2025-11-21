# Deployment Guide - English Tutor

Tento průvodce vám pomůže nasadit aplikaci English Tutor na FTP server.

## 📋 Požadavky

- Node.js (pro build frontendu)
- FTP přístup k vašemu serveru
- Backend server s Node.js (pro API)

## 🚀 Krok 1: Příprava Frontendu

### 1.1 Vytvořte `.env` soubor

V adresáři `frontend/` vytvořte soubor `.env`:

```env
REACT_APP_API_URL=https://vas-backend-server.com
```

**Důležité:** Nahraďte `https://vas-backend-server.com` skutečnou URL vašeho backend serveru.

### 1.2 Nainstalujte závislosti

```bash
cd frontend
npm install
```

### 1.3 Vytvořte produkční build

```bash
npm run build
```

Tento příkaz vytvoří optimalizovanou produkční verzi v adresáři `frontend/build/`.

## 📤 Krok 2: Nahrání na FTP

### 2.1 Obsah pro upload

Nahrajte **celý obsah** adresáře `frontend/build/` na váš FTP server.

Typická struktura:
```
public_html/
  ├── index.html
  ├── static/
  │   ├── css/
  │   ├── js/
  │   └── media/
  ├── manifest.json
  └── robots.txt
```

### 2.2 Důležité poznámky

- **Nenahrávejte** adresář `frontend/build/` samotný, ale pouze jeho **obsah**
- Ujistěte se, že `index.html` je v kořenovém adresáři vašeho webu
- Zkontrolujte, že všechny soubory v `static/` jsou přístupné

## 🔧 Krok 3: Backend Deployment

### 3.1 Nastavení backend serveru

Na vašem backend serveru:

1. Nahrajte obsah adresáře `backend/`
2. Nainstalujte závislosti:
   ```bash
   npm install
   ```
3. Vytvořte `.env` soubor:
   ```env
   PORT=3001
   OPENAI_API_KEY=vas-openai-api-key
   FRONTEND_URL=https://vas-frontend-url.com
   NODE_ENV=production
   ```

### 3.2 Spuštění backendu

Pro produkci použijte process manager jako `pm2`:

```bash
npm install -g pm2
pm2 start server.js --name english-tutor-api
pm2 save
pm2 startup
```

## ✅ Krok 4: Ověření

1. Otevřete vaši frontend URL v prohlížeči
2. Zkontrolujte, že se aplikace načte
3. Otestujte připojení k backend API
4. Zkontrolujte konzoli prohlížeče (F12) pro případné chyby

## 🔍 Řešení problémů

### Frontend se nenačítá
- Zkontrolujte, že `index.html` je v kořenovém adresáři
- Ověřte, že všechny cesty k souborům v `static/` jsou správné
- Zkontrolujte `.htaccess` (pokud používáte Apache) pro správné směrování

### API volání nefungují
- Ověřte, že `REACT_APP_API_URL` v `.env` je správně nastaveno
- Zkontrolujte CORS nastavení na backendu
- Ověřte, že backend server běží a je přístupný

### Build selhává
- Zkontrolujte, že máte nainstalované všechny závislosti (`npm install`)
- Ověřte, že Node.js verze je kompatibilní (doporučeno v14+)

## 📝 Poznámky

- **Environment Variables**: V React aplikaci musí být environment variables předponované `REACT_APP_`
- **Build optimalizace**: Produkční build je automaticky optimalizován (minifikace, tree-shaking)
- **HTTPS**: Pro produkci vždy používejte HTTPS pro bezpečnost
- **CORS**: Ujistěte se, že backend má správně nastavené CORS pro vaši frontend doménu

## 🔄 Aktualizace

Při aktualizaci aplikace:
1. Vytvořte nový build (`npm run build`)
2. Nahrajte nový obsah `build/` na FTP
3. Vymažte cache prohlížeče (Ctrl+Shift+R)

---

**Potřebujete pomoc?** Zkontrolujte konzoli prohlížeče a backend logy pro více informací o chybách.

