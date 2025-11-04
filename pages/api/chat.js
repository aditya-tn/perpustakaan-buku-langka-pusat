import { supabase } from '../../lib/supabase'
import { generateAIResponse } from '../../lib/gemini'

export default async function handler(req, res) {
  console.log('=== HYBRID CHAT API CALLED ===');
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { message, chatHistory = [] } = req.body;
    
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }
    
    // Tambahkan logging di handler utama
    console.log('Processing message:', message);

    // 🎯 STEP 1: Prioritize Book Search
    const searchResponse = await handleBookSearch(message);
    console.log('🔍 Book search result:', searchResponse ? 'MATCH' : 'NO MATCH');

    if (searchResponse) {
      return res.status(200).json([{ 
        text: searchResponse,
        type: 'book_search',
        confidence: 0.9
      }]);
    }

    // 🎯 STEP 1.5: BOOK SPECIFIC QUESTIONS - IMPROVED
    const bookQuestionResponse = await handleBookSpecificQuestion(message);
    console.log('📖 Book question result:', bookQuestionResponse ? 'MATCH' : 'NO MATCH');

    if (bookQuestionResponse) {
      return res.status(200).json([{ 
        text: bookQuestionResponse,
        type: 'book_detail',
        confidence: 0.8
      }]);
    }
    
    // 🎯 STEP 2: Enhanced Rule-Based dengan Confidence Scoring
    const ruleBasedResult = await handleEnhancedRuleBased(message);

    // 🎯 STEP 2.5: SMART AI DECISION MAKING
    const wordCount = message.split(' ').length;
    const lowerMsg = message.toLowerCase();

    // Tentukan complexity indicators
    const hasComplexIndicators = 
      (message.includes('?') && wordCount > 6) ||
      lowerMsg.includes('bagaimana cara') ||
      lowerMsg.includes('apakah ada program') ||
      lowerMsg.includes('mohon penjelasan') ||
      lowerMsg.includes('tolong jelaskan') ||
      (lowerMsg.includes('program') && lowerMsg.includes('khusus')) ||
      wordCount > 8;

    // JANGAN gunakan AI untuk pertanyaan sederhana
    const isRuleBasedQuestion = 
      lowerMsg.includes('halo') || 
      lowerMsg.includes('hai') ||
      lowerMsg.includes('hi ') ||
      lowerMsg.includes('hello') ||
      lowerMsg.includes('terima kasih') ||
      lowerMsg.includes('makasih') ||
      lowerMsg.includes('thanks') ||
      lowerMsg.includes('oke') ||
      lowerMsg.includes('ok ') ||
      lowerMsg.includes('baik') ||
      lowerMsg.includes('jam buka') ||
      lowerMsg.includes('lokasi') ||
      lowerMsg.includes('alamat') ||
      wordCount <= 3;

    // Gunakan AI jika:
    const shouldUseAI = 
      !isRuleBasedQuestion && 
      (ruleBasedResult.confidence < 0.3 || hasComplexIndicators);

    console.log(`AI Decision - Confidence: ${ruleBasedResult.confidence}, RuleBased: ${isRuleBasedQuestion}, Complex: ${hasComplexIndicators}, Use AI: ${shouldUseAI}`);

    if (shouldUseAI) {
      console.log('🔄 Trying AI...');
      const aiResponse = await generateAIResponse(message, {
        chatHistory: chatHistory.slice(-2),
        libraryContext: await getLibraryContext()
      });
      
      if (aiResponse) {
        console.log('✅ Using AI response');
        return res.status(200).json([{
          text: aiResponse,
          type: 'ai_generated',
          confidence: 0.8
        }]);
      } else {
        console.log('❌ AI not available, using rule-based fallback');
      }
    }
    
    // 🎯 STEP 3: Final fallback ke rule-based
    console.log(`Using rule-based response (confidence: ${ruleBasedResult.confidence})`);
    return res.status(200).json([{
      text: ruleBasedResult.response,
      type: 'rule_based',
      confidence: ruleBasedResult.confidence
    }]);
    
  } catch (error) {
    console.error('API ERROR:', error);
    return res.status(200).json([{ 
      text: "Maaf, sedang ada gangguan teknis. Silakan hubungi kami langsung di WhatsApp: +6285717147303",
      type: 'error'
    }]);
  }
}

// 🎯 **BOOK SPECIFIC QUESTIONS - FIXED VERSION**
async function handleBookSpecificQuestion(message) {
  const lowerMsg = message.toLowerCase().trim();
  
  // IMPROVED PATTERN DETECTION
  const isBookQuestion = 
    // Pattern langsung
    lowerMsg.includes('tentang apa') ||
    lowerMsg.includes('mengenai apa') ||
    lowerMsg.includes('abstrak') ||
    lowerMsg.includes('sinopsis') ||
    lowerMsg.includes('ringkasan') ||
    lowerMsg.includes('jelaskan buku') ||
    lowerMsg.includes('review buku') ||
    lowerMsg.includes('ceritakan buku') ||
    lowerMsg.includes('isi buku') ||
    // Pattern kombinasi
    (lowerMsg.includes('buku') && lowerMsg.includes('tentang')) ||
    (lowerMsg.includes('buku') && lowerMsg.includes('apa')) ||
    (lowerMsg.includes('judul') && lowerMsg.includes('tentang')) ||
    // Pattern untuk pertanyaan di akhir
    /tentang apa\??$/.test(lowerMsg) ||
    /mengenai apa\??$/.test(lowerMsg) ||
    // Pattern spesifik
    /^buku .+ tentang apa/i.test(message) ||
    /^judul .+ tentang apa/i.test(message);

  console.log('📖 Book question analysis:', {
    message: message,
    isBookQuestion: isBookQuestion,
    patterns: {
      hasTentangApa: lowerMsg.includes('tentang apa'),
      hasBuku: lowerMsg.includes('buku'),
      hasApa: lowerMsg.includes('apa'),
      endWithTentangApa: /tentang apa\??$/.test(lowerMsg),
      startWithBuku: /^buku .+ tentang apa/i.test(message)
    }
  });

  if (isBookQuestion) {
    console.log('📖 Book question detected - passing to AI');
    return await letAIHandleBookQuestion(message);
  }
  
  return null;
}

// 🎯 **LET AI HANDLE BOOK QUESTIONS**
async function letAIHandleBookQuestion(question) {
  try {
    // Cari buku yang mungkin relevan
    const keywords = extractPotentialKeywords(question);
    let bookContext = '';
    
    if (keywords) {
      const bookResults = await searchBooks(keywords);
      if (bookResults.length > 0) {
        bookContext = `INFORMASI BUKU YANG MUNGKIN RELEVAN:\n`;
        bookResults.slice(0, 2).forEach((book, index) => {
          bookContext += `\nBUKU ${index + 1}:\n`;
          bookContext += `- Judul: ${book.judul || 'Tidak tersedia'}\n`;
          bookContext += `- Pengarang: ${book.pengarang || 'Tidak diketahui'}\n`;
          bookContext += `- Penerbit: ${book.penerbit || 'Tidak diketahui'}\n`;
          if (book.tahun_terbit) bookContext += `- Tahun: ${book.tahun_terbit}\n`;
        });
      }
    }

    const aiResponse = await generateAIResponse(
      `Pertanyaan user tentang buku: "${question}"
      
${bookContext}

Jawablah pertanyaan tentang buku tersebut dengan informatif dan ramah. Jika ada informasi buku yang relevan, gunakanlah. Jika tidak, berikan jawaban umum.`,
      { libraryContext: await getLibraryContext() }
    );
    
    if (aiResponse) {
      return aiResponse;
    } else {
      // Fallback simple
      return `Untuk pertanyaan tentang buku "${question}", silakan:\n\n• Gunakan pencarian: "cari buku [judul/pengarang]"\n• Kunjungi meja referensi\n• Konsultasi dengan pustakawan`;
    }
    
  } catch (error) {
    console.error('AI book question error:', error);
    return `Untuk informasi detail tentang buku, silakan gunakan fitur pencarian atau konsultasi dengan pustakawan.`;
  }
}

// 🎯 **EXTRACT POTENTIAL KEYWORDS - IMPROVED**
function extractPotentialKeywords(query) {
  const stopWords = ['buku', 'judul', 'mengenai', 'tentang', 'apa', 'ini', 'itu', 'yang', 'di', 'ke', 'dari', 'dibawah', 'revolusi', 'bendera'];
  const words = query.toLowerCase()
    .replace(/[^\w\s]/g, '') // Hapus punctuation
    .split(' ')
    .filter(word => 
      !stopWords.includes(word) && 
      word.length > 2 &&
      !/^(tentang|mengenai|apa)$/.test(word) // Exclude question words
    );
  
  console.log('🔍 Extracted keywords:', words);
  
  return words.slice(0, 3).join(' ') || null;
}

// 🎯 **BOOK SEARCH**
async function handleBookSearch(message) {
  const lowerMsg = message.toLowerCase();
  
  const hasExplicitSearchWords = 
    (lowerMsg.includes('cari buku') || 
     lowerMsg.includes('carikan buku') ||
     lowerMsg.includes('pencarian buku') ||
     (lowerMsg.includes('cari') && lowerMsg.includes('judul'))) &&
    !lowerMsg.includes('?');
  
  const hasSimpleBookRequest = 
    (lowerMsg.includes('buku tentang') || 
     lowerMsg.includes('rekomendasi buku')) &&
    lowerMsg.split(' ').length <= 6;
  
  if (hasExplicitSearchWords || hasSimpleBookRequest) {
    const searchTerms = extractSearchTerms(message);
    console.log('Searching books for:', searchTerms);
    
    if (searchTerms && searchTerms.length > 2) {
      const bookResults = await searchBooks(searchTerms);
      
      if (bookResults.length > 0) {
        return formatBookResults(bookResults, searchTerms);
      } else {
        return `❌ Tidak ditemukan buku tentang "${searchTerms}".\n\nCoba kata kunci lain atau kunjungi katalog online.`;
      }
    }
  }
  return null;
}

// 🎯 **ENHANCED RULE-BASED DENGAN PATTERN LENGKAP**
async function handleEnhancedRuleBased(message) {
  const lowerMsg = message.toLowerCase();
  let bestMatch = { response: "", confidence: 0 };
  
  const intentPatterns = [
    // === GREETINGS & BASIC ===
    {
      patterns: ['hai', 'halo', 'hello', 'hi', 'hey'],
      response: "Halo! 👋 Ada yang bisa saya bantu?",
      confidence: 0.95
    },
    {
      patterns: ['selamat pagi'],
      response: "Selamat pagi! 🌅 Ada yang bisa saya bantu hari ini?",
      confidence: 0.9
    },
    {
      patterns: ['selamat siang'],
      response: "Selamat siang! ☀️ Ada yang bisa saya bantu?",
      confidence: 0.9
    },
    {
      patterns: ['selamat sore'],
      response: "Selamat sore! 🌇 Ada yang bisa saya bantu?",
      confidence: 0.9
    },
    {
      patterns: ['selamat malam'],
      response: "Selamat malam! 🌙 Ada yang bisa saya bantu?",
      confidence: 0.9
    },

    // === FASILITAS & LAYANAN UMUM ===
    {
      patterns: ['cara meminjam', 'cara pinjam', 'pinjam buku', 'meminjam buku'],
      response: "📚 **Cara Meminjam Buku:**\n1. Bawa kartu anggota\n2. Cari buku di web katalog buku langka / OPAC Perpusnas \n3. Isi formulir pemesanan buku \n4. Maksimal 5 buku\n5. Baca di tempat \n\n📍 **Buku Langka**: Hanya di Lantai 14, tidak boleh dipinjam keluar",
      confidence: 0.95
    },
    {
      patterns: ['jam', 'buka', 'tutup', 'operasional'],
      response: "🕐 **Jam Operasional** \n\n  **Layanan Buku Langka,** \n\n**Perpustakaan Nasional:**\n\n Senin-Jumat: 08.00-19.00 WIB \n\n Sabtu-Minggu: 09.00-16.00 WIB",
      confidence: 0.9
    },
    {
      patterns: ['lokasi', 'alamat', 'dimana', 'tempat'],
      response: "📍 **Alamat Layanan Buku Langka Perpustakaan Nasional RI:**\nGedung Fasilitas Layanan Perpustakaan Nasional\nJl. Medan Merdeka Selatan No.11, Lantai 14, Jakarta 10110",
      confidence: 0.9
    },
    {
      patterns: ['tidur', 'istirahat', 'ngantuk'],
      response: "Kami tidak menyediakan fasilitas khusus untuk tidur di perpustakaan. Namun, jika Anda tertidur karena kelelahan, itu merupakan hal yang wajar asalkan tidak mengganggu pengunjung lain.",
      confidence: 0.85
    },
    {
      patterns: ['colokan', 'stopkontak', 'ngecas', 'charger', 'listrik'],
      response: "⚡ **Fasilitas Stop Kontak:**\nSetiap lantai layanan kami menyediakan stop kontak listrik yang dapat digunakan secara gratis oleh pengunjung untuk keperluan charging device.",
      confidence: 0.9
    },
    {
      patterns: ['wifi', 'internet', 'hotspot'],
      response: "📶 **WiFi Perpustakaan Nasional:**\n• Nama: National Library of Indonesia\n• Password: smartlibrary\n• Kecepatan relatif cepat, tergantung jumlah pengguna\n• Gratis untuk semua pengunjung",
      confidence: 0.9
    },
    {
      patterns: ['ruang baca khusus','ruang baca', 'area baca', 'tempat baca', 'kursi baca'],
      response: "🪑 **Fasilitas Ruang Baca Khusus:**\n\n• Kursi ergonomis di setiap lantai\n\n• Meja baca dengan pencahayaan optimal\n\n• Hanya boleh ditempati oleh 1 orang (silent zone) di Lantai 9, 13 dan 14 \n\n• Syarat kartu anggota dan mengisi formulir \n\n**Fasilitas Ruang Diskusi:**\n\n• Ruang diskusi (discussion zone) hanya terdapat di Lantai 8, 16, 19 dan 24 \n\n• Syarat minimal 3 orang",
      confidence: 0.85
    },
    {
      patterns: ['toilet', 'wc', 'kamar mandi', 'restroom'],
      response: "🚻 **Fasilitas Toilet:**\n\n• Tersedia di setiap lantai layanan\n\n• Bersih dan terawat\n\n• Toilet disabilitas tersedia di lantai 7\n\n• Dilengkapi wastafel dan sabun",
      confidence: 0.9
    },

    // === BUKU & KOLEKSI ===
    {
      patterns: ['buku tertua', 'buku kuno', 'umur buku'],
      response: "📜 **Buku Tertua Perpustakaan Nasional:**\nJudul: **Bartoli Commentaria In Primam Digesti: Veteris Partem Doctiss...**\nTahun: **1547** (berumur 476 tahun!)\n\nBuku ini berisi ulasan terhadap kumpulan hukum Romawi 'Digesta seu Pandectae' bagian hukum lama oleh Bartolus de Saxoferrato, profesor ilmu hukum di Italia, yang disempurnakan oleh Petrus Paulus Parisius.",
      confidence: 0.9
    },
    {
      patterns: ['komik', 'cerita bergambar'],
      response: "🎨 **Koleksi Komik & Buku Bergambar:**\nTersedia di:\n• Layanan Monograf Tertutup (Lantai 12 & 13)\n• Layanan Monograf Terbuka (Lantai 21 & 22)\n• Layanan Anak (Lantai 7) untuk komik anak",
      confidence: 0.85
    },
    {
      patterns: ['buku jarang dibaca', 'paling sepi'],
      response: "Tidak ada buku yang benar-benar jarang dibaca. Setiap buku memiliki pembacanya tersendiri dengan minat dan kebutuhan yang berbeda-beda. Semua koleksi kami berharga!",
      confidence: 0.8
    },

    // === ATURAN & KEBIJAKAN ===
    {
      patterns: ['payung', 'hujan'],
      response: "☔ **Kebijakan Payung:**\nBoleh membawa payung saat hujan. Silakan keringkan terlebih dahulu di lobi dan titipkan di locker yang disediakan sebelum masuk ke ruang baca.",
      confidence: 0.9
    },
    {
      patterns: ['makanan', 'minuman', 'makan', 'minum'],
      response: "🚫 **Kebijakan Makanan & Minuman:**\nMakanan dan minuman tidak diperkenankan dibawa ke ruang baca koleksi. Area makan tersedia di lobi atau ruang khusus yang ditentukan.",
      confidence: 0.9
    },
    {
      patterns: ['anak', 'anak kecil', 'balita'],
      response: "👶 **Layanan Anak:**\nAnak kecil sangat diperkenankan mengunjungi perpustakaan! Kami menyediakan:\n• Layanan Anak di Lantai 7\n• Buku anak-anak yang sesuai usia\n• Area membaca yang nyaman dan aman",
      confidence: 0.9
    },

    // === FOTOKOPI & SCAN BUKU LANGKA ===
    {
      patterns: ['fotokopi', 'foto kopi', 'copy', 'photocopy', 'gandakan', 'menggandakan','photo copy','penggandaan'],
      response: `🚫 **Kebijakan Fotokopi Buku Langka:**\n\nBuku langka **tidak dapat difotokopi** dengan alasan:\n\n• **Pelestarian Koleksi** - Mencegah kerusakan fisik pada buku langka\n\n• **Nilai Historis** - Menjaga keaslian dan kondisi naskah kuno\n\n• **Kebijakan Konservasi** - Standar internasional untuk preservasi koleksi langka\n\n📚 **Alternatif yang tersedia:**\n\n• Baca di tempat di Lantai 14\n\n• Konsultasi dengan pustakawan untuk akses terbatas\n\n• Akses digital melalui platform Khastara (jika tersedia)`,
      confidence: 0.9
    },
    {
      patterns: ['scan', 'pindai', 'digitalisasi', 'foto digital', 'fotografi'],
      response: `📄 **Layanan Scan/Pindai Buku Langka:**\n\n**Permintaan scan buku langka dapat dilakukan dengan:**\n\n**1. Scan Mandiri:**\n\n   • Bawa device sendiri (hanya diperkenankan menggunakan smartphone, tidak menggunakan kamera profesional)\n\n   • Izin pustakawan terlebih dahulu\n\n   • Tidak menggunakan flash\n\n   • Tidak menekan buku berlebihan\n\n**2. Scan oleh Perpustakaan Nasional:**\n\n   • Mengikuti SOP yang berlaku\n\n   • Syarat dan ketentuan khusus\n\n   • Waktu proses sesuai kompleksitas\n\n   • Biaya administrasi berlaku\n\n**📞 Untuk informasi lengkap:**\nSilakan hubungi langsung pustakawan layanan di Lantai 14 atau melalui WhatsApp: +6285717147303`,
      confidence: 0.9
    },
  
    // === LAYANAN DIGITAL & E-BOOK ===
    {
      patterns: ['e-book', 'ebook','cara baca ebook','koleksi digital', 'digital', 'ipusnas', 'bintangpusnas', 'aplikasi perpus'],
      response: `📱 **Akses Layanan Digital Perpustakaan Nasional:**\n\n**📚 E-Book & Buku Digital:**\n\n• **IPUSNAS** - Aplikasi mobile untuk akses koleksi digital\n\n• **BintangPusnas Edu** - Platform pembelajaran digital\n\n**🌐 Jurnal Online & E-Resources:**\n• **E-Resources** - https://e-resources.perpusnas.go.id\n\n   - Jurnal internasional\n\n   - Database penelitian\n\n   - Artikel akademik\n\n**📜 Koleksi Langka Digital:**\n\n• **KHASTARA** - https://khastara.perpusnas.go.id/\n\n   - Koleksi langka hasil alih media\n   - Naskah kuno digital\n\n   - Buku Langka dan koleksi langka Perpustakaan Nasional Lainnya\n\n**💡 Tips:**\n\n• Download aplikasi IPUSNAS di Play Store/App Store\n\n• Akses gratis dengan kartu anggota Perpusnas\n\n• Konsultasi dengan pustakawan untuk bantuan akses`,
      confidence: 0.9
    },
    {
      patterns: ['khastara', 'buku digital','hasil scan','pdf', 'koleksi digital','hasil alih media', 'alih media', 'koleksi digital '],
      response: `🌐 **KHASTARA - Koleksi Digital Buku Langka:**\n\n**Akses melalui:** https://khastara.perpusnas.go.id/\n\n**Yang tersedia di Khastara:**\n\n• Naskah kuno terdigitalisasi\n\n• Buku langka hasil alih media\n\n• Majalah dan Surat Kabar Langka \n\n• Foto, Peta dan Lukisan\n\n**Keuntungan:**\n\n• Akses online 24/7\n\n• Tidak merusak fisik buku asli\n\n• Kualitas terjamin\n\n• Pencarian lebih mudah`,
      confidence: 0.85
    },
    {
      patterns: ['e-resources', 'cara baca jurnal','jurnal online', 'jurnal digital', 'jurnal', 'database online'],
      response: `💻 **E-Resources Perpustakaan Nasional:**\n\n**Akses melalui:** https://e-resources.perpusnas.go.id\n\n**Konten yang tersedia:**\n\n• Jurnal internasional bereputasi\n\n• Database penelitian global\n\n• Artikel akademik terbaru\n\n• E-book dari penerbit ternama\n\n• Prosiding konferensi\n\n**Syarat akses:**\n\n• Kartu anggota Perpusnas yang aktif\n\n• Akses dari dalam perpustakaan\n\n• Konsultasi dengan pustakawan referensi`,
      confidence: 0.85
    },

    // === SEJARAH & FAKTA UNIK ===
    {
      patterns: ['berdiri', 'didirikan', 'sejarah perpusnas'],
      response: "🏛️ **Sejarah Berdiri Perpustakaan Nasional:**\nPerpustakaan Nasional RI secara resmi didirikan pada **17 Mei 1980** melalui penggabungan empat perpustakaan:\n1. Perpustakaan Museum Nasional\n2. Perpustakaan Sejarah, Politik dan Sosial\n3. Perpustakaan Wilayah DKI Jakarta\n4. Bidang Bibliografi dan Deposit",
      confidence: 0.9
    },
    {
      patterns: ['hantu', 'mistis', 'angker'],
      response: "👻 **Fakta Unik:**\nBerdasarkan pengalaman beberapa pegawai dan pengunjung, ada cerita-cerita mistis di perpustakaan. Tapi jangan khawatir, suasana tetap nyaman untuk belajar dan membaca! 😊",
      confidence: 0.8
    },

    // === BUKU LANGKA - PROFESSIONAL ===
    {
      patterns: ['layanan buku langka', 'apa itu buku langka', 'pengertian buku langka', 'akses','rare book'],
      response: `📚 **Layanan Koleksi Buku Langka Perpustakaan Nasional**

**Pengertian Buku Langka:**
Koleksi Buku Langka adalah buku yang mengandung kekayaan informasi, bernilai historis serta kultural yang tinggi bagi ilmu pengetahuan dan berumur sekurang-kurangnya 50 tahun sejak diterbitkan.

**Sistem Layanan:**
\n• Close Access (Layanan Tertutup)
\n• Pengunjung tidak dapat masuk ke ruang koleksi
\n• Pustakawan yang akan mengambilkan koleksi sesuai permintaan
\n• Buku hanya dapat dibaca di tempat
\n• Tidak boleh dibawa keluar dari Lantai 14
\n• Tidak boleh dipinjam bawa pulang

**Prosedur Akses:**
1. Menjadi anggota Perpustakaan Nasional
2. Mencari judul buku di katalog koleksi buku langka
3. Mengisi formulir pemesanan
4. Menyerahkan kartu anggota sebagai jaminan
5. Pustakawan akan mengambilkan buku dari rak
6. Baca buku di area yang ditentukan
7. Kembalikan buku ke pustakawan dan ambil kartu anggota

**Lokasi:** Lantai 14 - Gedung Perpustakaan Nasional`,
      confidence: 0.95
    },
    {
      patterns: ['cara pinjam buku langka', 'pinjam buku','baca buku','akses buku','cara baca buku', 'cara baca','ambil ke rak','akses buku langka'],
      response: `📖 **Cara Mengakses Buku Langka:**

1. **Keanggotaan**: Pastikan sudah menjadi anggota Perpustakaan Nasional
2. **Pencarian**: Cari judul buku di katalog online koleksi buku langka
3. **Formulir**: Isi formulir pemesanan buku di meja sirkulasi Lantai 14
4. **Jaminan**: Serahkan kartu anggota sebagai jaminan
5. **Penyerahan**: Pustakawan akan mengambilkan buku dari rak tertutup
6. **Pembacaan**: Baca buku di area yang telah ditentukan (tidak boleh dibawa keluar)
7. **Pengembalian**: Kembalikan buku ke pustakawan dan ambil kartu anggota

**Catatan:** Buku langka tidak boleh dipinjam bawa pulang atau dibawa keluar dari Lantai 14.`,
      confidence: 0.9
    },
    {
      patterns: ['syarat buku langka', 'kriteria buku langka'],
      response: `📜 **Kriteria Buku Langka:**

Buku dikategorikan sebagai **buku langka** jika memenuhi kriteria:
• Berumur minimal **50 tahun** sejak diterbitkan
• Memiliki **nilai historis** yang tinggi
• Mengandung **kekayaan informasi** kultural
• Bernilai penting bagi **ilmu pengetahuan**
• Kondisi fisik yang memerlukan perlakuan khusus

Koleksi buku langka kami mendapatkan perawatan khusus untuk menjaga kelestariannya.`,
      confidence: 0.9
    },

    // === ANGGOTA & PENDAFTARAN ===
    {
      patterns: ['anggota', 'keanggotaan', 'syarat', 'daftar', 'kartu'],
      response: "📝 **Syarat Keanggotaan Perpustakaan Nasional:**\n\n• KTP / KK / Paspor yang masih berlaku\n\n• Mengisi formulir pendaftaran online/offline\n\n• Validasi keanggotaan di lantai 2\n\n• **Gratis** - tidak ada biaya pendaftaran\n\n• Proses: ±3 menit setelah validasi",
      confidence: 0.9
    },
    {
      patterns: ['ganti kartu', 'kartu hilang', 'kartu rusak', 'kartu anggota hilang'],
      response: "🔄 **Penggantian Kartu Anggota:**\n\n• **Syarat**: Bawa KTP asli & surat kehilangan (jika hilang) dari kepolisian \n\n •lapor ke meja layanan keanggotaan\n• **Biaya**: Gratis (selama ketersediaan kartu anggota masih ada)\n\n• **Proses**: ±10 menit setelah verifikasi\n\n• **Lokasi**: Lantai 2 - Layanan Keanggotaan",
      confidence: 0.9
    },

    // === KONTAK ===
    {
      patterns: ['kontak', 'telpon', 'telepon', 'email', 'hubungi', 'whatsapp'],
      response: "📞 **Kontak Perpustakaan Nasional:**\n\n• WhatsApp: +6285717147303\n\n• Email: info_pujasintara@perpusnas.go.id\n\n• Alamat: Jl. Medan Merdeka Selatan No.11, Jakarta\n\n• Layanan: Senin-Jumat 08.00-19.00, Sabtu-Minggu 09.00-16.00",
      confidence: 0.9
    },

    // === LAYANAN LAINNYA ===
    {
      patterns: ['layanan', 'fasilitas', 'apa saja layanan'],
      response: "📋 **Layanan Koleksi Buku Langka, Perpustakaan Nasional:**\n• Peminjaman buku reguler \n• Peminjaman ruang baca khusus \n• Koleksi buku langka \n• Ruang baca nyaman\n• WiFi gratis\n• Konsultasi pustakawan \n• Pencarian katalog spesifik",
      confidence: 0.85
    },

    // === POLITE RESPONSES ===
    {
      patterns: ['terima kasih', 'makasih', 'thanks', 'thank you'],
      response: "Sama-sama! 😊 Senang bisa membantu. Jika ada pertanyaan lain, silakan tanyakan!",
      confidence: 0.95
    },
    {
      patterns: ['baik', 'oke', 'okay'],
      response: "Baik! 😊 Kalau ada yang lain yang bisa dibantu, silakan tanyakan ya!",
      confidence: 0.9
    },
    {
      patterns: ['bye', 'dadah', 'selamat tinggal', 'sampai jumpa'],
      response: "Terima kasih sudah berkunjung! 👋 Sampai jumpa lagi di Perpustakaan Nasional!",
      confidence: 0.9
    },
    
    // 🎯 TAMBAHAN PATTERN UNTUK REDUCE AI LOAD
    {
      patterns: ['locker', 'loker', 'penitipan barang', 'titip barang'],
      response: "🗄️ **Fasilitas Locker:**\n\n• Tersedia di setiap lantai layanan\n• **Gratis** - tidak ada biaya sewa\n• Bawa kunci sendiri atau gunakan sistem pin\n• **Tidak boleh**: Makanan, minuman, barang berharga\n• Buka dari jam operasional perpustakaan",
      confidence: 0.9
    },
    {
      patterns: ['denda', 'telat', 'keterlambatan', 'denda buku'],
      response: "💰 **Kebijakan Denda:**\n\n• **Buku reguler**: Rp 2.000/hari/buku\n• **Maksimal denda**: Rp 50.000 per buku\n• **Cara bayar**: Langsung di meja sirkulasi\n• **Pembayaran**: Tunai atau QRIS\n• **Peringatan**: Tidak bisa pinjam jika ada denda",
      confidence: 0.9
    },
    {
      patterns: ['opac', 'katalog online', 'catalog', 'pencarian katalog'],
      response: "💻 **Katalog Online (OPAC):**\n\n• **Akses**: https://opac.perpusnas.go.id\n• **Fitur**: Pencarian judul, pengarang, subjek\n• **Ketersediaan**: Cek status buku (tersedia/dipinjam)\n• **Lokasi**: Lihat nomor panggil untuk penelusuran\n• **Bantuan**: Pustakawan referensi siap membantu pencarian",
      confidence: 0.9
    },
    {
      patterns: ['sanksi', 'pelanggaran', 'merusak buku', 'buku rusak'],
      response: "⚖️ **Sanksi Pelanggaran:**\n\n• **Merusak buku**: Ganti rugi sesuai nilai buku\n• **Hilangkan buku**: Ganti dengan buku sama atau bayar 2x harga\n• **Tertib**: Dikeluarkan jika mengganggu pengunjung lain\n• **Pelanggaran berat**: Dicabut keanggotaannya",
      confidence: 0.85
    }
  ];

  // === SEARCH FOR BEST MATCH ===
  for (const intent of intentPatterns) {
    for (const pattern of intent.patterns) {
      if (lowerMsg.includes(pattern)) {
        const words = lowerMsg.split(' ');
        const patternWords = pattern.split(' ');
        
        let matchQuality = 0;
        
        // Exact phrase match = high confidence
        if (lowerMsg.includes(pattern) && patternWords.length > 1) {
          matchQuality = 0.8;
        } 
        // Single word match in complex question = lower confidence
        else if (patternWords.length === 1 && words.length > 4) {
          matchQuality = 0.4;
        }
        // Single word match in simple question = medium confidence  
        else {
          matchQuality = 0.6;
        }
        
        const totalConfidence = Math.min(0.95, intent.confidence * matchQuality);
        
        if (totalConfidence > bestMatch.confidence) {
          bestMatch = {
            response: intent.response,
            confidence: totalConfidence
          };
        }
      }
    }
  }

  // === FALLBACK FOR UNKNOWN QUESTIONS ===
  if (bestMatch.confidence < 0.3) {
    bestMatch = {
      response: `Halo! Saya asisten Perpustakaan Nasional. 

Beberapa hal yang bisa saya bantu:
\n📚 **Cari Buku** - "cari buku [topik]" 
\n🕐 **Jam & Lokasi** - jam buka, alamat
\n📝 **Keanggotaan** - syarat jadi anggota  
\n📞 **Kontak** - WhatsApp, email
\n💻 **Layanan Digital** - e-book, akses online
\n📖 **Buku Langka** - prosedur akses koleksi langka

Atau tanyakan hal spesifik lainnya!`,
      confidence: 0.1
    };
  }

  return bestMatch;
}

// 🎯 **FUNGSI BANTU**
async function getLibraryContext() {
  return `Perpustakaan Nasional: Buka Senin-Jumat 08.00-19.00, Sabtu-Minggu 09.00-16.00. Alamat: Jl. Medan Merdeka Selatan No.11, Jakarta. Layanan: peminjaman buku, koleksi langka, ruang baca, WiFi gratis.`;
}

function extractSearchTerms(query) {
  const stopWords = ['cari', 'carikan', 'rekomendasi', 'buku', 'tentang', 'apa', 'ada', 'yang', 'di', 'ke'];
  const words = query.toLowerCase().split(' ');
  const searchTerms = words.filter(word => 
    !stopWords.includes(word) && word.length > 2
  ).join(' ');
  
  return searchTerms || 'buku';
}

async function searchBooks(searchTerm) {
  try {
    const { data, error } = await supabase
      .from('books')
      .select('id, judul, pengarang, penerbit, tahun_terbit, deskripsi_fisik, nomor_panggil')
      .or(`judul.ilike.%${searchTerm}%,pengarang.ilike.%${searchTerm}%,penerbit.ilike.%${searchTerm}%`)
      .limit(5);

    if (error) {
      console.error('Database error:', error);
      return [];
    }
    
    return data || [];
    
  } catch (error) {
    console.error('Search error:', error);
    return [];
  }
}

function formatBookResults(books, searchTerm) {
  if (books.length === 0) return `❌ Tidak ditemukan buku tentang "${searchTerm}"`;
  
  let response = `📚 Ditemukan ${books.length} buku tentang "${searchTerm}":\n\n`;
  
  books.slice(0, 3).forEach((book, index) => {
    response += `${index + 1}. ${book.judul || 'Judul tidak tersedia'}\n`;
    response += `   👤 ${book.pengarang || 'Pengarang tidak diketahui'}\n`;
    response += `   🏢 ${book.penerbit || 'Penerbit tidak diketahui'}\n`;
    response += `   📅 ${book.tahun_terbit || 'Tahun tidak diketahui'}\n`;
    
    if (book.nomor_panggil) {
      response += `   📍 No. Panggil: ${book.nomor_panggil}\n`;
    }
    
    response += `\n`;
  });

  if (books.length > 3) {
    response += `...dan ${books.length - 3} buku lainnya.\n\n`;
  }
  
  response += `🔍 Tips: Kunjungi katalog online untuk pencarian lebih detail!`;
  
  return response;
}
