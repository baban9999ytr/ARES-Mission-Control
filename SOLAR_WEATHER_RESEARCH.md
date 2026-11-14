# ARES — NASA DONKI ve Mars Uzay Havası Araştırması

**Hazırlayan:** Mars Science Researcher
**Tarih:** 14 Kasım 2026
**Kapsam:** Yalnızca araştırma. Uygulama koduna dokunulmadı. API'ye canlı istek **atılmadı** (bkz. "Doğrulanamayan iddialar").

> **Etiket sistemi:** Kaynakların yanındaki işaretler şunu gösterir.
> **[A]** = Sayfa açılıp okundu. **[S]** = Yalnızca arama sonucu özeti görüldü, sunumdan önce yeniden açılmalı. **[İ]** = İkincil kaynak (haber, blog, wiki), NASA/NOAA resmi sayfası değil.

---

## 0. Kritik bulgular (önce bunları oku)

1. **DONKI API adresi değişti.** CCMC'nin resmî duyurusuna göre 30 Eylül 2026'dan itibaren genel veri API'si `https://ccmc.gsfc.nasa.gov/DONKI-API/get/...` adresindedir. Eski `kauai.ccmc.gsfc.nasa.gov/DONKI/WS/get/...` adresinin yerini aldı. Parametreler ve JSON formatı değişmedi **[A]** ([CCMC Announcements](https://ccmc.gsfc.nasa.gov/news/major-updates/)). Eski `api.nasa.gov/DONKI` örnekleri (internetteki çoğu eğitim yazısı) artık çalışmıyor olabilir. Bunu üçüncü taraf geliştiriciler bildiriyor **[İ]**, resmî sayfa yönlendirme davranışına değinmiyor.
2. **DONKI verileri Dünya merkezli ve araştırma kalitesindedir.** DONKI'nin kendi sayfası içeriği "yalnızca prototip kalitesinde ve araştırma bağlamında" değerlendirilecek şekilde tanımlıyor ve NOAA SWPC'yi resmî ABD hükümeti kaynağı olarak gösteriyor **[A]** ([DONKI](https://ccmc.gsfc.nasa.gov/tools/DONKI/)).
3. **DONKI, Mars'ta ölçülmüş radyasyon verisi vermez.** Mars'ta gerçek radyasyon ölçümü Curiosity'nin RAD cihazı ve MAVEN'in SEP cihazı gibi Mars'taki araçlardan gelir. ARES'te DONKI verisi, "Mars'ta ölçülmüş radyasyon" gibi görünmemelidir.
4. **CCMC Mars için iki beta tablo yayınladı (30 Eylül 2026):** Mars CME Scoreboard ve Mars SEP Scoreboard. Mars CME Scoreboard sayfasını açtım. SEP Scoreboard sayfası JavaScript ile yüklendiği için içeriğini okuyamadım **[A]**.

---

## 1. Güneş patlaması (FLR), CME ve SEP arasındaki farklar

| | **Solar Flare (FLR)** | **CME (koronal kütle atımı)** | **SEP (güneş enerjik parçacıkları)** |
|---|---|---|---|
| **Nedir?** | Güneş atmosferinde ani parlama. X-ışını ve morötesi (EUV) ışıma patlaması. | Güneşten uzaya fırlatılan büyük plazma ve manyetik alan bulutu. | Güneş olaylarıyla yaklaşık ışık hızının önemli bir kısmına hızlandırılan yüklü parçacıklar (çoğunlukla protonlar). |
| **Ne taşır?** | Işıma (elektromanyetik) | Madde ve manyetik alan | Parçacık radyasyonu |
| **Nasıl ölçülür/sınıflanır?** | GOES uydularının 1-8 Å X-ışını akısıyla: A, B, C, M, X (her sınıf 10 kat) **[İ]** | Hız, yarım açı, yön (DONKI'de CME analizi). DONKI'de CME'nin "Type" alanı SCORE ölçeğidir **[A]** | NOAA'da ≥10 MeV proton akısı (pfu) ve S1-S5 ölçeği. Eşikler: 10, 100, 1000, 10 000, 100 000 pfu **[A]** ([SWPC](https://www.swpc.noaa.gov/node/39)) |
| **Ulaşma süresi** | Işık hızında, anında **[İ]** | Gün mertebesi. DONKI'deki 4 örnek kayıtta Mars için model tahmini CME'den yaklaşık 3-5 gün sonra (genelleme değil) **[S]** | SWPC: 500 MeV bir proton için ~10 dakikadan, saatlerce sürebilen gecikmelere kadar. Süre, olayın güneş diskindeki konumuna bağlı **[A]** |
| **Dünya'daki karşılığı** | R ölçeği (radyo karartması) **[İ]** | G ölçeği (jeomanyetik fırtına) **[İ]** | S ölçeği (radyasyon fırtınası) |
| **Aralarındaki ilişki** | Güçlü flare'ler bazen CME ile birlikte olur, her zaman değil **[İ]** | SWPC, güneş proton olaylarının hızlı CME'lerden kaynaklandığını belirtir **[A]** | DONKI, FLR kayıtlarını ilgili CME ve SEP kayıtlarına bağlar ("linkedEvents") **[A]** |

**Pratik kural:** FLR = "ışık patladı", CME = "bulut fırlatıldı", SEP = "parçacıklar geliyor". Mars radyasyon güvenliği açısından en çok önem taşıyan türdür SEP (bkz. bölüm 3).

---

## 2. NASA DONKI API ile alınabilen veriler

**Servis:** DONKI, NASA Goddard'daki CCMC'nin (Community Coordinated Modeling Center) veri tabanıdır. Kayıtları büyük ölçüde Moon-to-Mars Space Weather Analysis Office (M2M-SWAO) girer **[A]**.

**Yeni API tabanı:** `https://ccmc.gsfc.nasa.gov/DONKI-API/get/<ENDPOINT>` **[A]**

### 2.1 Uç noktalar

| Endpoint | İçerik | Ana parametreler |
|---|---|---|
| `CME` | Koronal kütle atımı kayıtları | `startDate`, `endDate` |
| `CMEAnalysis` | CME analizi: zaman, enlem, boylam, yarım açı, hız, tip | `startDate`, `endDate`, `mostAccurateOnly`, `completeEntryOnly`, `speed`, `halfAngle`, `catalog`, `keyword` |
| `FLR` | Güneş patlaması kayıtları | `startDate`, `endDate` |
| `SEP` | Güneş enerjik parçacık olayları | `startDate`, `endDate` |
| `GST` | Jeomanyetik fırtına (Kp) | `startDate`, `endDate` |
| `IPS` | Gezegenlerarası şok | `startDate`, `endDate`, `location`, `catalog` |
| `MPC` | Manyetopoz geçişi | `startDate`, `endDate` |
| `RBE` | Radyasyon kuşağı artışı | `startDate`, `endDate` |
| `HSS` | Yüksek hızlı akış | `startDate`, `endDate` |
| `WSAEnlilSimulations` | WSA-ENLIL+Cone model sonuçları (Mars dahil gezegen etki tahminleri) | `startDate`, `endDate` |
| `notifications` | Bildirimler (`type`: all, FLR, SEP, CME, IPS, MPC, GST, RBE, report) | `startDate`, `endDate`, `type` |

Kaynak: CCMC DONKI sayfasının 07/03/2025 tarihli sürümü ve üçüncü taraf dokümanlar **[S][İ]**. CCMC, parametrelerin ve yanıt biçimlerinin göç sırasında **değişmediğini** söylüyor **[A]**. Bu nedenle liste geçerli kabul edilebilir ama ilk canlı istekte doğrulanmalı.

**Varsayılan tarih aralığı:** `startDate` verilmezse 30 gün öncesi, `endDate` verilmezse bugün (UTC). `notifications` için varsayılan 7 gün **[S]**.

### 2.2 Görülen JSON alanları (örnekler)

- **FLR:** `flrID`, `catalog`, `instruments[].displayName`, `beginTime`, `peakTime`, `endTime`, `classType` (ör. "M1.2"), `sourceLocation` (ör. "N16E35"), `activeRegionNum`, `note`, `linkedEvents`, `sentNotifications` **[S]** (DONKI FLR çıktı örneği)
- **CME:** `activityID`, `catalog`, `startTime`, `instruments`, `sourceLocation`, `activeRegionNum`, `note`, `cmeAnalyses`, `linkedEvents` **[S]**
- **CMEAnalysis:** `time21_5`, `latitude`, `longitude`, `halfAngle`, `speed`, `type`, `isMostAccurate`, `associatedCMEID`, `catalog` **[S]**
- **GST:** `gstID`, `startTime`, `allKpIndex[]` (`observedTime`, `KpIndex`, `source`) **[S]**
- **SEP ve WSAEnlilSimulations:** JSON alan adlarını bu çalışmada resmî kaynaktan doğrulayamadım. WSA-ENLIL kayıtlarının web görünümünde "Other Location(s) Impact" satırında Mars için tahmini şok varış zamanı yer alıyor **[S]**. Aşağıda "Doğrulanamayan iddialar" bölümüne bakın.

### 2.3 Katalog bilgisi

DONKI ana kataloğu `M2M_CATALOG`tur. Haziran 2020'den itibaren M2M-SWAO analizlerini içerir **[A]**. Başka katalogların arasında Mars'la ilgili olan: **`MAVEN_EUVM_FLARE_CATALOG`**, MAVEN'in EUV monitörüyle **Mars'ta ölçülen** flare'ler. CCMC bu verinin "hızlı bakış" niteliğinde olduğunu, analiz ya da yayın için kullanılmaması gerektiğini ve MAVEN'in sürekli bağlantıda olmadığını (veri gecikmesi saatler-günler olabilir) açıkça yazıyor **[A]**.

### 2.4 Erişim ve kullanım koşulları

- **Anahtar (API key):** Resmî CCMC duyurusu anahtar gerektirip gerektirmediğine değinmiyor. Üçüncü taraf geliştiriciler yeni API'nin anahtarsız çalıştığını bildiriyor **[İ]**. Eski `api.nasa.gov` anahtar sistemi (saatte 1000 istek; DEMO_KEY ile saatte 30) ise DONKI için geçerli olmayabilir **[İ]**. **Doğrulanmadı.**
- **Atıf:** CCMC, DONKI/CCMC'nin kaynak olarak belirtilmesini ister ve yayınlarda CCMC'ye bildirim yapılmasını talep eder **[A]** ([publication policy](https://ccmc.gsfc.nasa.gov/publication-policy/)).
- **Sorumluluk reddi:** Veri "olduğu gibi" sunulur. NOAA SWPC resmî tahmin kaynağıdır **[A]**.
- **API iletişim kişisi (CCMC):** Chiu Wiegand (resmî duyuruda adı geçiyor) **[A]**.

---

## 3. Bu veriler Mars için gerçekten ne ifade ediyor?

### 3.1 Genel çerçeve

- Dünya'nın manyetik alanı güneş olaylarının etkilerinin çoğunu engeller. Mars ise küresel manyetik alanını çok önce kaybetti ve güneş parçacıklarına karşı daha savunmasızdır **[S]** (NASA'dan, [phys.org kopyası](https://phys.org/news/2024-04-nasa-scientists-gear-solar-storms.pdf)).
- Mars'ın ince atmosferi parçacıkların yüzeye ulaşan yoğunluğunu etkiler. Curiosity'nin RAD cihazının üzerindeki atmosfer yaklaşık 23 g/cm² CO₂ kalınlığındaydı **[S]** (Zeitlin vd., Space Weather, 2018).
- Mars'ta yüzey radyasyonunun **sürekli** kaynağı galaktik kozmik ışınlardır (GCR). RAD, ilk 10 ayda yaklaşık 210 mikrogray/gün düzeyinde, neredeyse tamamen GCR kaynaklı bir doz ölçtü **[S]** ([NASA görseli](https://science.nasa.gov/?p=348225)). Güneş olayları bunun üzerine **ara ara** ek yük bindirir.

### 3.2 Her veri türü Mars için ne anlama gelir?

| Tür | Mars için anlamı | Kanıt |
|---|---|---|
| **FLR** | X-ışını/EUV patlaması Mars'ın üst atmosferini ve iyonosferini etkileyebilir. MAVEN'in EUVM cihazı Mars'ta flare ölçer. DONKI'deki GOES kayıtları ise Dünya yakınından ölçülmüştür. Flare'in Mars yüzeyindeki dozu üzerindeki etkisini araştırdığım kaynaklarda **doğrulayamadım**. | DONKI'nin MAVEN_EUVM kataloğu açıklaması **[A]** |
| **CME** | Mars'a ulaşırsa güneş rüzgârı ortamını bozar. DONKI WSA-ENLIL kayıtlarında Mars için tahmini şok varış zamanı verilir ("Glancing Blow" = sıyırma etkisi). 10-12 Eylül 2017'de RAD, şok geldiğinde anlık doz hızında yaklaşık %15 düşüş gördü, çünkü şok galaktik kozmik ışınları azalttı. | WSA-ENLIL kayıtları **[S]**; Zeitlin/Hassler çalışmaları **[S]** |
| **SEP** | Mars için asıl radyasyon tehlikesi. Eylül 2017 olayında RAD, doz hızlarının GCR seviyesinin 2-3 katına çıktığını ölçtü (birkaç saat içinde yükseldi, yaklaşık 12 saat tepede kaldı, sonraki 36 saatte düştü). Mayıs 2024'te NASA, RAD'ın o güne kadarki en büyük artışını bildirdi: olay boyunca 8 100 mikrogray. MAVEN bunu gözlediği en büyük SEP olayı olarak tanımladı. Mars Odyssey'in yıldız kamerası bir süre devre dışı kaldı. | JPL 2017 **[S]**; NASA 2024 **[S]** |

### 3.3 Dünya'da görülen ile Mars'ta olan aynı şey değil

DONKI kayıtlarında, Dünya'ya etkisi "No or little impact to Earth" olarak yazılan bir CME için aynı kayıtta Mars varış tahmini bulunabiliyor (ör. 26 Ekim 2025 CME'leri için Mars şok tahmini 30 Ekim 2025) **[S]**. Tersine, Mayıs 2024'te Mars'ı vuran büyük olayın flare'inin X12 sınıfı olduğu, **Solar Orbiter verisine dayanarak tahmin edildi** ve ölçüm Dünya'nın GOES'una dayanmıyor **[İ]** ([Space.com](https://www.space.com/powerful-solar-storm-mars-radiation-astronaut-missions)). Yani bir olayın Dünya'dan görünür büyüklüğü, Mars'taki etkisinin göstergesi değildir.

### 3.4 ARES için sonuç

- DONKI'nin güçlü olduğu yer: **olay zinciri** (flare → CME → SEP bağlantıları) ve **Mars için CME varış tahmini**.
- DONKI'nin vermediği şey: Jezero'daki yüzey doz hızı, astronot maruziyeti, "güvenli/güvensiz" kararı.
- Tek gerçek Mars yüzeyi dozimetre referansı Curiosity RAD'dır (Gale Krateri). **Perseverance'ta (Jezero) RAD benzeri bir iyonlaştırıcı radyasyon dozimetresi olup olmadığını araştırmadım.** Bu yüzden ARES'te RAD değerlerini "Jezero değeri" gibi gösterme.

---

## 4. Dünya merkezli uzay havası verisini "Mars radyasyonu" gibi göstermemek için uyarılar

### 4.1 Yapılmaması gerekenler

1. **GOES proton akısını (pfu) ve S1-S5 ölçeğini Mars'a uygulama.** Bunlar GOES uydusunda ölçülen Dünya yakını değerleridir **[A]** (SWPC).
2. **Kp, G ölçeği, R ölçeği, jeomanyetik fırtına, radyo karartması verilerini Mars kartlarında gösterme.** Bunlar Dünya'nın manyetosferi ve iyonosferi içindir.
3. **Pfu'yu mikrosievert/mikrogray'e çevirme.** Mars atmosferi, yüzey kalkanı ve enerji spektrumu ayrı hesap gerektirir. Bu çevirme için bu çalışmada kaynaklı bir yöntem yok.
4. **Flare sınıfını (M, X) Mars'a ulaşan şiddet gibi sunma.** Sınıf, GOES'un 1 AU'daki X-ışını akısını ölçer **[İ]**. (Mars Güneş'ten daha uzak olduğu için ışıma daha düşüktür. Bu, ters kare yasasından çıkan genel bilgidir, bu çalışmada kaynaklanmadı.)
5. **Modeli gözlem gibi gösterme.** "Mars şok varışı" bir **model tahminidir**, ölçüm değil.
6. **"Mars'a etki yok" deme.** DONKI'de Mars için tahmin bulunmaması, Mars'ta SEP/radyasyon artışı olmayacağı anlamına gelmez. Modeller sadece CME girdilerine dayanır.
7. **Kayıt boş diye "güvenli" deme.** Mars'ta ölçüm yapan araçlar sürekli bağlantıda değil (MAVEN'in DSN gecikmeleri gibi) **[A]**.
8. **ARES çıktısını astronot güvenliği kararı için kullanma.** DONKI "araştırma kalitesi"dir **[A]**.

### 4.2 Zorunlu etiketler (arayüz metni önerileri)

| Durum | Önerilen etiket (TR / EN) |
|---|---|
| Her DONKI kartı | "Araştırma verisi: NASA CCMC DONKI. Resmî tahmin değildir. / Research data: NASA CCMC DONKI. Not an official forecast." |
| Dünya yakını ölçüm (GOES, SOHO, STEREO-A vb.) | "Dünya yakınında ölçüldü. Mars'taki değeri göstermez. / Measured near Earth. Does not represent conditions at Mars." |
| Model sonucu (WSA-ENLIL) | "Model tahmini. Gözlem değil. / Model estimate, not an observation." |
| Mars'tan alınmış veri (MAVEN EUVM) | "Mars yörüngesinden hızlı bakış verisi; analiz için resmî PDS ürünlerine bakın. / Quick-look data from Mars orbit." |
| Mars tarihsel referans (RAD) | "Tarihsel referans: Curiosity (Gale Krateri). Canlı veri veya Jezero değeri değildir. / Historical reference: Curiosity (Gale Crater). Not live; not a Jezero value." |
| Veri yok | "Bu kaynakta Mars için kayıt yok. Bu, etkinin olmadığı anlamına gelmez. / No Mars record in this source. This does not mean no effect." |
| Her kartta | Son güncelleme zamanı (UTC) ve veri çekme zamanı |

### 4.3 Teknik uyarılar

- **Tarih aralığı:** Yeni API'nin 30 günden uzun aralıkları reddettiği bildiriliyor **[İ]** ([ProgramComputer sürüm notu](https://github.com/ProgramComputer/NASA-MCP-server/releases/tag/v1.2.0)). Resmî doğrulama yok. Güvenli tasarım: en fazla 30 günlük pencereler.
- **Adres:** Eski `kauai.ccmc.gsfc.nasa.gov` ve `api.nasa.gov/DONKI` adreslerine bağlı kod, 30 Eylül 2026'dan sonra bozulmuş olabilir. Yeni adres hata verirse arayüzün bunu "veri yok" yerine "kaynak ulaşılamıyor" diye göstermesi gerekir (**[İ]**: bazı kullanıcılar eski adreslerin HTML duyuru sayfasını 200 koduyla döndürdüğünü bildirdi).
- **Kaynak bölge koordinatları:** `sourceLocation` ("N16E35") büyük olasılıkla Dünya'dan bakılan güneş diski konumudur. Mars'tan görünen konum farklı olur. Bu bir **çıkarımdır**: DONKI kayıtlarında konum E/W olarak yazılıyor, ancak bakış açısının Dünya olduğunu belirten resmî bir ifade görmedim. Mars için bu alanı "Mars'a bakan bölge" gibi gösterme.

---

## 5. ARES arayüzünde gösterilebilecek en fazla 5 bilgi alanı

| # | Alan | Kaynak (endpoint/alan) | Gösterim | Zorunlu uyarı |
|---|---|---|---|---|
| 1 | **Mars için modellenen CME şok varış tahmini** (zaman, "sıyırma" etiketi) | `WSAEnlilSimulations`, "Mars" etki satırı | "Tahmini şok: 17 Mayıs 2025 20:00 UTC (sıyırma)" | "Model tahmini. Gözlem değil." Alan adları doğrulanmadı **[S]** |
| 2 | **Tetikleyici güneş olayı** (flare sınıfı, tepe zamanı, kaynak bölge) | `FLR`: `classType`, `peakTime`, `sourceLocation`, `activeRegionNum` | "M4.3 flare, 23 Nis 08:48 UTC (Dünya'dan ölçüm)" | "Dünya yakınında ölçüldü. Mars'taki değeri göstermez." |
| 3 | **Bağlı olay zinciri** (flare → CME → SEP bağlantı sayısı/durumu) | `FLR`/`CME`: `linkedEvents` | "Bağlı kayıtlar: 1 CME, 5 SEP" | SEP kayıtları Dünya yakını/model enstrümanlarına dayanır (GOES SEISS, SOHO, STEREO-A, REleASE modeli). "Mars'a ulaştığı anlamına gelmez." |
| 4 | **Mars'ta ölçülmüş flare (varsa)** (MAVEN EUVM) | DONKI `MAVEN_EUVM_FLARE_CATALOG` | "MAVEN EUVM: C5+ flare, zaman" | "Hızlı bakış verisi, gecikmeli olabilir." Bu kataloğun FLR endpoint'inde `catalog` parametresiyle çekilip çekilemediği **doğrulanmadı** |
| 5 | **Veri durumu rozeti** (kaynak: DONKI/CCMC, katalog, son güncelleme, "araştırma verisi") | Her kayıtta `catalog`, `submissionTime`, `versionId`; istemci zamanı | Her kartın altında sabit rozet | "Resmî tahmin: NOAA SWPC." |

**Bilerek dışarıda bırakılanlar:** Kp/G ölçeği, GOES proton akısı, "Mars doz hızı" ve "güvenlik seviyesi" alanları. Gerekçe bölüm 4'te.

**İsteğe bağlı (5 alan sınırı içinde değil):** Tarihsel referans paneli (Curiosity RAD: GCR taban değeri ~210 µGy/gün, Eylül 2017 ve Mayıs 2024 olayları). Eklenirse mutlaka "tarihsel, canlı değil, Gale Krateri" etiketiyle.

---

## 6. Doğrulanamayan iddialar ve açık sorular

| # | İddia / eksik | Durum |
|---|---|---|
| 1 | Yeni DONKI API'sinin API anahtarı gerektirmediği | Yalnızca üçüncü taraf kaynaklar. Resmî sayfa değinmiyor. |
| 2 | Yeni API'nin 30 günden uzun aralıkları reddettiği | Tek üçüncü taraf kaynak (MCP sürüm notu). Resmî doğrulama yok. |
| 3 | Eski adreslerin yönlendirme ya da HTML 200 davranışı | Üçüncü taraf bildirimleri. Resmî sayfa yalnızca "yerine geçti" diyor. |
| 4 | `WSAEnlilSimulations` JSON alan adları ve Mars etki listesi yapısı | Web görünümünde Mars satırı görüldü. JSON şeması resmî kaynaktan okunmadı. |
| 5 | `SEP` endpoint'inin JSON alanları | Bu oturumda doğrulanmadı. |
| 6 | MAVEN EUVM flare kataloğunun `FLR` endpoint'i üzerinden sorgulanabilirliği | Katalog var **[A]**. `catalog` parametresi desteği doğrulanmadı. |
| 7 | Mars SEP Scoreboard içeriği | Sayfa JavaScript ile yükleniyor, içeriği okunamadı. |
| 8 | Flare sınıf eşikleri (A, B, C, M, X) ve R/S/G ölçeklerinin ayrıntıları | İkincil kaynaklar. NOAA SWPC "scales" sayfasından teyit edilmeli. |
| 9 | CME'nin Mars'a "3-5 günde" ulaştığı | Yalnızca 4 DONKI örnek kaydından hesaplandı. Genel kural değil. |
| 10 | Mars'ın Güneş'ten uzaklığına bağlı ışıma azalması (ters kare yasası) | Genel fizik bilgisi, kaynaklanmadı. |
| 11 | Mars atmosfer basıncının Dünya'nın ~%1'i olduğu | İkincil kaynak (The Conversation). |
| 12 | MAVEN'in 2015'te bir CME'nin atmosfer kaybını 10 kat artırdığını gözlediği | İkincil kaynak (Popular Science). Burada ana sonuç olarak kullanılmadı. |
| 13 | Mayıs 2024 X12 flare'in Solar Orbiter verisine dayandığı ve o sırada Dünya'dan görünmediği | İkincil kaynak (Space.com). Dünya'dan görülüp görülmediği doğrulanmadı. |
| 14 | Perseverance'ta (Jezero) iyonlaştırıcı radyasyon dozimetresi olup olmadığı | Araştırılmadı. |
| 15 | Güncel DONKI Mars kayıtları ve gerçek zamanlı veri | Canlı API çağrısı yapılmadı. Örnek kayıtlar arama sonuçlarındaki DONKI web görünümlerinden alındı. |
| 16 | `DONKI-API doc` sayfasının tam adresi | CCMC sayfasında bağlantı var, adresini açıp okumadım. Parametreler 07/03/2025 tarihli DONKI sayfası sürümünden alındı. |

---

## 7. Kaynaklar

### Resmî NASA / NOAA (açılıp okundu **[A]**)
- CCMC Announcements, DONKI/API taşınması ve Mars Scoreboard betaları: https://ccmc.gsfc.nasa.gov/news/major-updates/
- CCMC DONKI System (hakkında, kataloglar, sorumluluk reddi): https://ccmc.gsfc.nasa.gov/tools/DONKI/
- Mars CME Scoreboard (uygulama): https://ccmc.gsfc.nasa.gov/CMESB-Mars/
- Mars CME Scoreboard (hakkında): https://ccmc.gsfc.nasa.gov/scoreboards/cme/mars/
- Mars SEP Scoreboard (yüklenmedi, içerik okunamadı): https://sep.ccmc.gsfc.nasa.gov/mars_intensity
- NOAA SWPC GOES proton akısı ve S-ölçeği eşikleri: https://www.swpc.noaa.gov/node/39

### Resmî NASA / DONKI sayfaları (arama özeti görüldü **[S]**)
- DONKI WSA-ENLIL+Cone kayıtları (Mars etki satırları): https://kauai.ccmc.gsfc.nasa.gov/DONKI/view/WSA-ENLIL/42110/1 ve https://kauai.ccmc.gsfc.nasa.gov/DONKI/view/WSA-ENLIL/43084/1
- DONKI FLR kaydı örneği (bağlı CME/SEP, enstrümanlar): https://kauai.ccmc.gsfc.nasa.gov/DONKI/view/FLR/42702/2
- DONKI FLR JSON çıktısı örneği: https://kauai.ccmc.gsfc.nasa.gov/DONKI/WS/get/FLR
- CCMC DONKI sayfasının 07/03/2025 sürümü (uç noktalar, parametreler): https://ccmc.gsfc.nasa.gov/tools/DONKI
- NASA, Curiosity RAD "Radiation Measurements on Mars": https://science.nasa.gov/?p=348225
- NASA/JPL, Eylül 2017 güneş fırtınası: https://www.jpl.nasa.gov/news/large-solar-storm-sparks-global-aurora-and-doubles-radiation-levels-on-the-martian-surface/
- NASA, Mayıs 2024 fırtınası: https://www.nasa.gov/missions/maven/nasa-watches-mars-light-up-during-epic-solar-storm/
- NASA, solar maximum'da Mars çalışması (phys.org kopyası): https://phys.org/news/2024-04-nasa-scientists-gear-solar-storms.pdf

### Hakemli yayınlar (özet görüldü **[S]**)
- Zeitlin, C. vd. (2018), "Analysis of the Radiation Hazard Observed by RAD on the Surface of Mars During the September 2017 Solar Particle Event", Space Weather 16(12).
- Guo, J. vd. (2021), "Radiation environment for future human exploration on the surface of Mars: the current understanding based on MSL/RAD dose measurements", Astron. Astrophys. Rev., doi:10.1007/s00159-021-00136-5.

### İkincil kaynaklar **[İ]**
- DONKI taşınmasına dair üçüncü taraf bildirimleri: https://github.com/ProgramComputer/NASA-MCP-server/releases/tag/v1.2.0 ve https://packagist.org/packages/omnilab/donki
- Flare sınıfları ve R/S/G ölçekleri özeti: https://newspaceeconomy.ca/2025/12/14/the-ultimate-guide-to-solar-flares-and-space-weather-scales/ ve https://www.spaceweatherlive.com/en/help/what-are-solar-flares
- Mayıs 2024 Mars fırtınası (Space.com): https://www.space.com/powerful-solar-storm-mars-radiation-astronaut-missions
- Mars atmosferi/manyetik alan genel anlatımı: https://theconversation.com/how-did-mars-lose-its-habitable-climate-the-answer-is-blowing-in-the-solar-wind-50258
- NASA API anahtarı/limit bilgisi (eski api.nasa.gov sistemi): https://api.nasa.gov/

### Atıf notu
CCMC, DONKI verisi kullanan çalışmalarda kaynak olarak DONKI ve CCMC'nin belirtilmesini ister. Önerilen kısa atıf: "Data: NASA CCMC DONKI (Community Coordinated Modeling Center, NASA GSFC)." Resmî örnek atıf metni için: https://ccmc.gsfc.nasa.gov/publication-policy/
