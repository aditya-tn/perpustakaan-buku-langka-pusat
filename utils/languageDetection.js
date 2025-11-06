// utils/languageDetection.js - SUPER ENHANCED VERSION
// Comprehensive language detection dengan extensive vocabulary

// Helper untuk menghitung dominance score dengan advanced weighting
const calculateLanguageDominance = (text, languagePatterns) => {
  const scores = {};
  const textLower = text.toLowerCase();
  const words = textLower.split(/\s+/).filter(word => word.length > 2);
  const totalWords = words.length;
  
  Object.entries(languagePatterns).forEach(([lang, patterns]) => {
    scores[lang] = 0;
    
    // Score berdasarkan regex patterns
    patterns.forEach(regex => {
      const matches = textLower.match(regex);
      if (matches) {
        // Beri score lebih tinggi untuk matches yang lebih spesifik
        const weight = regex.source.includes('\\b') ? 3 : 2; // Higher weight untuk whole word matches
        scores[lang] += matches.length * weight;
      }
    });
    
    // Additional scoring berdasarkan word frequency dan uniqueness
    words.forEach(word => {
      if (patterns.some(regex => regex.test(word))) {
        // Higher weight untuk kata yang lebih panjang dan meaningful
        const wordWeight = word.length > 5 ? 4 : 3;
        scores[lang] += wordWeight;
      }
    });
    
    // Bonus untuk density (persentase kata yang match)
    const matchedWords = words.filter(word => 
      patterns.some(regex => regex.test(word))
    ).length;
    
    if (totalWords > 0) {
      const density = matchedWords / totalWords;
      scores[lang] += Math.round(density * 20); // Bonus density
    }
  });
  
  return scores;
};

// SUPER COMPREHENSIVE LANGUAGE PATTERNS
export const detectLanguage = (text) => {
  if (!text || typeof text !== 'string') return 'id';
  
  try {
    const textLower = text.toLowerCase().trim();
    if (textLower.length < 3) return 'id';
    
    // EXTENSIVE PATTERN SYSTEM dengan vocabulary yang sangat lengkap
    const languagePatterns = {
      'id': [
        // INDONESIAN CORE - HIGH WEIGHT
        /\b(sejarah|budaya|sastra|hukum|politik|ekonomi|sosial|pendidikan|masyarakat|pemerintah|negara|bangsa|indonesia|nusantara|daerah|tradisi|adat|kesenian|warisan|kebudayaan|perkembangan|studi|analisis|penelitian|pembangunan|transformasi|modernisasi|reformasi|revolusi|evolusi|kontemporer|tradisional|klasik|modern|kuno|koleksi|arsip|dokumen|manuskrip|naskah|prasasti|artefak|peninggalan|warisan|pusaka|heritage|cagar|budaya)\b/gi,
        
        // INDONESIAN ACADEMIC & INSTITUTIONAL
        /\b(universitas|institut|sekolah|madrasah|pesantren|perguruan|tinggi|akademi|politeknik|fakultas|jurusan|program|studi|departemen|kementerian|kantor|lembaga|organisasi|asosiasi|yayasan|foundation|institute|center|pusat|balai|museum|perpustakaan|arsip|nasional)\b/gi,
        
        // INDONESIAN GEOGRAPHICAL
        /\b(jawa|sumatra|sumatera|kalimantan|sulawesi|papua|bali|ntb|ntt|maluku|ambon|aceh|medan|padang|palembang|lampung|bengkulu|jambi|riau|jakarta|bogor|depok|tangerang|bekasi|bandung|semarang|yogyakarta|surabaya|malang|surakarta|solo|makassar|manado|balikpapan|samarinda|banjarmasin|pontianak|palangkaraya|denpasar|mataram|kupang|jayapura|manokwari)\b/gi,
        
        // INDONESIAN CULTURAL & RELIGIOUS
        /\b(islam|muslim|quran|hadis|fiqh|tauhid|sharia|syariah|allah|muhammad|nabi|rasul|iman|shalat|zakat|puasa|haji|sunni|syiah|tasawuf|tarikat|ulama|kyai|ustadz|pesantren|madrasah|masjid|musholla|surau|gereja|kristen|protestan|katolik|hindu|buddha|buddhis|konghucu|kepercayaan|animisme|dinamisme|tradisi|upacara|ritual|adatistiadat)\b/gi,
        
        // INDONESIAN COMMON PARTICLES & GRAMMAR
        /\b(yang|dan|di|ke|dari|untuk|pada|dengan|ini|itu|tidak|akan|ada|atau|juga|dalam|dapat|saat|lebih|orang|telah|oleh|karena|namun|sebagai|masih|sama|atas|bawah|depan|belakang|kiri|kanan|sana|sini|situ|mari|pergi|datang|lihat|dengar|baca|tulis|buka|tutup|besar|kecil|panjang|pendek|tinggi|rendah|baru|lama|cepat|lambat)\b/gi,
        
        // INDONESIAN PREFIXES/SUFFIXES
        /(pe\w+|me\w+|ber\w+|ter\w+|di\w+|\w+kan|\w+nya|\w+lah|\w+pun|\w+ku|\w+mu|\w+nya)\b/gi,
        
        // INDONESIAN PROFESSIONS & TITLES
        /\b(profesor|doktor|dosen|guru|peneliti|ilmuwan|sejarawan|budayawan|sastrawan|penulis|pengarang|penyair|seniman|pelukis|pematung|musisi|aktor|aktris|sutradara|produser|jurnalis|wartawan|editor|penerbit|distributor|kurator|arsiparis|pustakawan)\b/gi
      ],

      'ms': [ // MALAY LANGUAGE - COMPREHENSIVE
        // MALAY CORE - HIGH WEIGHT
        /\b(sejarah|budaya|sastera|undang|politik|ekonomi|sosial|pendidikan|masyarakatkat|kerajaan|negara|bangsa|melayu|nusantara|tradisi|adat|kesenian|warisan|kebudayaan|perkembangan|kajian|analisis|penyelidikan|pembangunan|transformasi|pembaharuan|revolusi|evolusi|kontemporer|tradisional|klasik|moden|kuno|koleksi|arkib|dokumen|manuskrip|naskhah|prasasti|artefak|tinggalan|warisan|pusaka|cagar|budaya)\b/gi,
        
        // MALAY ACADEMIC & INSTITUTIONAL
        /\b(universiti|institut|sekolah|madrasah|pondok|perguruan|tinggi|akademi|politeknik|fakulti|jurusan|program|pengajian|jabatan|kementerian|pejabat|lembaga|pertubuhan|persatuan|yayasan|institut|pusat|balai|muzium|perpustakaan|arkib|kebangsaan)\b/gi,
        
        // MALAY GEOGRAPHICAL
        /\b(melayu|malaysia|singapura|brunei|patani|sumatera|kalimantan|sulawesi|jawa|bali|aceh|minangkabau|bugis|makassar|banjar|dayak|ambon|maluku|jakarta|kuala|lumpur|penang|johor|kelantan|terengganu|pahang|perak|selangor|negeri|sembilan|melaka|perlis|sabah|sarawak|labuan|putrajaya|cyberjaya|shah|alam|petaling|jaya|subang|jaya|kuching|kota|kinabalu|sandakan|tawau)\b/gi,
        
        // MALAY CULTURAL & RELIGIOUS
        /\b(islam|muslim|quran|hadis|fiqh|tauhid|sharia|syariah|allah|muhammad|nabi|rasul|iman|solat|zikir|sedekah|puasa|haji|sunni|syiah|tasawuf|tarekat|ulama|ustaz|pondok|madrasah|masjid|surau|gereja|katolik|hindu|buddha|kepercayaan|animisme|tradisi|upacara|ritual|adatistiadat)\b/gi,
        
        // MALAY COMMON PARTICLES & GRAMMAR
        /\b(yang|dan|di|ke|dari|untuk|pada|dengan|ini|itu|tidak|akan|ada|atau|juga|dalam|boleh|apabila|lebih|orang|telah|oleh|kerana|tetapi|sebagai|masih|sama|atas|bawah|hadapan|belakang|kiri|kanan|sana|sini|situ|mari|pergi|datang|lihat|dengar|baca|tulis|buka|tutup|besar|kecil|panjang|pendek|tinggi|rendah|baru|lama|cepat|perlahan)\b/gi,
        
        // MALAY SPECIFIC UNIQUE WORDS
        /\b(sastera|kerajaan|masyarakatkat|penyelidikan|kebangsaan|kemerdekaan|kebudayaan|kesusasteraan|perlembagaan|persekutuan|kesultanan|raja|sultan|permaisuri|puteri|puteri|tengku|tunku|engku|wan|nik|megat|puteri|sharifah|syed|che|chu|dato|datuk|tan|sri|dr|haji|hajah|ustaz|ustazah|cikgu|puan|encik|tuan|saudara|saudari)\b/gi,
        
        // MALAY PROFESSIONS & TITLES
        /\b(profesor|doktor|pensyarah|guru|penyelidik|ahli|sains|sejarawan|budayawan|sasterawan|penulis|pengarang|penyair|seniman|pelukis|pematung|ahli|muzik|pelakon|pengarah|penerbit|wartawan|editor|penerbit|pengedar|kurator|arkibis|pustakawan)\b/gi
      ],

      'en': [ // ENGLISH - EXTENSIVE
        // ENGLISH ACADEMIC TERMS
        /\b(history|culture|literature|law|politics|economy|social|education|society|government|nation|country|tradition|custom|art|heritage|development|study|analysis|research|methodology|theory|practice|concept|framework|paradigm|discourse|narrative|interpretation|critique|evaluation|assessment|examination|investigation|inquiry|exploration|survey|overview|introduction|handbook|manual|guide|textbook|monograph|treatise|dissertation|thesis|paper|article|publication|journal|periodical)\b/gi,
        
        // ENGLISH COMMON WORDS
        /\b(the|and|of|to|a|in|is|it|you|that|he|was|for|on|are|as|with|his|they|at|be|this|have|from|or|one|had|by|but|not|what|all|were|we|when|your|can|said|there|use|an|each|which|she|do|how|their|if|will|up|other|about|out|many|then|them|these|so|some|her|would|make|like|him|into|time|has|two|more|write|go|see|number|no|way|could|people|my|than|first|water|been|call|who|oil|its|now|find|long|down|day|did|get|come|made|may|part|over|new|work|world|life|man|woman|child|children|school|house|home|city|town|village|road|street|place|area|region|district|province|state|national|international|global|local|urban|rural)\b/gi,
        
        // ENGLISH ACADEMIC INSTITUTIONS
        /\b(university|college|institute|school|academy|polytechnic|faculty|department|program|study|research|center|institution|organization|association|foundation|museum|library|archive|gallery|collection|exhibition|conference|seminar|workshop|symposium|congress)\b/gi,
        
        // ENGLISH PROFESSIONS & TITLES
        /\b(professor|doctor|lecturer|teacher|researcher|scientist|historian|cultural|analyst|writer|author|poet|artist|painter|sculptor|musician|actor|actress|director|producer|journalist|reporter|editor|publisher|distributor|curator|archivist|librarian)\b/gi
      ],

      'nl': [ // DUTCH - COMPREHENSIVE
        // DUTCH ACADEMIC TERMS  
        /\b(geschiedenis|cultuur|literatuur|recht|politiek|economie|onderwijs|samenleving|regering|natie|land|staat|traditie|gebruik|kunst|erfgoed|ontwikkeling|studie|onderzoek|analyse|methodologie|theorie|praktijk|concept|raamwerk|paradigma|discours|verhaal|interpretatie|kritiek|evaluatie|beoordeling|onderzoek|onderzoek|verkenning|enquête|overzicht|inleiding|handboek|handleiding|gids|leerboek|monografie|verhandeling|proefschrift|scriptie|artikel|publicatie|tijdschrift|periodiek)\b/gi,
        
        // DUTCH COMMON WORDS
        /\b(de|het|en|van|tot|voor|met|zijn|een|als|door|over|onder|tussen|om|te|bij|naar|uit|zo|er|maar|ook|dan|of|want|dus|toch|al|op|aan|in|dat|die|dit|deze|wat|wie|waar|hoe|waarom|welke|die|deze|dit|dat|mijn|jouw|zijn|haar|ons|jullie|hun|deze|die|welke|elk|ieder|sommige|veel|weinig|meer|minder|meest|minst|alle|geen|enige|andere|zelfde|verschillende)\b/gi,
        
        // DUTCH COLONIAL & HISTORICAL TERMS
        /\b(indisch|koloniaal|inlandsch|beschaving|oost|nederlandsch|oostindische|indische|compagnie|voc|batavia|java|sumatra|borneo|celebes|molukken|ambon|bali|lombok|timor|nieuw|guinea|papoea|atjeh|padri|bonjol|diponegoro|antwerpen|rotterdam|amsterdam|den|haag|utrecht|leiden|delft|groningen|europees|europeanen|inlander|inlands|pribumi|peranakan|mesties|mestiezen)\b/gi,
        
        // DUTCH INSTITUTIONS & PROFESSIONS
        /\b(universiteit|hogeschool|instituut|school|academie|polytechniek|faculteit|afdeling|programma|studie|onderzoek|centrum|instelling|organisatie|vereniging|stichting|museum|bibliotheek|archief|galerij|collectie|tentoonstelling|conferentie|seminar|workshop|symposium|congres)\b/gi,
        
        // DUTCH PROFESSIONS & TITLES
        /\b(professor|doctor|docent|leraar|onderzoeker|wetenschapper|historicus|cultural|analist|schrijver|auteur|dichter|kunstenaar|schilder|beeldhouwer|musicus|acteur|actrice|regisseur|producent|journalist|verslaggever|redacteur|uitgever|distributeur|curator|archivaris|bibliothecaris)\b/gi
      ],

      'jv': [ // JAVANESE - COMPREHENSIVE
        // JAVANESE CORE TERMS
        /\b(jawa|kawi|serat|babad|kraton|sastra|tembang|wayang|gamelan|batik|sultan|pangeran|raden|mas|mbak|pak|bu|ing|saka|jawa|kuno|klasik|tradisional|modern|anyar|lawas|kuna|sepuh|enom|gedhe|cilik|dawa|pendek|dhuwur|andhap|abang|putih|ireng|ijo|biru|kuning|coklat|abang|wungu)\b/gi,
        
        // JAVANESE LITERARY WORKS
        /\b(serat|centhini|darma|gandul|wulang|reh|weda|sadana|sasana|sunan|kalijaga|gunung|jati|giri|kedaton|paku|alaman|ngayogyakarta|hadiningrat|surakarta|hadiningrat|mangkunegaran|paku|alaman|ngayogya|karta|sura|karta)\b/gi,
        
        // JAVANESE CULTURAL TERMS
        /\b(wayang|kulit|purwa|gedhog|klithik|golek|wong|orang|topeng|dalang|pesinden|waranggana|gerong|pengrawit|karawitan|gending|ladrang|ketawang|gineman|sulukan|pathet|nem|sanga|manyura|slendro|pelog|barang|gulu|dhadha|lima|nem|pelog|lima|nem|barang|bem|gulu|dhadha|pélog|nem|lima|barang)\b/gi,
        
        // JAVANESE PARTICLES & GRAMMAR
        /\b(iku|kang|sing|kabeh|ana|ora|wis|arep|bakal|sampun|saged|boten|mriki|mrono|kene|kono|ning|neng|karo|lan|saka|marang|dening|kanggo|dadi|nanging|nanging|menawa|yen|supaya|aja|ojo|sira|kowe|awak|dewe|kula|dalem|panjenengan|sampeyan|sliramu|sliranipun)\b/gi,
        
        // JAVANESE HONORIFICS & TITLES
        /\b(raden|mas|ayu|ajeng|bendara|gusti|kangjeng|ngabei|nganten|pangeran|ratu|rayi|satriya|tumenggung|wedana|adipati|arya|bupati|demang|lurah|carik|juru|tulis|mantri|bekel|bayan|kamituwa|dukuh|kliwon|legi|pahing|pon|wage|kliwon)\b/gi,
        
        // JAVANESE GEOGRAPHICAL
        /\b(yogyakarta|surakarta|solo|jogja|mataram|pajang|demak|kudus|pati|jepara|rembang|tuban|lamongan|gresik|surabaya|majapahit|singhasari|kediri|jenggala|kahuripan|pengging|banyumas|bagelen|kedu|semarang|pekalongan|tegal|brebes|cilacap|banyuwangi|malang|blitar|tulungagung|kediri|madiun|ngawi|magetan|ponorogo|pacitan|trenggalek)\b/gi
      ]
    };

    // Calculate dominance scores
    const scores = calculateLanguageDominance(textLower, languagePatterns);
    
    console.log('🔍 Language Detection Scores:', scores);
    
    // ADVANCED CONTEXTUAL BOOSTING SYSTEM
    
    // Boost 1: Strong cultural/literary signals
    if (textLower.match(/\b(serat|babad|kraton|tembang|wayang|gamelan)\b/)) {
      scores['jv'] += 25;
      console.log('🎭 Strong Javanese cultural signal detected');
    }
    
    // Boost 2: Strong Malay academic signals
    if (textLower.match(/\b(sastera|kerajaan|masyarakatkat|penyelidikan|kebangsaan|kemerdekaan)\b/)) {
      scores['ms'] += 20;
      console.log('📚 Strong Malay academic signal detected');
    }
    
    // Boost 3: Strong Dutch colonial signals
    if (textLower.match(/\b(indisch|koloniaal|nederlandsch|oostindische|voc|batavia)\b/)) {
      scores['nl'] += 22;
      console.log('🏭 Strong Dutch colonial signal detected');
    }
    
    // Boost 4: Strong English academic signals tanpa competition
    if (textLower.match(/\b(history|culture|literature|study|research)\b/) && 
        !textLower.match(/\b(sejarah|budaya|sastra|studi|penelitian)\b/)) {
      scores['en'] += 18;
      console.log('🎓 Strong English academic signal detected');
    }
    
    // Boost 5: Indonesian academic dominance
    if (textLower.match(/\b(sejarah|budaya|sastra|hukum|politik|ekonomi)\b/) && 
        !textLower.match(/\b(history|culture|literature|law|politics|economy)\b/)) {
      scores['id'] += 15;
      console.log('🇮🇩 Strong Indonesian academic signal detected');
    }
    
    // Boost 6: Religious terms - boost Indonesian/Malay (NOT Arabic)
    const religiousTerms = /\b(islam|muslim|quran|hadis|fiqh|tauhid|sharia|syariah|allah|muhammad|nabi|rasul|iman|shalat|solat|zakat|sedekah|puasa|haji|sunni|syiah|tasawuf|tarekat|tarikat|ulama|kyai|ustadz|ustaz|pesantren|pondok|madrasah|masjid|musholla|surau)\b/gi;
    if (religiousTerms.test(textLower)) {
      scores['id'] += 12;
      scores['ms'] += 12;
      console.log('🕌 Religious terms detected - boosting Indonesian/Malay');
    }

    // Boost 7: Geographical context boosts
    if (textLower.match(/\b(jawa|sumatra|kalimantan|sulawesi|papua|bali)\b/)) {
      scores['id'] += 8;
      scores['ms'] += 6;
      console.log('🗺️ Geographical context detected');
    }

    // Boost 8: Institutional context
    if (textLower.match(/\b(universitas|universiti|university|universiteit)\b/)) {
      // Boost based on the language of the institution word
      if (textLower.includes('universitas')) scores['id'] += 5;
      if (textLower.includes('universiti')) scores['ms'] += 5;
      if (textLower.includes('university')) scores['en'] += 5;
      if (textLower.includes('universiteit')) scores['nl'] += 5;
    }

    // Find dominant language
    let bestLang = 'id'; // Default fallback
    let bestScore = 0;

    Object.entries(scores).forEach(([lang, score]) => {
      if (score > bestScore) {
        bestScore = score;
        bestLang = lang;
      }
    });

    // CONFIDENCE THRESHOLD SYSTEM
    const totalWords = textLower.split(/\s+/).length;
    const minimumConfidence = totalWords * 2; // Minimum score based on text length
    
    if (bestScore < minimumConfidence) {
      console.log('🤔 Low confidence detection, defaulting to Indonesian');
      return 'id';
    }

    // Calculate confidence ratio for logging
    const maxPossibleScore = Object.keys(languagePatterns).length * 50; // Approximate max
    const confidenceRatio = bestScore / maxPossibleScore;
    
    console.log(`✅ Detected language: ${bestLang} (score: ${bestScore}, confidence: ${Math.round(confidenceRatio * 100)}%)`);
    
    return bestLang;

  } catch (error) {
    console.error('❌ Error in detectLanguage:', error);
    return 'id'; // Safe fallback to Indonesian
  }
};

// Enhanced title detection dengan context awareness
export const detectLanguageFromTitle = (title) => {
  if (!title || typeof title !== 'string') return 'id';
  
  try {
    const titleLower = title.toLowerCase();
    
    // ULTRA QUICK CHECKS untuk cases yang sangat jelas
    if (titleLower.match(/\b(serat |babad |tembang |wayang |kraton )/i)) {
      return 'jv';
    }
    if (titleLower.match(/\b(sastera |kerajaan |masyarakatkat |kajian )/i)) {
      return 'ms'; 
    }
    if (titleLower.match(/\b(geschiedenis |cultuur |nederlands |indisch )/i)) {
      return 'nl';
    }
    if (titleLower.match(/^history of |^study of |^research on /i)) {
      return 'en';
    }
    if (titleLower.match(/^sejarah |^studi |^penelitian /i)) {
      return 'id';
    }
    
    // Default ke enhanced detection untuk cases yang lebih kompleks
    return detectLanguage(title);
  } catch (error) {
    console.error('Error in detectLanguageFromTitle:', error);
    return 'id';
  }
};

// Enhanced language label mapping
export const getLanguageLabel = (langCode) => {
  const labels = {
    'id': 'Indonesia',
    'ms': 'Melayu', 
    'en': 'English',
    'nl': 'Belanda',
    'jv': 'Jawa',
    'unknown': 'Tidak diketahui'
  };
  return labels[langCode] || 'Indonesia';
};

// TEST FUNCTION untuk verifikasi
export const testLanguageDetection = () => {
  const testCases = [
    // Indonesian cases
    "Sejarah Hukum Adat Indonesia",
    "Studi tentang Budaya Nusantara", 
    "Politik dan Pemerintahan di Indonesia",
    "Ekonomi Sosial Masyarakat Tradisional",
    "Kajian Transformasi Pendidikan Nasional",
    
    // Malay cases
    "Sejarah Sastera Melayu Klasik",
    "Kajian Masyarakatkat Melayu Tradisional",
    "Penyelidikan Kebudayaan Kebangsaan",
    "Undang-undang Kerajaan Melayu",
    "Kesusasteraan Melayu Moden",
    
    // Javanese cases
    "Serat Centhini: Kajian Filsafat Jawa",
    "Babad Tanah Jawi dan Sejarah Kraton",
    "Tembang Jawa Klasik dan Makna Filosofis",
    "Wayang Kulit dalam Budaya Jawa",
    "Gamelan dan Seni Karawitan Jawa",
    
    // Dutch cases
    "Geschiedenis van Nederlandsch Indië",
    "Cultuur en Politiek in Koloniaal Java",
    "Onderzoek naar de VOC in Batavia",
    "Economische Ontwikkeling in Indisch",
    "Nederlandsch Onderwijs in Oost-Indië",
    
    // English cases
    "History of Indonesian Culture and Society",
    "Research on Political Development in Java",
    "Study of Economic Transformation in Sumatra",
    "Analysis of Social Changes in Modern Indonesia",
    "Literature Review on Indonesian Heritage",
    
    // Mixed cases
    "Sejarah Law in Indonesia: Dari Tradisional ke Modern",
    "Kajian Culture and Society in Malay World",
    "Studi Geschiedenis van Java en Sumatra",
    "Research on Adat Law and Modern Legislation",
    "Analisis Wayang dalam Contemporary Art",
    
    // Religious terms (should be ID/MS)
    "Studi tentang Islam di Indonesia",
    "Kajian Fiqh dan Masyarakat Modern", 
    "Sejarah Perkembangan Tasawuf di Jawa",
    "Pemikiran Ulama Nusantara",
    "Tradisi Pesantren dalam Pendidikan",
  ];

  console.log('🧪 TESTING LANGUAGE DETECTION:');
  testCases.forEach((test, index) => {
    const result = detectLanguage(test);
    const label = getLanguageLabel(result);
    console.log(`${index + 1}. ${test} → ${result} (${label})`);
  });

  return testCases.map(test => ({
    text: test,
    detected: detectLanguage(test),
    label: getLanguageLabel(detectLanguage(test))
  }));
};