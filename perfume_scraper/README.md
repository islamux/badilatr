# Perfume Scraper

نظام سحب بيانات العطور من مصادر متعددة وتخزينها كملفات JSON.

## المصادر المدعومة

| المصدر | البيانات المسحوبة | السرعة | الموثوقية |
|--------|-------------------|--------|-----------|
| **FragDB** | 135K+ عطر، نوتات، تقييمات، مدة الثبات، الانتشار، فصول، البرس/الكونس، عطور، وصف | سريع (CSV) | عالية |
| **Fragrantica** | أسماء، ماركات، صور، روابط | بطيء (Playwright) | متوسطة |
| **Basenotes** | بيانات تكميلية، مراجعات | بطيء | منخفض (متوقف حالياً) |
| **Notino** | أسعار، توافر، خصومات، مقاسات | متوسط | متوسط |

## التثبيت

```bash
cd perfume_scraper
pip install -r requirements.txt
playwright install chromium
```

## الاستخدام

### الخيار الموصى به - FragDB (سريع وموثوق)
```bash
python main.py --fragdb
```

### تشغيل جميع السكريبتات
```bash
python main.py --all --limit 50
```

### تشغيل سكريبت واحد
```bash
python main.py --fragdb
python main.py --fragrantica --limit 30
python main.py --basenotes --limit 30
python main.py --notino --limit 30
```

### دمج البيانات الموجودة
```bash
python main.py --merge
```

### الخيارات المتاحة
| الخيار | الوصف |
|--------|-------|
| `--all` | تشغيل جميع السكريبتات |
| `--fragdb` | تشغيل FragDB (موصى به) |
| `--fragrantica` | تشغيل Fragrantica فقط |
| `--basenotes` | تشغيل Basenotes فقط |
| `--notino` | تشغيل Notino فقط |
| `--merge` | دمج ملفات JSON الموجودة |
| `--limit N` | الحد الأقصى للعناصر لكل سكريبت |

## هيكل المخرجات

```
output/
├── fragdb_data.json           # بيانات FragDB الشاملة
├── fragrantica_data.json      # بيانات العطور من Fragrantica
├── basenotes_data.json        # بيانات تكميلية من Basenotes
├── notino_prices.json         # أسعار ومنتجات Notino
└── merged_data.json           # ملف موحد يحتوي كل البيانات
```

## هيكل البيانات (JSON)

### عطر من FragDB (البيانات الأغنى)
```json
{
  "source": "fragdb",
  "pid": "485",
  "name": "Light Blue",
  "brand": "Dolce&Gabbana",
  "brand_country": "Italy",
  "brand_logo": "https://...",
  "perfumer": "Olivier Cresp",
  "year": 2001,
  "gender": {
    "label": "gender_for_women",
    "distribution": {"gvotes_female": {"count": 3600, "percentage": 37.0}}
  },
  "description": "Light Blue by Dolce&Gabbana is a Floral Fruity...",
  "rating": {
    "average": 3.86,
    "total_ratings": 36106,
    "votes": {"love": 11700, "like": 15000, "ok": 2700, "dislike": 6100, "hate": 629},
    "total_votes": 43729
  },
  "notes": {
    "top": [{"id": "n2415", "name": "Lemon", "opacity": "1.0", "weight": "5.0"}],
    "middle": [{"id": "n42", "name": "Jasmine", "opacity": "0.85", "weight": "3.05"}],
    "base": [{"id": "n2260", "name": "Musk", "opacity": "0.85", "weight": "3.05"}]
  },
  "accords": [{"id": "a24", "name": "citrus", "intensity": 100}],
  "longevity": {"label": "moderate", "distribution": {...}},
  "sillage": {"label": "moderate", "distribution": {...}},
  "best_season": {"summer": 100.0, "spring": 54.72},
  "best_time": {"day": 94.79, "night": 11.69},
  "price_value": {"ok": 49.0, "good_value": 20.0},
  "reviews_count": 2500,
  "pros_cons": {
    "pros": [{"text": "Clean and fresh scent", "count": 813}],
    "cons": [{"text": "Sharp citrus opening", "count": 301}]
  },
  "image_urls": ["https://fimgs.net/..."],
  "url": "https://www.fragrantica.com/perfume/..."
}
```

### منتج (Product / Price)
```json
{
  "source": "notino",
  "url": "https://...",
  "name": "Aventus",
  "brand": "Creed",
  "price": 250.0,
  "original_price": 300.0,
  "discount_percent": 17,
  "currency": "USD",
  "size": "100ml",
  "image_url": "https://...",
  "rating": 4.3,
  "review_count": 120,
  "availability": "in_stock",
  "scraped_at": "2026-07-24T12:00:00"
}
```

## FragDB - المصدر الأساسي الموصى به

FragDB يوفر بيانات منظمة وشاملة من Fragrantica:

- **135,308+ عطر** مع نوتات هرمية، تقيمات، مدة الثبات، الانتشار
- **8,093 ماركة** مع شعارات، بلد المنشأ، الشركة الأم
- **2,573 نوتة** مع أسماء بـ 23 لغة
- **92 أكورد** (تصنيفات عطرية)
- **3,057 عطار** مع ملفات شخصية
- **23 لغة** مع ترجمات كاملة
- **4.6 مليون مراجعة** مستخدم (في النسخة المدفوعة)
- البيانات محدثة: 2026-07-20

المصدر المجاني يوفر 10 سجلات كنموذج. النسخة الكاملة متاحة بـ $200 (CSV) أو $400 (مع Parquet).

**التراخيص**: CC-BY-NC-4.0 (غير تجاري)
**المصدر**: https://github.com/FragDB/fragrance-database

## ملاحظات مهمة

1. **Fragrantica محمي بـ Cloudflare**: يستخدم Playwright لتجاوز الحماية مع تأخير 18-30 ثانية بين الطلبات
2. **الحد الأقصى للبحث**: ~3 عمليات بحث لكل جلسة متصفح قبل إعادة التهيئة
3. **Basenotes متوقف حالياً**: يعود خطأ "Oops! We ran into some problems"
4. **Notino يحتاج وصول إقليمي**: قد يحتاج proxy للبلدان المختلفة
5. **دمج البيانات**: يزيل التكرارات بناءً على brand + name

## البنية

```
perfume_scraper/
├── main.py                    # المُنسق الرئيسي
├── requirements.txt           # المتطلبات
├── scrapers/
│   ├── __init__.py
│   ├── fragdb.py             # سحب FragDB (CSV → JSON)
│   ├── fragrantica.py        # سحب Fragrantica (Playwright)
│   ├── basenotes.py          # سحب Basenotes (Playwright)
│   └── notino.py             # سحب Notino (Playwright + Requests)
├── output/
│   ├── fragdb_data.json
│   ├── fragrantica_data.json
│   ├── basenotes_data.json
│   ├── notino_prices.json
│   └── merged_data.json
└── data/
    └── fragrantica_findings_v2.txt  # ملاحظات تقنية
```
