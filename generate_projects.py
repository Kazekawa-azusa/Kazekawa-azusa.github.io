import os
import json
import re
from convert_webp import convert_to_webp_with_protection
from update_paths import update_extensions_to_webp

# ==========================================
# 🛠️ 輔助系統 (Helper Functions)
# ==========================================
def parse_folder_meta(folder_name):
    """
    解析資料夾名稱，自動萃取排序編號與乾淨的標題。
    例如: '01_mind' -> order: 1, clean_title: 'mind'
          'literature' -> order: 999, clean_title: 'literature'
    """
    match = re.match(r'^(\d+)_+(.*)$', folder_name)
    if match:
        return int(match.group(1)), match.group(2)
    return 999, folder_name

def load_detail_json(json_path):
    """讀取 detail.json，若檔案不存在或損毀則安全回傳空字典"""
    if os.path.isfile(json_path):
        try:
            with open(json_path, 'r', encoding='utf-8') as f:
                return json.load(f)
        except Exception as e:
            print(f"⚠️ Error reading {json_path}: {e}")
    return {}

# ==========================================
# 🚀 主生成器邏輯
# ==========================================
def generate_projects_json():
    base_dir = 'projects'
    output_data = {"categories": [], "projects": []}

    if not os.path.exists(base_dir):
        print(f"❌ Directory '{base_dir}' not found.")
        return

    # ------------------------------------------
    # 1. 掃描大分類 (Categories)
    # ------------------------------------------
    for cat_folder in os.listdir(base_dir):
        cat_path = os.path.join(base_dir, cat_folder)
        if not os.path.isdir(cat_path): continue

        # 自動偵測預設排序與乾淨標題
        default_order, clean_title = parse_folder_meta(cat_folder)
        cat_data = load_detail_json(os.path.join(cat_path, 'detail.json'))

        cat_cover = cat_data.get('cover')

        output_data["categories"].append({
            "id": cat_folder, # 保留原始資料夾名做為路由 ID
            "title": cat_data.get('title', clean_title),
            "meta": cat_data.get('meta', ''),            
            "description": cat_data.get('description', ''), 
            "cover_image": f"{base_dir}/{cat_folder}/{cat_cover}" if cat_cover else None,
            "order": cat_data.get('order', default_order) # JSON 優先，否則用資料夾編號
        })

        # ------------------------------------------
        # 2. 掃描分類底下的專案 (Projects)
        # ------------------------------------------
        for proj_folder in os.listdir(cat_path):
            proj_path = os.path.join(cat_path, proj_folder)
            if not os.path.isdir(proj_path): continue

            # 如果專案沒有 detail.json，也允許它自動從資料夾名稱生成！
            proj_data = load_detail_json(os.path.join(proj_path, 'detail.json'))
            default_proj_order, clean_proj_title = parse_folder_meta(proj_folder)
            
            proj_data['id'] = proj_folder
            proj_data['category'] = cat_folder
            proj_data['title'] = proj_data.get('title', clean_proj_title)
            proj_data['order'] = proj_data.get('order', default_proj_order)
            
            # ==========================================
            # ✨ 新增：讀取專案 (Card) 的擴充標籤
            # ==========================================
            proj_data['date'] = proj_data.get('date', "")
            proj_data['version'] = str(proj_data.get('version', ""))
            proj_data['pinned'] = bool(proj_data.get('pinned', False))
            proj_data['is_new'] = bool(proj_data.get('new', False))
            proj_data['is_updated'] = bool(proj_data.get('updated', False))
            proj_data['is_wip'] = bool(proj_data.get('wip', False))
            proj_data['is_archived'] = bool(proj_data.get('archived', False))
            
            proj_cover = proj_data.get('cover')
            if proj_cover:
                proj_data['cover_image'] = f"{base_dir}/{cat_folder}/{proj_folder}/{proj_cover}"
            
            articles = []

            # ------------------------------------------
            # 3. 掃描專案底下的文章 (Articles)
            # ------------------------------------------
            for item in os.listdir(proj_path):
                item_path = os.path.join(proj_path, item)
                if not os.path.isdir(item_path): continue

                sub_data = load_detail_json(os.path.join(item_path, 'detail.json'))
                default_art_order, clean_art_title = parse_folder_meta(item)
                
                meta_title = sub_data.get('title', clean_art_title)
                meta_desc = sub_data.get('description')
                meta_order = sub_data.get('order', default_art_order)
                meta_cover = sub_data.get('cover')

                md_file_path = None
                rel_base = f"{base_dir}/{cat_folder}/{proj_folder}/{item}"

                # 尋找 Markdown 與封面圖片
                for sub_item in os.listdir(item_path):
                    if sub_item.endswith('.md'):
                        md_file_path = os.path.join(item_path, sub_item)
                    elif sub_item.lower().endswith(('.webp',)) and not meta_cover:
                        meta_cover = sub_item
                            
                if md_file_path:
                    try:
                        with open(md_file_path, 'r', encoding='utf-8') as md_file:
                            content = md_file.read() 
                            
                            # 組合出這個角色專屬的真實路徑
                            real_path = f"./projects/{cat_folder}/{proj_folder}/{item}/"
                            

                            # ==========================================
                            # ✨ 智慧路徑替換引擎 (Regex)
                            # ==========================================
                            # 1. 處理 Markdown 圖片: ![alt](url)
                            def replace_md_img(match):
                                alt_text, url = match.group(1), match.group(2)
                                if not url.startswith(('http://', 'https://', 'data:')):
                                    # ✨ 終極修復：如果你已經自己寫了 'projects/'，就絕對不要再疊加了！
                                    if 'projects/' not in url:
                                        clean_url = url[2:] if url.startswith('./') else url
                                        url = f"{real_path}{clean_url}"
                                return f"![{alt_text}]({url})"
                                
                            content = re.sub(r'!\[([^\]]*)\]\(([^)]+)\)', replace_md_img, content)

                            # 2. 處理 HTML 圖片: <img src="url">
                            def replace_html_img(match):
                                prefix, url, suffix = match.group(1), match.group(2), match.group(3)
                                if not url.startswith(('http://', 'https://', 'data:')):
                                    # ✨ 同樣加上防呆機制
                                    if 'projects/' not in url:
                                        clean_url = url[2:] if url.startswith('./') else url
                                        url = f"{real_path}{clean_url}"
                                return f"{prefix}{url}{suffix}"
                                
                            content = re.sub(r'(<img[^>]+src=["\'])([^"\']+)(["\'][^>]*>)', replace_html_img, content)

                            # 標題 fallback 邏輯
                            if sub_data.get('title') is None and content.startswith('# '):
                                meta_title = content.split('\n')[0].replace('# ', '').strip()

                            articles.append({
                                "sort_order": meta_order,     
                                "folder_name": item,    
                                "title": meta_title,
                                "description": meta_desc,
                                "cover_image": f"{rel_base}/{meta_cover}" if meta_cover else None, 
                                "content": content,
                                
                                # ==========================================
                                # ✨ 新增：讀取文章 (Article) 的擴充標籤
                                # ==========================================
                                "date": sub_data.get('date', ""),
                                "pinned": bool(sub_data.get('pinned', False)),
                                "is_new": bool(sub_data.get('new', False)),
                                "is_updated": bool(sub_data.get('updated', False)),
                                "is_wip": bool(sub_data.get('wip', False)),             # ✨ 新增 WIP 狀態
                                "is_archived": bool(sub_data.get('archived', False))    # ✨ 新增歸檔狀態
                            })
                    except Exception as e:
                        print(f"⚠️ Error reading Markdown {md_file_path}: {e}")

            if articles:
                # 定義排序邏輯：1. pinned(置頂) 優先，2. sort_order 編號，3. folder_name 字母
                def article_sort(x):
                    pinned_val = 1 if x.get('pinned', False) else 0
                    order_val = int(x.get('sort_order', 999))
                    return (-pinned_val, -order_val, x.get('folder_name', ''))

                sorted_articles = sorted(articles, key=article_sort)
                
                for art in sorted_articles:
                    del art['sort_order']
                    del art['folder_name']
                proj_data['articles'] = sorted_articles

            output_data["projects"].append(proj_data)

    # ------------------------------------------
    # 4. 全域防呆排序與存檔
    # ------------------------------------------
    def safe_sort(x):
        val = x.get('order', 999)
        return int(val) if str(val).isdigit() else 999

    # 1. 先把分類 (Categories) 排好
    output_data["categories"].sort(key=safe_sort)

    # 2. 建立一個對照表：讓專案知道自己的「大分類」排在第幾名
    cat_order_map = {cat['id']: cat['order'] for cat in output_data["categories"]}

    # 3. 專案排序魔法：(分類排名, 專案排名)
    # 這樣 JSON 裡面的專案就會完美按照分類群聚，且內部也有序！
    # 3. 專案排序魔法：(分類排名, 置頂優先, sort_order 編號, folder_name 字母)
    def proj_sort(x):
        # 1. 分類順序 (這塊維持不變，確保大分類區塊順序)
        c_order = cat_order_map.get(x.get('category'), 999)
        
        # 2. 置頂優先 (Pinned 為 True 的排前面)
        # 用負號讓 True (1) 變成 -1，False (0) 變成 0，這樣 -1 會排在 0 前面
        pinned_val = -1 if x.get('pinned', False) else 0
        
        # 3. sort_order 編號 (數字越大越前面)
        p_order = -int(x.get('order', 999))
        
        # 4. folder_name 字母 (A-Z)
        name_val = x.get('id', '')

        return (
            int(c_order) if str(c_order).isdigit() else 999,
            pinned_val,
            p_order,
            name_val
        )

    output_data["projects"].sort(key=proj_sort)

    output_data["projects"].sort(key=proj_sort)

    with open('all_projects.json', 'w', encoding='utf-8') as f:
        json.dump(output_data, f, ensure_ascii=False, indent=2)
    
    print(f"✅ Success: Categorized {len(output_data['projects'])} projects into {len(output_data['categories'])} categories.")

if __name__ == "__main__":
    # ==========================================
    # 🚀 系統啟動序列
    # ==========================================
    convert_to_webp_with_protection(directory="projects", quality=25, auto_mode=False)
    
    print(f"\n==========================================")
    print(f"📦 [第二階段] 開始解析 Markdown 並打包 JSON 資料庫...")
    print(f"==========================================")
    generate_projects_json()
    
    print(f"\n==========================================")
    print(f"📦 [第三階段] 開始修改路徑...")
    print(f"==========================================")
    update_extensions_to_webp()