
###ATTENTION: THIS PLAN IS UNDER DISSCUSSION

أرى أن هذه هي النقلة الصحيحة للمشروع. إذا بنيت Fragrance Knowledge Base بشكل احترافي فلن تكون منافسًا لمواقع العطور فقط، بل ستبني أصلًا تقنيًا (Data Asset) يمكن لاحقًا تشغيل:

محرك توصيات AI
مقارنة العطور
اكتشاف البدائل
تحليل اتجاهات السوق
تطبيق Mobile
API للعطور

الفكرة الأساسية: لا تسحب بيانات عطور فقط، بل تبني Graph للعطور والعلاقات بينها.

المصادر التي ذكرتها مناسبة كبداية:

Fragrantica يحتوي على قاعدة ضخمة من العطور والمراجعات (يذكر الموقع وجود أكثر من 135 ألف عطر وملايين المراجعات).
Parfumo ممتاز للأداء والمراجعات والتقييمات، ولديه عشرات الآلاف من مراجعات المستخدمين.

لكن سأقترح عليك Architecture أكثر احترافية:

المرحلة 1: بناء Data Pipeline

لا تبدأ بالـ scraping مباشرة.

ابنِ Pipeline:

Sources
   |
   |
Data Collectors
   |
   |
Raw Data Storage
   |
   |
Cleaning & Normalization
   |
   |
Knowledge Database
   |
   |
AI Embedding Engine
   |
   |
Recommendation Engine
المرحلة 2: مصادر البيانات
المصدر الأول: معلومات العطر الأساسية

من:

Fragrantica

نستخرج:

{
"name": "Aventus",
"brand": "Creed",
"year": 2010,
"gender": "Male",

"notes": {
"top": [
"Pineapple",
"Bergamot"
],

"heart":[
"Birch",
"Rose"
],

"base":[
"Musk",
"Oakmoss"
]
},

"accords":[
"Fruity",
"Woody",
"Fresh"
]
}
المصدر الثاني: مراجعات المستخدمين

نحتاج Dataset خاص:

ليس فقط:

⭐⭐⭐⭐⭐

بل تحليل النص:

مثال:

Review:

"Very powerful, lasts all day, smoky pineapple opening"

نحوّلها:

{
longevity: 9,
projection: 8,
sillage: 9,

sentiment:
"positive",

keywords:[
"smoky",
"powerful",
"long lasting"
]
}
المرحلة 3: تصميم قاعدة البيانات

لن أضع Review داخل جدول Perfume.

الأفضل:

perfumes
id
brand_id
name
slug
release_year
gender
family
embedding
perfume_notes
id
name
category

TOP
HEART
BASE
perfume_note_map
perfume_id
note_id
importance

مثلا:

Aventus

Pineapple
importance 0.9

Birch
importance 0.8
جدول تقييم الأداء

مهم جدًا لمشروعك:

perfume_performance
id

perfume_id

longevity_score

projection_score

sillage_score

season

occasion

مثلا:

Aventus

Longevity:
8.5

Projection:
8

Sillage:
8.7
المرحلة 4: نظام المراجعات

لا تخزن المراجعة فقط.

استخدم NLP.

جدول:

reviews
id

perfume_id

source

author

content

rating

created_at

ثم:

review_analysis
review_id


detected_notes[]

sentiment

longevity

projection

sillage

keywords[]

مثلا:

Review:

"Smells amazing but weak performance"

يصبح:

{
sentiment:"positive",

performance:{
 longevity:4,
 projection:3
}
}
المرحلة 5: قاعدة بيانات البدائل (أهم جزء)

لا تعتمد على المستخدمين فقط.

أنشئ:

perfume_similarity
id

original_perfume_id

alternative_perfume_id


similarity_score


similarity_reason


created_by

AI
EXPERT
COMMUNITY

مثال:

Original:

Baccarat Rouge 540


Alternative:

Lattafa Ana Abiyedh Rouge


Similarity:

91%


Reasons:

- Same sweet amber DNA
- Similar saffron accord
- Similar woody drydown
المرحلة 6: إدخال الذكاء الاصطناعي

لكل عطر أنشئ Document:

مثلا:

Perfume:
Tom Ford Oud Wood


Profile:

Luxury woody oriental fragrance.

Notes:
Oud
Rosewood
Cardamom
Vanilla


Character:
Elegant
Dry
Smoky
Warm


Performance:
Medium


Suitable:
Winter
Formal
Night

ثم:

Generate embedding:

vector(1536)

وتخزن في:

PostgreSQL + pgvector

بعدها:

البحث:

المستخدم:

اريد عطر يشبه Tom Ford Oud Wood

النظام:

Vector search:

Oud Wood
        |
        |
        ↓

Afnan Supremacy in Oud
89%

Lattafa Oud Mood
86%

Maison Alhambra Woody Oud
94%
المرحلة 7: ترتيب الأولويات

لا تحاول جمع 100 ألف عطر من البداية.

أنا سأبنيها هكذا:

Version 1

500 عطر فقط:

Luxury Designer

200

Niche

150

Arabic/Oud

150

لكن بجودة عالية.

لكل عطر:

بيانات كاملة
نوتات
تقييم
مراجعات
بديل واحد على الأقل

أفضل من:

10000 عطر ناقص.

المرحلة 8: مصادر إضافية أنصح بها

أضيف:

Basenotes

مفيد جدًا للمراجعات التاريخية والنقاشات القديمة.

المجتمع العطري غالبًا يستخدمه مع Fragrantica وParfumo كمراجع مكملة.

المرحلة 9: شكل البيانات النهائي

أريد أن تصل إلى شيء مثل:

{
perfume:"Dior Sauvage",

brand:"Dior",

profile:{
fresh:true,
woody:true,
spicy:true
},


notes:[
"bergamot",
"ambroxan",
"pepper"
],


performance:{
longevity:8,
projection:9
},


reviews:{
average_rating:4.4,
total_reviews:25000
},


alternatives:[

{
name:"Lattafa Asad",

similarity:92
},

{
name:"Afnan Modest Une",

similarity:89
}

]

}
الخطة الزمنية التي أقترحها
الشهر الأول

✅ Database design
✅ Scraper architecture
✅ Import 500 perfumes
✅ Admin dashboard لإدارة البيانات

الشهر الثاني

✅ Reviews engine
✅ Sentiment analysis
✅ Performance scoring

الشهر الثالث

✅ pgvector
✅ AI similarity engine
✅ Smart recommendations

الشهر الرابع

✅ Community system
✅ User submissions
✅ Voting system

رأيي النهائي: لا تبنِ موقع عطور، ابنِ "Wikipedia + IMDb + Recommendation Engine للعطور العربية والعالمية".

الميزة التنافسية الحقيقية ستكون ليست عدد العطور، بل جودة الـ Fragrance Knowledge Graph.

الخطوة التالية التي أقترحها: تصميم ERD كامل + Prisma Schema Production Ready لهذه القاعدة قبل كتابة أي كود Next.js.

بب
