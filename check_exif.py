from PIL import Image

def verify_signature(image_path):
    try:
        with Image.open(image_path) as img:
            exif = img.getexif()
            
            # 讀取我們寫入的代碼: 315 (Artist), 33432 (Copyright)
            artist = exif.get(315, "未找到作者資訊")
            copyright_info = exif.get(33432, "未找到版權資訊")
            
            print(f"🔍 正在檢查: {image_path}")
            print(f"   👤 作者: {artist}")
            print(f"   ©️ 版權: {copyright_info}\n")
            
    except Exception as e:
        print(f"讀取失敗: {e}")

# 把括號裡的檔名換成你隨便一張轉好的 WebP
verify_signature(r"C:\Users\iambe\Desktop\git page\projects\writing\01_note\01_changer\architecture.webp")

# 1. 重新初始化一個乾淨的 Git 宇宙
git init

# 2. 把所有檔案（除了被 .gitignore 擋下來的 PNG 原圖）加入追蹤清單
git add .

# 3. 建立你這個全新宇宙的第一個 Commit
git commit -m "Initial commit with WebP optimization & Asset protection"

# 4. 將主分支重新命名為 main
git branch -M main

# 5. 綁定你剛剛建立的 GitHub 新庫 (請把下面的網址換成你的)
git remote add origin https://github.com/Kazekawa-azusa/Azustock.github.io.git

# 6. 正式發射推上雲端！
git push -u origin main