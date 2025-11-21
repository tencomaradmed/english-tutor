# 🚀 Rychlý návod pro FTP deployment

## ✅ Co potřebujete

1. **FTP přístup** k vašemu webhostingu (stačí obyčejný webhosting)
2. **Backend server** s Node.js (může být jiný server)

## 📦 Krok 1: Připravte Frontend Build

### 1.1 Vytvořte `.env` soubor

V adresáři `frontend/` vytvořte soubor `.env`:

```env
REACT_APP_API_URL=https://vas-backend-url.com
```

**DŮLEŽITÉ:** Nahraďte `https://vas-backend-url.com` skutečnou URL vašeho backend serveru (kde poběží Node.js API).

### 1.2 Vytvořte build

```bash
cd frontend
npm install
npm run build
```

Build se vytvoří v adresáři `frontend/build/`

## 📤 Krok 2: Nahrání na FTP

### Co nahrát:

Nahrajte **VŠECHNY soubory a složky** z `frontend/build/` na váš FTP server.

**Typická struktura po nahrání:**
```
public_html/          (nebo www/, nebo htdocs/ - záleží na hostingu)
  ├── index.html      ← hlavní soubor
  ├── static/
  │   ├── css/
  │   ├── js/
  │   └── media/
  ├── manifest.json
  └── robots.txt
```

### Jak nahrát:

1. Připojte se k FTP (FileZilla, WinSCP, nebo jakýkoliv FTP klient)
2. Přejděte do kořenového adresáře vašeho webu (obvykle `public_html`, `www`, nebo `htdocs`)
3. Nahrajte **celý obsah** složky `frontend/build/`
4. Ujistěte se, že `index.html` je v kořenovém adresáři

## ⚙️ Krok 3: Backend (musí běžet jinde)

Backend **NEMŮŽE** běžet na obyčejném FTP webhostingu. Potřebujete:

- **VPS server** s Node.js, NEBO
- **Cloud hosting** (Heroku, Railway, Render, atd.), NEBO  
- **Dedikovaný server** s Node.js

### Backend setup:

1. Nahrajte obsah `backend/` na server s Node.js
2. Vytvořte `.env`:
   ```env
   PORT=3001
   OPENAI_API_KEY=vas-openai-key
   FRONTEND_URL=https://vas-frontend-url.com
   NODE_ENV=production
   ```
3. Spusťte:
   ```bash
   npm install
   pm2 start server.js
   ```

## ✅ Ověření

1. Otevřete vaši webovou URL v prohlížeči
2. Aplikace by se měla načíst
3. Zkontrolujte konzoli (F12) - neměly by být chyby s API

## 🔍 Časté problémy

### "Cannot connect to API"
- Zkontrolujte, že `REACT_APP_API_URL` v `.env` je správně nastaveno
- Zkontrolujte, že backend běží a je přístupný
- Zkontrolujte CORS nastavení na backendu

### "404 Not Found" pro soubory
- Ujistěte se, že všechny soubory z `build/` jsou nahrány
- Zkontrolujte, že `index.html` je v kořenovém adresáři

### Aplikace se nenačítá
- Zkontrolujte, že všechny soubory v `static/` jsou přístupné
- Zkontrolujte konzoli prohlížeče (F12) pro chyby

## 💡 Tipy

- **HTTPS**: Pro produkci vždy používejte HTTPS
- **Cache**: Po nahrání vymažte cache prohlížeče (Ctrl+Shift+R)
- **Testování**: Nejdřív otestujte na lokálním buildu (`npm run build && serve -s build`)

---

**Shrnutí:** Frontend = statické soubory → obyčejný FTP ✅ | Backend = Node.js → potřebuje server s Node.js ⚠️

