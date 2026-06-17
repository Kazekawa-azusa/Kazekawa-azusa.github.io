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

# 👇 增加 auto_mode 參數，預設為 None
def convert_to_webp_with_protection(directory="projects", quality=85, auto_mode=None):
    """
    掃描目錄下的圖片，進行「降解析度」、「寫入版權 EXIF」並轉換為 WebP。
    包含已存在檔案的處理策略選擇，並支援無外掛自動化執行。
    """
    print(f"\n==========================================")
    print(f"🔍 [第一階段] 啟動 WebP 轉檔與防禦系統...")
    print(f"==========================================")
    
    # 👇 核心邏輯：如果是自動模式，就不問問題直接執行；如果是手動執行，才跳出選項
    if auto_mode is not None:
        force_overwrite = auto_mode
        mode_text = "複寫" if force_overwrite else "跳過"
        print(f"⚙️ 系統自動執行中：已設定遇到舊檔時「{mode_text}」。\n")
    else:
        print("遇到已經存在的 .webp 檔案時，您希望如何處理？")
        print("  [1] 跳過 (保留舊檔案，速度最快 - 預設)")
        print("  [2] 複寫 (強制重新轉檔並覆蓋舊檔案)")
        user_choice = input("請選擇 [1 或 2] (直接按 Enter 預設為 1): ").strip()
        force_overwrite = (user_choice == '2')

    if force_overwrite and auto_mode is None:
        print("\n⚠️ 已選擇「複寫」模式：將強制重新轉檔所有圖片！\n")
    elif auto_mode is None:
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
                # ------------------------------------------------
                # 🛡️ 終極淨化協議：無視原圖一切隱藏設定，強制轉生
                # ------------------------------------------------
                
                # 1. 抽取純淨靈魂：不管原圖是什麼妖魔鬼怪，一律強制轉化為標準 RGBA 像素陣列
                clean_img = img.convert("RGBA")
                
                # 2. 物理超渡：徹底抹除原圖夾帶的「毒性 Metadata」(如損壞的 ICC 描述檔或異常標籤)
                clean_img.info.clear()
                
                # 3. 降維打擊
                clean_img.thumbnail(MAX_SIZE, Image.Resampling.LANCZOS)
                
                # 4. 建立全新的數位簽名 (絕不繼承原圖 EXIF，先 clear 清空一切舊痕跡)
                clean_exif = clean_img.getexif()
                clean_exif.clear() 
                
                # 寫入我們純淨的版權宣告
                clean_exif[40093] = (AUTHOR_NAME + '\x00').encode('utf-16le')
                clean_exif[40092] = (COPYRIGHT_TEXT + '\x00').encode('utf-16le')
                clean_exif[315] = "Azustock" 
                
                exif_bytes = clean_exif.tobytes()

                # 5. 存檔 (現在這是一張血統絕對純淨的新圖片，WebP 引擎絕對不會再報錯！)
                clean_img.save(webp_path, "webp", quality=quality, exif=exif_bytes)
            
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
    convert_to_webp_with_protection(directory="projects", quality=25)