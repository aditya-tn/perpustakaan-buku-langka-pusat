// pages/api/chat.js
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { message, conversationHistory = [] } = req.body;

    // Prepare messages for DeepSeek
    const messages = [
      {
        role: 'system',
        content: `Anda adalah AI Pustakawan yang membantu pengguna Perpustakaan Nasional RI. 
Tugas Anda:
1. Bantu pencarian dan rekomendasi buku koleksi langka
2. Jelaskan prosedur layanan perpustakaan  
3. Jawab dalam Bahasa Indonesia yang sopan dan ramah
4. Untuk istilah teknis bisa gunakan bilingual
5. Cari daftar buku sesuai permintaan, baik itu berbahasa indonesia maupun bahasa lain
5. Jika tidak tahu, jangan mengarang jawaban
6. Arahkan ke fitur pencarian di beranda untuk detail buku

Informasi penting:
- Jam operasional: Senin-Jumat 08.00-19.00, Sabtu-Minggu 09.00-16.00
- Lokasi: Gedung Perpustakaan Nasional Lantai 14, Jl. Medan Merdeka Selatan Nomor 11, Gambir, Jakarta Pusat
- Email: info_pujasintara@perpusnas.go.id
- Koleksi: 85,000+ judul buku langka untuk sekarang, kami sedang memperbaharui pendaatan data koleksi
- Syarat akses: Isi pemesanan, bawa Kartu anggota / identitas asli, pustakawan akan mengambilkan koleksi, koleksi hanya baca di tempat
- Pemesanan buku langka atau ruang baca khusus : Online via website

Untuk pertanyaan spesifik buku, sarankan menggunakan fitur pencarian di beranda.`
      },
      ...conversationHistory,
      {
        role: 'user',
        content: message
      }
    ];

    console.log('Calling DeepSeek API with message:', message);

    // Call DeepSeek API
    const response = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: messages,
        max_tokens: 1000,
        temperature: 0.7,
        stream: false
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('DeepSeek API error:', response.status, errorText);
      throw new Error(`DeepSeek API error: ${response.status}`);
    }

    const data = await response.json();
    console.log('DeepSeek API response:', data);
    
    // Extract the response content
    const aiResponse = data.choices[0]?.message?.content || 'Maaf, saya tidak dapat memproses pertanyaan Anda saat ini.';

    // Save to conversation history
    const updatedHistory = [
      ...conversationHistory,
      { role: 'user', content: message },
      { role: 'assistant', content: aiResponse }
    ].slice(-8); // Keep last 8 messages

    res.status(200).json({
      response: aiResponse,
      conversationHistory: updatedHistory
    });

  } catch (error) {
    console.error('Chat API error:', error);
    res.status(500).json({ 
      error: 'Terjadi kesalahan internal. Silakan coba lagi.',
      response: 'Maaf, terjadi gangguan teknis. Silakan hubungi pustakawan kami di (021) 5220100 ext. 1234 atau coba lagi nanti.'
    });
  }
}
