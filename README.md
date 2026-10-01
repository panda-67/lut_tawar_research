# Lut Tawar Riparian Analysis

Analisis spasial dan vegetasi kawasan riparian Danau Lut Tawar menggunakan Google Earth Engine, Sentinel-2, dan Node.js.

Repository ini dikembangkan untuk membangun baseline spasial kawasan danau dan riparian sebagai dasar perencanaan restorasi vegetasi selama periode lima tahun.

## Tujuan

Analisis ini bertujuan untuk:

1. Delineasi badan air utama Danau Lut Tawar menggunakan Modified Normalized Difference Water Index (MNDWI).
2. Mengidentifikasi batas danau utama serta panjang garis pantainya.
3. Membentuk zona riparian berdasarkan jarak dari garis pantai.
4. Menghitung statistik NDVI untuk setiap zona riparian.
5. Mengidentifikasi kandidat restorasi berdasarkan nilai NDVI rendah.
6. Menghitung luas kandidat restorasi berdasarkan zona.
7. Menyediakan baseline spasial yang dapat digunakan untuk menyusun target restorasi lima tahun.

## Data dan Metode

### Citra Sentinel-2

Analisis vegetasi menggunakan citra Sentinel-2 Surface Reflectance dengan kombinasi band:

- B4 — Red
- B8 — Near Infrared (NIR)
- B3 — Green
- B11 — Short-wave Infrared (SWIR)

Periode dan batas cloud ditentukan melalui konfigurasi pada:

```text
config/config.js
```

### Delineasi Danau

Badan air didelineasi menggunakan MNDWI:

```text
MNDWI = (Green - SWIR) / (Green + SWIR)
```

dengan:

- Green = Sentinel-2 B3
- SWIR = Sentinel-2 B11

Mask air kemudian dikonversi menjadi polygon menggunakan `reduceToVectors()`.

Polygon air diberi atribut luas dan diurutkan berdasarkan luas. Polygon terbesar digunakan sebagai representasi badan utama Danau Lut Tawar.

### Garis Pantai

Garis pantai diekstraksi dari geometri danau utama.

Hasil baseline saat ini:

| Parameter            |        Nilai |
| -------------------- | -----------: |
| Luas danau utama     | ±5,742.99 ha |
| Luas raster air      | ±5,720.19 ha |
| Jumlah polygon air   |          173 |
| Panjang garis pantai |    ±68.74 km |

Perbedaan antara luas polygon danau utama dengan luas raster air berasal dari proses vektorisasi dan representasi geometri.

## Zona Riparian

Zona riparian dibentuk berdasarkan jarak dari garis pantai danau utama:

| Zona             | Jarak dari danau |
| ---------------- | ---------------: |
| `riparian_0_5`   |            0–5 m |
| `riparian_5_20`  |           5–20 m |
| `riparian_20_50` |          20–50 m |

Zona dibentuk secara bertingkat sehingga tidak saling tumpang tindih:

```text
Danau
│
├── 0–5 m
│
├── 5–20 m
│
└── 20–50 m
```

Luas baseline zona:

| Zona    |       Luas |
| ------- | ---------: |
| 0–5 m   |  ±36.95 ha |
| 5–20 m  |  ±81.27 ha |
| 20–50 m | ±144.56 ha |

Zona 0–50 m digunakan sebagai analytical riparian extent untuk analisis vegetasi.

## Analisis NDVI

NDVI dihitung menggunakan:

```text
NDVI = (NIR - Red) / (NIR + Red)
```

dengan:

- NIR = Sentinel-2 B8
- Red = Sentinel-2 B4

Composite NDVI dibuat menggunakan median dari citra yang tersedia pada periode analisis.

Statistik yang dihitung untuk setiap zona:

- mean
- median
- minimum
- maksimum
- standard deviation

Baseline NDVI saat ini:

| Zona    |  Mean | Median |    Min |   Max |    SD |
| ------- | ----: | -----: | -----: | ----: | ----: |
| 0–5 m   | 0.167 |  0.113 | -0.402 | 0.834 | 0.241 |
| 5–20 m  | 0.399 |  0.426 | -0.428 | 0.903 | 0.283 |
| 20–50 m | 0.599 |  0.660 | -0.480 | 0.918 | 0.227 |

Nilai tersebut merupakan baseline kondisi vegetasi pada periode citra yang digunakan dan bukan interpretasi langsung terhadap tipe tutupan lahan.

## Kandidat Restorasi

Kandidat restorasi awal ditentukan menggunakan threshold:

```text
NDVI < 0.4
```

Threshold 0.4 digunakan sebagai **screening threshold** untuk mengidentifikasi area dengan vegetasi relatif rendah.

Nilai ini tidak dimaksudkan sebagai batas ekologis universal yang secara otomatis menetapkan suatu area sebagai area terdegradasi. Kandidat tetap perlu dipertimbangkan bersama informasi penggunaan lahan, kondisi lapangan, aksesibilitas, kepemilikan/pengelolaan lahan, dan faktor ekologis lainnya.

Hasil saat ini menghasilkan:

| Zona      | Jumlah kandidat |
| --------- | --------------: |
| 0–5 m     |             655 |
| 5–20 m    |             438 |
| 20–50 m   |             259 |
| **Total** |       **1,352** |

Kandidat restorasi disimpan dalam FeatureCollection yang sama dengan layer analisis utama.

## Struktur Atribut

Output utama:

```text
data/output/lake_riparian_analysis.geojson
```

Feature dibedakan menggunakan dua atribut utama:

```text
zone_type
zone
```

### `zone_type`

Menunjukkan fungsi feature:

```text
lake
riparian
restoration
```

### `zone`

Menunjukkan zona spasial:

```text
main_lake
riparian_0_5
riparian_5_20
riparian_20_50
```

Untuk kandidat restorasi, kombinasi keduanya digunakan untuk membedakan kandidat berdasarkan zona:

```text
zone_type = restoration
zone = riparian_0_5
```

atau:

```text
zone_type = restoration
zone = riparian_5_20
```

## Output

Output utama merupakan satu GeoJSON gabungan:

```text
data/output/lake_riparian_analysis.geojson
```

Saat ini terdiri dari:

```text
1     main lake
3     riparian zone features
1349  restoration candidate polygons
------------------------------------
1353  total features
```

Layer gabungan ini dirancang agar dapat langsung dibuka di QGIS untuk visualisasi dan analisis lanjutan.

## Struktur Repository

```text
lut-tawar-ndvi/
│
├── config/
│   └── config.js
│
├── data/
│   ├── input/
│   └── output/
│       └── lake_riparian_analysis.geojson
│
├── src/
│   ├── auth.js
│   ├── roi.js
│   ├── sentinel2.js
│   ├── mndwi.js
│   ├── lake.js
│   ├── shoreline.js
│   ├── ndvi.js
│   ├── restoration.js
│   ├── map.js
│   │
│   └── pipelines/
│       ├── imagery.js
│       ├── lake.js
│       ├── riparian.js
│       ├── vegetation.js
│       ├── restoration.js
│       └── analysis.js
│
├── main.js
├── package.json
└── README.md
```

## Pipeline Analisis

Pipeline utama berjalan secara berurutan:

```text
ROI
 │
 ▼
Sentinel-2 imagery
 │
 ▼
MNDWI
 │
 ▼
Water mask
 │
 ▼
Water polygons
 │
 ▼
Main lake
 │
 ▼
Shoreline
 │
 ▼
Riparian zones
 │
 ├── 0–5 m
 ├── 5–20 m
 └── 20–50 m
       │
       ▼
    NDVI composite
       │
       ▼
   NDVI statistics
       │
       ▼
   NDVI < 0.4
       │
       ▼
Restoration candidates
       │
       ▼
Combined GeoJSON
```

## Menjalankan Analisis

Install dependencies:

```bash
pnpm install
```

Jalankan pipeline:

```bash
node main.js
```

Output akan dibuat pada:

```text
data/output/lake_riparian_analysis.geojson
```

Pipeline menggunakan Google Earth Engine sehingga autentikasi Earth Engine harus tersedia pada environment yang digunakan.

## Prinsip Pemrosesan

Sebagian besar operasi Google Earth Engine dilakukan secara server-side. Pipeline membangun computation graph terlebih dahulu dan hanya mengambil hasil pada tahap output akhir.

Pendekatan ini digunakan untuk mengurangi jumlah request individual ke Earth Engine.

Khususnya, pipeline tidak melakukan `getInfo()` untuk setiap polygon kandidat restorasi. Luas kandidat dihitung sebagai atribut server-side dan seluruh FeatureCollection diambil pada tahap output.

## Perencanaan Restorasi Lima Tahun

Tahap analisis berikutnya adalah mengubah kandidat restorasi menjadi target restorasi lima tahun.

Perencanaan akan dilakukan berdasarkan tiga zona:

```text
5–20 m
   ↓
0–5 m
   ↓
20–50 m
```

Secara konseptual, zona 5–20 m akan menjadi fokus tahap awal, diikuti zona 0–5 m, kemudian zona 20–50 m pada tahap akhir.

Namun urutan tersebut merupakan kerangka perencanaan, bukan hasil dari model prioritisasi ekologis. Target akhir akan dihitung berdasarkan luas kandidat, kapasitas implementasi, kondisi lapangan, dan pertimbangan pengelolaan.

Tahap berikutnya akan menghitung:

```text
candidate area (ha)
        ↓
5-year restoration target
        ↓
annual restoration target
        ↓
target per riparian zone
```

## Status Analisis

| Komponen                      | Status     |
| ----------------------------- | ---------- |
| Sentinel-2 acquisition        | Selesai    |
| MNDWI                         | Selesai    |
| Water delineation             | Selesai    |
| Main lake extraction          | Selesai    |
| Shoreline extraction          | Selesai    |
| Riparian zoning               | Selesai    |
| NDVI composite                | Selesai    |
| NDVI statistics               | Selesai    |
| NDVI < 0.4 screening          | Selesai    |
| Restoration candidates        | Selesai    |
| Candidate area calculation    | Berikutnya |
| Five-year restoration target  | Berikutnya |
| Annual restoration allocation | Berikutnya |
| Field validation              | Berikutnya |

## Catatan Interpretasi

Hasil analisis merupakan **spatial screening baseline**. Kandidat restorasi tidak secara otomatis menunjukkan bahwa seluruh polygon harus direstorasi.

Validasi lapangan dan informasi tambahan diperlukan untuk menentukan:

- kondisi aktual vegetasi;
- tipe tutupan/penggunaan lahan;
- keberadaan permukiman atau infrastruktur;
- status dan pengelolaan lahan;
- kesesuaian jenis tumbuhan;
- aksesibilitas lokasi;
- kelayakan implementasi restorasi.

Dengan demikian, output utama repository ini berfungsi sebagai dasar spasial untuk tahap perencanaan dan prioritisasi restorasi berikutnya.
