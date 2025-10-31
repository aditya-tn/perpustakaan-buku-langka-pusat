export default function handler(req, res) {
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
    
    // 🎯 RESPONSES LENGKAP - DITAMBAH BANYAK INTENT
    let responseText = "";
    const lowerMsg = message.toLowerCase();
    
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
      responseText = "📚 Cara meminjam buku:\n1. Bawa kartu anggota\n2. Datang ke meja sirkulasi\n3. Maksimal 5 buku untuk 14 hari\n4. Bisa diperpanjang 1x jika tidak ada waiting list";
    }
    
    // === MEMBERSHIP ===
    else if (lowerMsg.includes('anggota') || lowerMsg.includes('syarat') || lowerMsg.includes('daftar') || lowerMsg.includes('kartu')) {
      responseText = "📝 Syarat jadi anggota:\n• KTP asli\n• Formulir pendaftaran\n• Pas foto 3x4 (2 lembar)\n• Biaya: Gratis\n• Proses: 1 hari kerja";
    }
    
    // === CONTACT ===
    else if (lowerMsg.includes('kontak') || lowerMsg.includes('telpon') || lowerMsg.includes('telepon') || lowerMsg.includes('email') || lowerMsg.includes('hubungi')) {
      responseText = "📞 Kontak kami:\n• Telp: (021) 1234567\n• Email: info_pujasintara@perpusnas.go.id\n• WhatsApp: 0812-3456-7890\n• Lokasi: Gedung Perpustakaan Nasional Lantai 14";
    }
    
    // === SERVICES ===
    else if (lowerMsg.includes('layanan') || lowerMsg.includes('fasilitas') || lowerMsg.includes('apa saja')) {
      responseText = "📋 Layanan kami:\n• Peminjaman buku umum\n• Koleksi buku langka\n• Ruang baca nyaman\n• WiFi gratis\n• Fotokopi & scan\n• Konsultasi pustakawan\n• Digital repository";
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
      responseText = "Halo! Saya asisten Perpustakaan Nasional. Tanyakan tentang:\n• Jam buka & lokasi\n• Peminjaman buku\n• Syarat keanggotaan\n• Kontak kami\n• Layanan perpustakaan\n• Koleksi buku langka";
    }
    
    console.log('Sending response:', responseText);
    
    // RETURN THE EXACT FORMAT CHATBOT EXPECTS
    return res.status(200).json([{ text: responseText }]);
    
  } catch (error) {
    console.error('API ERROR:', error);
    // Return valid response even on error
    return res.status(200).json([{ 
      text: "Maaf, sedang ada gangguan teknis. Silakan hubungi kami langsung di (021) 1234567." 
    }]);
  }
}
