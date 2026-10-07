#!/usr/bin/env python3
"""
Sync Products Script for Toko Online ISPARMO
Fetches all products from https://lynk.id/kangmasis and updates data/products.json.
Runs locally and automatically via GitHub Actions.
"""

import urllib.request
import re
import html as html_lib
import json
import os
import datetime

LYNK_URL = "https://lynk.id/kangmasis"
DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "data")
OUTPUT_FILE = os.path.join(DATA_DIR, "products.json")

# Predefined high-quality curated descriptions and metadata for known products
CURATED_METADATA = {
    "x711j36d856x": {
        "description": "Panduan taktis implementasi sistem otomatisasi marketing berbasis Artificial Intelligence untuk bisnis UMKM. Ubah foto produk dari HP menjadi mesin penjualan otomatis.",
        "badge": "Best Seller",
        "featured": True,
        "tags": ["AI Marketing", "Ebook PDF", "UMKM", "Penjualan Otomatis"],
        "icon": "fa-chart-line"
    },
    "xq91xyr80x0k": {
        "description": "Aplikasi web AI inovatif untuk menghasilkan foto produk berstandar studio profesional dalam hitungan detik tanpa kamera mahal atau studio foto fisik.",
        "badge": "Aplikasi Populer",
        "featured": True,
        "tags": ["Aplikasi Web AI", "Foto Studio", "Katalog Produk", "E-Commerce"],
        "icon": "fa-camera-retro"
    },
    "lp5vl38ln7qe": {
        "description": "Buku panduan langkah demi langkah cara membuat website profesional dan landing page konversi tinggi dengan bantuan AI tanpa perlu keahlian coding rumit.",
        "badge": "Ebook Praktis",
        "featured": False,
        "tags": ["Website AI", "Ebook PDF", "Landing Page", "No-Code"],
        "icon": "fa-laptop-code"
    },
    "o25erzp0d5p9": {
        "description": "Buku panduan revolusioner bagi para guru & pendidik sekolah untuk mengintegrasikan AI ke dalam persiapan materi ajar, modul pembelajaran, dan evaluasi siswa.",
        "badge": "Rekomendasi Guru",
        "featured": True,
        "tags": ["Guru Cyborg", "AI Pendidikan", "Ebook PDF", "Modul Ajar"],
        "icon": "fa-chalkboard-teacher"
    },
    "6xe7zvl66vo7": {
        "description": "Aplikasi generator website dan landing page instan berbasis AI. Ciptakan struktur web penjualan profesional yang persuasif dan siap pakai seketika.",
        "badge": "Aplikasi Web",
        "featured": False,
        "tags": ["Aplikasi Web AI", "Insinyur Website", "Automasi", "Generator Web"],
        "icon": "fa-code"
    },
    "620p64yexwee": {
        "description": "Asisten cerdas berbasis AI untuk microstocker Adobe Stock. Menghasilkan judul, deskripsi, dan keyword SEO berkualitas tinggi yang lolos kurasi dan laris.",
        "badge": "Tools AI",
        "featured": False,
        "tags": ["Adobe Stock", "Aplikasi Web", "Microstock", "Keyword AI"],
        "icon": "fa-images"
    },
    "y6bVlZB": {
        "description": "Akses video rekaman pelatihan mendalam dan materi eksklusif tentang cara memproduksi gambar dan video berkualitas tinggi menggunakan berbagai tools AI canggih.",
        "badge": "Video & Pelatihan",
        "featured": False,
        "tags": ["Video Pelatihan", "AI Gambar", "AI Video", "Studi Kasus"],
        "icon": "fa-video"
    },
    "2q4qqvnrgomg": {
        "description": "Tutorial lengkap dan panduan praktis memaksimalkan Google Gemini AI untuk kebutuhan guru: pembuatan soal, RPP otomatis, rangkuman, dan ide pengajaran kreatif.",
        "badge": "Ebook Guru",
        "featured": False,
        "tags": ["Google Gemini", "Ebook Guru", "Panduan AI", "Edukasi"],
        "icon": "fa-book-open"
    },
    "znrnnl0nze1g": {
        "description": "Kumpulan prompt siap pakai dan strategi pemanfaatan ChatGPT bagi tenaga pendidik untuk menghemat waktu administrasi serta menciptakan suasana kelas interaktif.",
        "badge": "Ebook Guru",
        "featured": False,
        "tags": ["ChatGPT Guru", "Prompt Library", "Ebook PDF", "Produktivitas Guru"],
        "icon": "fa-robot"
    }
}

def determine_category(title):
    t = title.lower()
    if any(k in t for k in ["aplikasi", "studio", "insinyur", "assistant", "web app", "tools"]):
        return "app"
    elif any(k in t for k in ["ebook", "buku", "panduan", "tutorial"]):
        return "ebook"
    elif any(k in t for k in ["video", "rekaman", "pelatihan", "kursus", "workshop", "webinar"]):
        return "pelatihan"
    return "lainnya"

def fetch_lynk_products():
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7"
    }
    
    print(f"Fetching from {LYNK_URL}...")
    req = urllib.request.Request(LYNK_URL, headers=headers)
    with urllib.request.urlopen(req, timeout=20) as resp:
        html = resp.read().decode("utf-8")
        
    print(f"Received {len(html)} bytes HTML. Parsing products...")
    
    # Match product cards: <a href="/kangmasis/[id]" ...
    cards = re.findall(r'<a\s+href=[\'"](/kangmasis/[^\'"]+)[\'"][^>]*class=[\'"][^\'"]*[\'"]>(.*?)</a>', html, re.DOTALL)
    
    parsed = []
    seen_ids = set()
    
    for href, inner in cards:
        if "login" in href:
            continue
            
        prod_id = href.replace("/kangmasis/", "").strip("/")
        if not prod_id or prod_id in seen_ids:
            continue
        seen_ids.add(prod_id)
        
        # Title extraction
        title_match = re.search(r'<p[^>]*style=[\'"]font-size:16px;?[\'"][^>]*>(.*?)</p>', inner, re.DOTALL)
        if not title_match:
            # Fallback to any inner paragraph or title element
            title_match = re.search(r'<p[^>]*class=[\'"][^\'"]*filter-0[^\'"]*[\'"][^>]*>(.*?)</p>', inner, re.DOTALL)
            
        title = html_lib.unescape(title_match.group(1).strip()) if title_match else ""
        if not title:
            continue
            
        # Price extraction
        price_match = re.search(r'(IDR|Rp)[\s\xa0]*([0-9\.,]+)', inner)
        raw_price = price_match.group(0).strip() if price_match else "Cek Harga di Lynk.id"
        
        # Numeric price calculation
        numeric_str = re.sub(r'[^\d]', '', raw_price) if price_match else "0"
        numeric_price = int(numeric_str) if numeric_str else 0
        
        # Image extraction
        img_match = re.search(r'<img[^>]*src=[\'"]([^\'"]+)[\'"]', inner)
        img_url = img_match.group(1) if img_match else ""
        
        # Category
        category = determine_category(title)
        
        # Pull from curated metadata if available, else generate defaults
        curated = CURATED_METADATA.get(prod_id, {})
        description = curated.get("description", f"Produk digital resmi dari Toko Online ISPARMO. Beli dan akses instan sekarang melalui Lynk.id.")
        badge = curated.get("badge", "Produk Baru" if category != "app" else "Aplikasi AI")
        featured = curated.get("featured", False)
        tags = curated.get("tags", [category.upper(), "AI", "Digital"])
        
        product_item = {
            "id": prod_id,
            "title": title,
            "category": category,
            "price": raw_price,
            "priceNumeric": numeric_price,
            "url": f"https://lynk.id/kangmasis/{prod_id}",
            "image": img_url,
            "description": description,
            "badge": badge,
            "featured": featured,
            "tags": tags,
            "affiliateUrl": f"https://lynk.id/kangmasis/{prod_id}?aff=1",
            "lastSynced": datetime.datetime.now(datetime.timezone.utc).isoformat()
        }
        parsed.append(product_item)
        
    return parsed

def main():
    os.makedirs(DATA_DIR, exist_ok=True)
    
    existing_products = []
    if os.path.exists(OUTPUT_FILE):
        try:
            with open(OUTPUT_FILE, "r", encoding="utf-8") as f:
                data = json.load(f)
                existing_products = data.get("products", [])
        except Exception as e:
            print(f"Warning reading existing data: {e}")

    try:
        scraped_products = fetch_lynk_products()
        print(f"Successfully scraped {len(scraped_products)} products from Lynk.id.")
    except Exception as e:
        print(f"Error scraping Lynk.id: {e}")
        if existing_products:
            print("Using existing products as fallback.")
            scraped_products = existing_products
        else:
            raise

    # Store metadata
    output_data = {
        "store": {
            "name": "Toko Online ISPARMO",
            "subtitle": "Menyediakan Buku PDF (Ebook), Aplikasi berbasis AI, dan Pelatihan Online. Tersedia affiliate melalui Lynk.id.",
            "owner": "ISPARMO",
            "profileHandle": "@kangmasis",
            "profileUrl": "https://lynk.id/kangmasis",
            "profileImage": "assets/images/isparmo-profile.jpg",
            "mainWebsite": "https://www.isparmo.com",
            "whatsapp": "https://wa.me/628121083060",
            "facebook": "https://facebook.com/isparmo.ir",
            "youtube": "https://youtube.com/c/isparmoseo",
            "instagram": "https://instagram.com/isparmophotos",
            "linkedin": "https://linkedin.com/in/ir-isparmo-ipm-489833177",
            "email": "mail@isparmo.com",
            "affiliateNote": "Dapatkan komisi affiliate menarik untuk setiap penjualan produk ISPARMO melalui platform Lynk.id."
        },
        "totalProducts": len(scraped_products),
        "lastUpdated": datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC"),
        "products": scraped_products
    }

    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        json.dump(output_data, f, indent=2, ensure_ascii=False)

    print(f"Saved {len(scraped_products)} products to {OUTPUT_FILE}.")

if __name__ == "__main__":
    main()
