import { supabase } from '../../lib/supabase'

export default async function handler(req, res) {
  console.log('=== API CHAT CALLED ===');
  console.log('Method:', req.method);
  
  // Only allow POST
  if (req.method !== 'POST') {
    console.log('Method not allowed');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('Request body:', req.body);
    
    const { message } = req.body;
    
    // Validate
    if (!message) {
      console.log('No message provided');
      return res.status(400).json({ error: 'Message is required' });
    }
    
    console.log('Processing message:', message);
    
    const lowerMsg = message.toLowerCase();
    
    // 🎯 **FITUR BARU: BOOK SEARCH - BACA DATABASE**
    if (lowerMsg.includes('cari') || lowerMsg.includes('carikan') || 
        lowerMsg.includes('buku tentang') || lowerMsg.includes('rekomendasi') ||
        lowerMsg.includes('ada buku') || lowerMsg.includes('koleksi') ||
        lowerMsg.includes('pengarang') || lowerMsg.includes('judul')) {
      
      const searchTerms = extractSearchTerms(message);
      console.log('Searching books for:', searchTerms);
      
      if (searchTerms) {
        const bookResults = await searchBooks(searchTerms);
        
        if (bookResults.length > 0) {
          const responseText = formatBookResults(bookResults, searchTerms);
          return res.status(200).json([{ text: responseText }]);
        } else {
          return res.status(200).json([{ 
            text: `❌ Maaf, tidak ditemukan buku tentang "${searchTerms}".\n\nCoba kata kunci lain atau kunjungi katalog online kami.` 
          }]);
        }
      }
    }
    
    // 🎯 **PERTANYAAN LAIN YANG SUDAH ADA - TIDAK BERUBAH**
    let responseText = "";
    
    // === GREETINGS ===
    if (lowerMsg.includes('hai') || lowerMsg.includes('halo') || lowerMsg.includes('hello')) {
      responseText = "Halo! 👋 Ada yang bisa saya bantu?";
    }
    else if (lowerMsg.includes('selamat pagi')) {
      responseText = "Selamat pagi! 🌅 Ada yang bisa saya bantu hari ini?";
    }
    else if (lowerMsg.includes('selamat siang')) {
      responseText = "Selamat siang! ☀️ Ada yang bisa saya bantu?";
    }
    else if (lowerMsg.includes('selamat sore')) {
      responseText = "Selamat sore! 🌇 Ada yang bisa saya bantu?";
    }
    else if (lowerMsg.includes('selamat malam')) {
      responseText = "Selamat malam! 🌙 Ada yang bisa saya bantu?";
    }
    else if (lowerMsg.includes('selamat')) {
      responseText = "Halo! 👋 Selamat datang di Perpustakaan Nasional. Ada yang bisa saya bantu?";
    }
    
    // === OPERATIONAL HOURS ===
    else if (lowerMsg.includes('jam') || lowerMsg.includes('buka') || lowerMsg.includes('operasional')) {
      responseText = "🕐 Perpustakaan buka:\n• Senin-Jumat: 08.00-19.00\n• Sabtu-Minggu: 09.00-16.00";
    }
    
    // === LOCATION ===
    else if (lowerMsg.includes('lokasi') || lowerMsg.includes('alamat') || lowerMsg.includes('dimana')) {
      responseText = "📍 Gedung Perpustakaan Nasional Lantai 14\nJl. Medan Merdeka Selatan No.11, Jakarta";
    }
    
    // === BOOK BORROWING ===
    else if (lowerMsg.includes('pinjam') || lowerMsg.includes('buku') || lowerMsg.includes('meminjam')) {
      responseText = "📚 Cara meminjam buku:\n1. Bawa kartu anggota\n2. Datang ke meja sirkulasi\n3. Maksimal 5 buku untuk sekali pinjam\n4. Buku hanya bisa dibaca ditempat ya, tidak diperkenankan dibawa ke lantai lain";
    }
    
    // === MEMBERSHIP ===
    else if (lowerMsg.includes('anggota') || lowerMsg.includes('syarat') || lowerMsg.includes('daftar') || lowerMsg.includes('kartu')) {
      responseText = "📝 Syarat jadi anggota:\n• KTP asli / Pasport\n• Mengisi formulir pendaftaran pada laman keanggotaan.perpusnas.go.id\n• Validasi keanggotaan di lantai 2 gedung layanan perpustakaan Jl. Medan Merdeka Selatan No.11\n• Biaya: Gratis\n• Proses: 3 menit";
    }
    
    // === CONTACT ===
    else if (lowerMsg.includes('kontak') || lowerMsg.includes('telpon') || lowerMsg.includes('telepon') || lowerMsg.includes('email') || lowerMsg.includes('hubungi')) {
      responseText = "📞 Kontak kami:\n• Whatsapp +6285717147303\n• Email: info_pujasintara@perpusnas.go.id \n• Lokasi: Gedung Perpustakaan Nasional Lantai 14";
    }
    
    // === SERVICES ===
    else if (lowerMsg.includes('layanan') || lowerMsg.includes('fasilitas') || lowerMsg.includes('apa saja')) {
      responseText = "📋 Layanan kami:\n• Peminjaman buku \n• Peminjaman ruang baca khusus \n• Koleksi buku langka\n• Ruang baca nyaman\n• WiFi gratis \n• Konsultasi pustakawan\n• Database mandiri";
    }
    
    // === RARE BOOKS ===
    else if (lowerMsg.includes('langka') || lowerMsg.includes('kuno') || lowerMsg.includes('sejarah') || lowerMsg.includes('naskah')) {
      responseText = "📜 Koleksi Buku Langka:\n• Akses terbatas (ruang khusus)\n• Syarat: penelitian akademis\n• Tidak boleh dipinjam bawa pulang\n• Hanya boleh dibaca di tempat\n• Wajib pakai sarung tangan";
    }
    
    // === POLITE RESPONSES ===
    else if (lowerMsg.includes('terima kasih') || lowerMsg.includes('makasih') || lowerMsg.includes('thanks') || lowerMsg.includes('thank you')) {
      responseText = "Sama-sama! 😊 Senang bisa membantu. Jika ada pertanyaan lain, silakan tanyakan!";
    }
    else if (lowerMsg.includes('baik') || lowerMsg.includes('oke') || lowerMsg.includes('okay')) {
      responseText = "Baik! 😊 Kalau ada yang lain yang bisa dibantu, silakan tanyakan ya!";
    }
    else if (lowerMsg.includes('bye') || lowerMsg.includes('dadah') || lowerMsg.includes('selamat tinggal') || lowerMsg.includes('sampai jumpa')) {
      responseText = "Terima kasih sudah berkunjung! 👋 Sampai jumpa lagi di Perpustakaan Nasional!";
    }
    
    // === FALLBACK ===
    else {
      responseText = "Halo! Saya asisten Perpustakaan Nasional. Tanyakan tentang:\n• Jam buka & lokasi\n• Peminjaman buku\n• Syarat keanggotaan\n• Kontak kami\n• Layanan perpustakaan\n• Koleksi buku langka\n• **Cari buku** (contoh: 'cari buku sejarah')";
    }
    
    console.log('Sending response:', responseText);
    return res.status(200).json([{ text: responseText }]);
    
  } catch (error) {
    console.error('API ERROR:', error);
    return res.status(200).json([{ 
      text: "Maaf, sedang ada gangguan teknis. Silakan hubungi kami langsung di WhatsApp: +6285717147303" 
    }]);
  }
}

// 🎯 **FUNGSI BARU UNTUK BACA DATABASE**
function extractSearchTerms(query) {
  const stopWords = ['cari', 'carikan', 'rekomendasi', 'buku', 'tentang', 'apa', 'ada', 'yang', 'di', 'ke', 'dengan', 'oleh'];
  const words = query.toLowerCase().split(' ');
  const searchTerms = words.filter(word => 
    !stopWords.includes(word) && word.length > 2
  ).join(' ');
  
  return searchTerms || 'buku';
}

// 🎯 **FUNGSI SEARCH DI DATABASE - SESUAI STRUCTURE ANDA**
async function searchBooks(searchTerm) {
  try {
    console.log('Searching database for:', searchTerm);
    
    const { data, error } = await supabase
      .from('books')  // Ganti dengan nama table yang benar
      .select('id, judul, pengarang, penerbit, tahun_terbit, deskripsi_fisik, nomor_panggil')
      .or(`judul.ilike.%${searchTerm}%,pengarang.ilike.%${searchTerm}%,penerbit.ilike.%${searchTerm}%`)
      .limit(5);

    if (error) {
      console.error('Database error:', error);
      return [];
    }
    
    console.log('Found books:', data?.length || 0);
    return data || [];
    
  } catch (error) {
    console.error('Search error:', error);
    return [];
  }
}

// 🎯 **FORMAT HASIL PENCARIAN - SESUAI KOLOM ANDA**
function formatBookResults(books, searchTerm) {
  if (books.length === 0) return `❌ Tidak ditemukan buku tentang "${searchTerm}"`;
  
  let response = `📚 Ditemukan ${books.length} buku tentang "${searchTerm}":\n\n`;
  
  books.slice(0, 3).forEach((book, index) => {
    response += `${index + 1}. **${book.judul || 'Judul tidak tersedia'}**\n`;
    response += `   👤 ${book.pengarang || 'Pengarang tidak diketahui'}\n`;
    response += `   🏢 ${book.penerbit || 'Penerbit tidak diketahui'}\n`;
    response += `   📅 ${book.tahun_terbit || 'Tahun tidak diketahui'}\n`;
    
    if (book.nomor_panggil) {
      response += `   📍 No. Panggil: ${book.nomor_panggil}\n`;
    }
    
    if (book.deskripsi_fisik) {
      response += `   📖 ${book.deskripsi_fisik.substring(0, 80)}...\n`;
    }
    
    response += `\n`;
  });

  if (books.length > 3) {
    response += `...dan ${books.length - 3} buku lainnya.\n\n`;
  }
  
  response += `🔍 **Tips**: Kunjungi katalog online untuk pencarian lebih detail!`;
  
  return response;
}
