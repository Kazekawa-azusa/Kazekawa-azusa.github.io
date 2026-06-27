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
            proj_data['pinned'] = bool(proj_data.get('pinned', False))
            proj_data['is_new'] = bool(proj_data.get('new', False))
            proj_data['is_updated'] = bool(proj_data.get('updated', False))
            
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
                            
                            # 組合出這個角色專屬的真實路徑並替換
                            real_path = f"./projects/{cat_folder}/{proj_folder}/{item}/"
                            content = content.replace('./', real_path)

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
                                "is_updated": bool(sub_data.get('updated', False))
                            })
                    except Exception as e:
                        print(f"⚠️ Error reading Markdown {md_file_path}: {e}")

            if articles:
                # 確保 sort_order 是整數後進行排序 (原本的 reverse=True 代表數字大的在前面)
                sorted_articles = sorted(articles, key=lambda x: (int(x['sort_order']), x['folder_name']), reverse=True) 
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
    def proj_sort(x):
        c_order = cat_order_map.get(x.get('category'), 999)
        p_order = x.get('order', 999)
        return (
            int(c_order) if str(c_order).isdigit() else 999, 
            int(p_order) if str(p_order).isdigit() else 999
        )

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