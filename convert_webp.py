import os
import glob
from PIL import Image

# ==========================================
# 🛡️ 防偽與轉檔設定區
# ==========================================
MAX_SIZE = (1920, 1920) 
AUTHOR_NAME = "Azustock (風川梓)"
COPYRIGHT_TEXT = f"Copyright (c) 2026 {AUTHOR_NAME}. All rights reserved."
# ==========================================

def convert_to_webp_with_protection(directory="projects", quality=85):
    """
    掃描目錄下的圖片，進行「降解析度」、「寫入版權 EXIF」並轉換為 WebP。
    包含已存在檔案的處理策略選擇。
    """
    print(f"🔍 準備掃描 {directory} 目錄下的圖片...\n")
    
    # 👇 新增：讓使用者在終端機選擇處理策略
    print("遇到已經存在的 .webp 檔案時，您希望如何處理？")
    print("  [1] 跳過 (保留舊檔案，速度最快 - 預設)")
    print("  [2] 複寫 (強制重新轉檔並覆蓋舊檔案)")
    user_choice = input("請選擇 [1 或 2] (直接按 Enter 預設為 1): ").strip()
    
    # 判斷使用者的選擇
    force_overwrite = (user_choice == '2')
    if force_overwrite:
        print("\n⚠️ 已選擇「複寫」模式：將強制重新轉檔所有圖片！\n")
    else:
        print("\n✅ 已選擇「跳過」模式：只會處理尚未轉檔的新圖片。\n")

    search_patterns = [
        f"{directory}/**/*.png",
        f"{directory}/**/*.jpg",
        f"{directory}/**/*.jpeg"
    ]
    
    image_files = []
    for pattern in search_patterns:
        image_files.extend(glob.glob(pattern, recursive=True))

    if not image_files:
        print("沒有找到需要轉換的圖片。")
        return

    success_count = 0
    skip_count = 0
    
    for img_path in image_files:
        try:
            file_name, ext = os.path.splitext(img_path)
            webp_path = f"{file_name}.webp"
            
            # 👇 新增：根據使用者的選擇決定是否跳過
            if os.path.exists(webp_path):
                if not force_overwrite:
                    # 如果不強制複寫，就跳過並增加計數
                    skip_count += 1
                    continue
                # 如果選擇複寫，程式就會繼續往下執行，直接覆蓋舊的 webp
                
            with Image.open(img_path) as img:
                # 🛡️ 防護 1：降維打擊
                img.thumbnail(MAX_SIZE, Image.Resampling.LANCZOS)
                
                # 🛡️ 防護 2：寫入隱形數位簽名 (EXIF)
                exif = img.getexif()
                exif[315] = AUTHOR_NAME
                exif[33432] = COPYRIGHT_TEXT
                exif_bytes = exif.tobytes()

                # 存檔
                if img.mode == ("RGBA") or ext.lower() == '.png':
                    img.save(webp_path, "webp", quality=quality, exif=exif_bytes)
                else:
                    img.save(webp_path, "webp", quality=quality, exif=exif_bytes)
            
            original_size = os.path.getsize(img_path) / 1024
            new_size = os.path.getsize(webp_path) / 1024
            
            if force_overwrite and os.path.exists(webp_path):
                 print(f"🔄 複寫成功: {img_path} ({original_size:.1f} KB -> {new_size:.1f} KB)")
            else:
                 print(f"✅ 轉換成功: {img_path} ({original_size:.1f} KB -> {new_size:.1f} KB)")
            
            success_count += 1
            
        except Exception as e:
            print(f"❌ 處理失敗 {img_path}: {e}")

    print("\n==========================================")
    print("🎉 系統處理完成！")
    print(f"   - 成功轉檔/複寫: {success_count} 張圖片")
    print(f"   - 跳過已存在圖: {skip_count} 張圖片")
    print("==========================================")

if __name__ == "__main__":
    convert_to_webp_with_protection(directory="projects", quality=85)