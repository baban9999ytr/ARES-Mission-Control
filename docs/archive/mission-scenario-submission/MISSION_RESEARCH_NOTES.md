# MISSION RESEARCH NOTES — OPERATION RED HORIZON

## 1. ARES'in mevcut durumu

Depo belgelerine göre varsayılan ARES fallback haritası sentetiktir. Sentetik yükseklik, thermal, hazard, waypoint ve mesafe verileri NASA/USGS ölçümü değildir. Gerçek-veri yolu Mars-projeksiyonlu, eş-kayıtlı raster paketleri yüklemek için tasarlanmıştır.

Bu nedenle **30 görev tasarlandı; gerçek CTX üzerinde ARES rota metriği çalıştırılmış gibi davranılmadı.** Bu, uydurma sonuç üretmeme kuralının doğrudan uygulanmasıdır.

## 2. CTX veri seti

USGS Mars 2020 Science Investigation CTX DEM Mosaic:
- Jezero kapsama alanı yaklaşık 19.29°N–17.58°N ve 76.99°E–78.58°E.
- 20 m/piksel.
- Dikey birim metre.
- Equirectangular, planetocentric, +East.
- Kaynak Mars Reconnaissance Orbiter / CTX.

USGS ayrıca daha dar kapsamlı Mars 2020 Terrain Relative Navigation CTX DTM Mosaic yayımlar: 18.211–18.7212°N, 77.1605–77.699°E, 20 m/piksel.

## 3. NASA bilimsel bağlamı

NASA, Jezero'yu antik göl ve nehir deltası bağlamı olan bir çalışma alanı olarak tanımlar. Bu, 'delta bağlamı' gibi ifadeleri destekler. Fakat ARES rasterındaki tek bir hücreyi belirli kaya, mineral veya tehlike diye etiketlemek için ayrıca o özelliği destekleyen veri gerekir.

NASA'nın Perseverance konum haritası, yüksek çözünürlüklü topoğrafik verinin rover sürüş planlamasında kullanıldığını açıklar. Bu, ARES'in rota karşılaştırma fikrine bağlam sağlar; ARES rotasının NASA operasyon rotası olduğu anlamına gelmez.

## 4. Rota metrikleri

Her rota için Shortest ve Terrain Preferred ayrı kaydedilmeli:
- distance
- maximum sampled slope
- total ascent
- algorithmic route cost

Mevcut ARES routing motorundaki terrain eğim ağırlığı bir yazılım tasarım tercihidir; NASA EVA güvenlik eşiği değildir.

## 5. Neden iki rota farklı olabilir?

Shortest modunda mesafe ana hedeftir. Terrain Preferred modunda eğim maliyeti de devreye girer. Böylece biraz daha uzun ama daha düşük örneklenmiş eğimli bir koridor seçilebilir. Bu, yalnızca algoritmanın davranışıdır; 'güvenli rota' sonucu değildir.

## 6. 10 görevlik yeniden çalıştırma protokolü

EX-01–EX-10 gerçek CTX pack ile ARES'e yüklendiğinde: aynı veri sürümünü seç; başlangıç/bitişi kaydet; iki modu ayrı çalıştır; JSON briefing'i kaydet; distance/max slope/ascent değerlerini yaz; harita ekran görüntüsünü al; rota ayrışmasını görsel olarak incele; bilimsel yorum ile algoritmik gözlemi ayır; provenance kaydet.

## 7. Ekran görüntüsü standardı

Gerçek screenshot yoksa sahte screenshot oluşturulmaz. Her JSON briefing şu aşamada `pending_real_ctx_validation` veya `scenario_ready_pending_ctx_execution` durumundadır. Gerçek çalıştırma yapıldığında PNG ve gerçek metrikler eklenebilir.

## 8. Çok duraklı görevler

ARES'in mevcut tek başlangıç/tek hedef modelinde çok duraklı görev tek çağrıda çalışıyormuş gibi gösterilmemelidir. CM-01, CM-02, CM-07, CM-08 ve CM-09 gibi görevlerde her bacak ayrı hesaplanır.

Toplam mesafe = bacak 1 + bacak 2 + ...

## 9. Bilinen sınırlamalar

- 20 m/piksel CTX DEM küçük kaya ve mikro-topografyayı çözmez.
- ARES route cost fiziksel enerji tüketimi değildir.
- ARES route sonucu safe/unsafe olarak sertifikalandırılamaz.
- Gerçek zamanlı Mars radyasyon ölçümü rota motorunun girdisi değildir.
- Harita koordinatı ile rover telemetrisi aynı şey değildir.
- Jeolojik hedefler ayrıca kaynaklandırılmalıdır.
- No-data hücreler geçilebilir arazi gibi ele alınmamalıdır.

## 10. Doğrulama durumu

| Grup | Tasarım | Gerçek CTX ARES çalıştırması | Durum |
|---|---:|---:|---|
| EX-01–EX-10 | 10/10 | 0/10 | CTX pack bekleniyor |
| SC-01–SC-10 | 10/10 | 0/10 | Araştırma senaryosu hazır |
| CM-01–CM-10 | 10/10 | 0/10 | İleri görev tasarımı hazır |

**Bu 0/10 değerleri özellikle görünür tutuldu.** 10 gerçek CTX çalıştırması yapılmış gibi yanlış bilgi verilmedi.

## Kaynaklar

- USGS Astrogeology — Mars 2020 Science Investigation CTX DEM Mosaic.
- USGS Astrogeology — Mars 2020 Terrain Relative Navigation CTX DTM Mosaic.
- USGS Planetary Names — Jezero.
- NASA Science — Mars 2020 Perseverance.
- NASA Science — Perseverance Rover Location Map.
- NASA Science — Perseverance View of the Delta in Jezero Crater.
- NASA Science — Perseverance's Route to the Delta.
