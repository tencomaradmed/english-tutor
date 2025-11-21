# 🔄 Alternativy pro Backend Deployment

## Problém
Aplikace potřebuje backend pro:
- ✅ OpenAI API volání (GPT, TTS, překlady)
- ✅ Databázi (SQLite) pro ukládání dat
- ✅ Session management

## 💡 Možná řešení

### 1. **Serverless Functions** (Doporučeno)
Použijte cloud funkce místo celého Node.js serveru:

#### Vercel / Netlify Functions
- ✅ Zdarma pro malé projekty
- ✅ Automatický deployment
- ✅ Nemusíte spravovat server

**Jak na to:**
```bash
# Vercel
npm i -g vercel
cd backend
vercel
```

#### Cloudflare Workers
- ✅ Velmi rychlé
- ✅ Zdarma do určitého limitu
- ✅ Edge computing

### 2. **Platform-as-a-Service (PaaS)**
Jednoduchý deployment bez správy serveru:

#### Railway.app
- ✅ Automatický deployment z GitHubu
- ✅ Zdarma $5 kredit měsíčně
- ✅ Jednoduché nastavení

#### Render.com
- ✅ Zdarma tier dostupný
- ✅ Automatický deployment
- ✅ HTTPS automaticky

#### Heroku
- ✅ Klasické řešení
- ⚠️ Placené (zdarma tier zrušen)

### 3. **VPS s Node.js** (Pokud máte)
Pokud máte přístup k VPS serveru:

```bash
# SSH na server
ssh user@your-server.com

# Nainstalujte Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Nahrajte backend
scp -r backend/* user@server:/var/www/english-tutor/

# Spusťte s PM2
npm install -g pm2
cd /var/www/english-tutor
npm install
pm2 start server.js
pm2 save
```

## 🎯 Nejjednodušší řešení pro vás

**Doporučuji Railway.app nebo Render.com:**

1. **Zaregistrujte se** na railway.app nebo render.com
2. **Připojte GitHub** (pushněte backend do repo)
3. **Deploy** - automaticky se nasadí
4. **Získejte URL** - např. `https://your-app.railway.app`
5. **Nastavte environment variables** (OPENAI_API_KEY)
6. **Hotovo!** - použijte tuto URL v frontend `.env`

## 📝 Co upravit v backendu pro serverless?

Pokud chcete použít serverless, backend by se musel trochu upravit:
- SQLite → externí databáze (PostgreSQL, MongoDB)
- Stateless funkce místo dlouho běžícího serveru

Ale pro začátek doporučuji **Railway** nebo **Render** - funguje to s aktuálním backendem bez změn!

---

**Shrnutí:** Backend je nutný, ale nemusíte ho spravovat sami - použijte cloud službu! ☁️

