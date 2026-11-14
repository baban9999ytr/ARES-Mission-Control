# ARES — üç dakikalık Türkçe jüri konuşması

**0:00–0:35 — Sorun**

Mars'ta rota planlamak, bir görüntünün üzerine çizgi çizmekten fazlasını gerektirir. Yüzey görüntüsü, yükseklik modeli, bilim hedefi ve uzay havası kaydı farklı soruları yanıtlar. Bu kaynaklar dikkatsizce birleştirilirse bir araştırma prototipi, belirsiz bir rotayı operasyonel olarak güvenliymiş gibi gösterebilir. ARES bu ayrımları görünür kılar ve gerçek arazi üzerinde çalışan bir hesaplamayı gösterir.

**0:35–1:30 — Ölçülmüş harita demosu**

Ekranda Jezero Krateri'nden 3,2 çarpı 2,4 kilometrelik bir çalışma kesiti var. Görüntü, Mars Reconnaissance Orbiter CTX optik mozaiğinden; yükseklikler CTX sayısal arazi modelinden işlenmiştir. Kaynak çözünürlükleri görüntü için 6 metre, yükseklik için 20 metredir. ARES, DEM'i 40 metrelik hücrelerden oluşan 80 çarpı 60 bir ızgarada kullanır. Başlangıcı ve hedefi doğrudan kayıtlı haritadan seçiyorum. İki rota ölçülmüş yükseklik dizisinden çalışma anında hesaplanıyor. En kısa rota ızgara mesafesini küçültür; arazi tercihi, örneklenmiş dik adımlara açıklanmış, temsili bir maliyet ekler. Örnek noktalar için en kısa rota yaklaşık 2,07 kilometre ve en yüksek örneklenmiş adım eğimi 17,7 derece; arazi tercihi 2,13 kilometre ve 10,4 derecedir. Hiçbiri güvenli EVA rotası olarak onaylanmamıştır.

**1:30–2:10 — Hesaplamanın kanıtı**

A* sonuçlarını aynı kenar maliyetleriyle bağımsız Dijkstra hesabıyla karşılaştırdık; maliyetler eşleşti. Bellekte tek bir DEM hücresinin yüksekliğini değiştirdiğimizde seçilen yol değişti. Eksik verili kısmi bir engel yolu dolaştırdı; tam engel rotayı reddetti. Ayrıca kaynak GeoTIFF ile 36 hücrenin yüksekliğini bağımsız karşılaştırdık. Ham veri dosyaları değiştirilmedi.

**2:10–2:40 — Bilim ve Güneş bağlamı**

Bilim Hedefleri bölümü küresel Mars kataloğunu Jezero kayıtlarından ayırır. Bu küçük harita kesitinde, aday Jezero kayıtlarının bir kısmının tekil koordinatı yoktur; koordinatı olanlar ise kesitin dışındadır. Kanıtı ve kapsama sonucunu gösteriyoruz, sahte rota üretmiyoruz. Uzay Havası bölümü NASA CCMC DONKI'den gözlenmiş Güneş patlaması, CME ve SEP kayıtlarını UTC zamanları ve veri alma zamanı ile getirir. Bunlar Jezero yüzeyindeki radyasyon dozunu ölçmez.

**2:40–3:00 — Sonraki aşama**

ARES, ölçülmüş Mars arazisinde rota karşılaştırması yapan tekrarlanabilir bir araştırma gösterimidir. Gerçek görev kararları için daha geniş doğrulanmış kapsama, yerel engel ve zemin haritaları, çevre modelleri, belirsizlik analizi ve resmî operasyonel doğrulama gerekir. Bugün ölçülmüş, modellenmiş, temsili ve mevcut olmayan bilgileri açıkça ayırıyoruz.
