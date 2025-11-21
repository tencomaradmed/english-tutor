const fs = require('fs');
const path = require('path');
const PDFParser = require('pdf2json');
const { RecursiveCharacterTextSplitter } = require('@langchain/textsplitters');
const { OpenAIEmbeddings } = require('@langchain/openai');
const { Chroma } = require('@langchain/community/vectorstores/chroma');
require('dotenv').config();

// Funkce pro extrakci textu z PDF
function extractTextFromPDF(filePath) {
  return new Promise((resolve, reject) => {
    const pdfParser = new PDFParser();
    
    pdfParser.on('pdfParser_dataError', errData => reject(errData.parserError));
    pdfParser.on('pdfParser_dataReady', pdfData => {
      const text = pdfParser.getRawTextContent();
      resolve(text);
    });
    
    pdfParser.loadPDF(filePath);
  });
}

// Funkce pro načtení a zpracování PDF
async function loadPDFDocuments() {
  try {
    console.log('🚀 Začínám načítat PDF dokumenty...');
    
    const documentsPath = path.join(__dirname, '../documents');
    
    // Vytvoř složku documents pokud neexistuje
    if (!fs.existsSync(documentsPath)) {
      fs.mkdirSync(documentsPath, { recursive: true });
      console.log('📁 Vytvořena složka documents/');
      console.log('⚠️  Vlož sem svoje PDF soubory a spusť skript znovu.');
      return;
    }
    
    const files = fs.readdirSync(documentsPath).filter(file => file.endsWith('.pdf'));
    
    if (files.length === 0) {
      console.log('⚠️  Žádné PDF soubory nenalezeny ve složce documents/');
      console.log('📝 Vlož tam nějaké PDF soubory a spusť skript znovu.');
      return;
    }
    
    console.log(`📄 Nalezeno ${files.length} PDF souborů`);
    
    let allTexts = [];
    
    // Načtení všech PDF
    for (const file of files) {
      console.log(`📖 Načítám: ${file}`);
      const filePath = path.join(documentsPath, file);
      
      try {
        const text = await extractTextFromPDF(filePath);
        
        allTexts.push({
          text: text,
          source: file
        });
        
        console.log(`✅ ${file}: ${text.length} znaků`);
      } catch (error) {
        console.error(`❌ Chyba při načítání ${file}:`, error.message);
      }
    }
    
    if (allTexts.length === 0) {
      console.log('❌ Nepodařilo se načíst žádný PDF soubor.');
      return;
    }
    
    // Rozdělení textu na menší části (chunks)
    console.log('\n✂️  Dělím text na menší části...');
    const textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 200
    });
    
    let allChunks = [];
    for (const doc of allTexts) {
      const chunks = await textSplitter.createDocuments(
        [doc.text],
        [{ source: doc.source }]
      );
      allChunks = allChunks.concat(chunks);
    }
    
    console.log(`📦 Vytvořeno ${allChunks.length} chunks`);
    
    // Vytvoření embeddings a uložení do Chroma
    console.log('\n🧠 Vytvářím embeddings a ukládám do vektorové databáze...');
    
    const embeddings = new OpenAIEmbeddings({
      openAIApiKey: process.env.OPENAI_API_KEY
    });
    
    const vectorStore = await Chroma.fromDocuments(
      allChunks,
      embeddings,
      {
        collectionName: 'english-materials'
      }
    );
    
    console.log('✅ Hotovo! Materiály jsou uloženy ve vektorové databázi.');
    console.log(`📊 Celkem zpracováno: ${allChunks.length} částí textu z ${allTexts.length} souborů`);
    
    // Test vyhledávání
    console.log('\n🔍 Test vyhledávání...');
    const results = await vectorStore.similaritySearch('grammar', 2);
    console.log(`Nalezeno ${results.length} relevantních částí`);
    if (results.length > 0) {
      console.log('Ukázka první části:', results[0].pageContent.substring(0, 150) + '...');
    }
    
  } catch (error) {
    console.error('❌ Chyba:', error);
  }
}

// Spuštění
loadPDFDocuments();