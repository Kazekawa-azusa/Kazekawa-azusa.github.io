import os
import json
from convert_webp import convert_to_webp_with_protection
from update_paths import update_extensions_to_webp

def generate_projects_json():
    base_dir = 'projects'
    
    # 全新的資料結構，將分類與專案分開儲存
    output_data = {
        "categories": [],
        "projects": []
    }

    if not os.path.exists(base_dir):
        print(f"Directory '{base_dir}' not found.")
        return

    # 自動掃描 base_dir 下的所有資料夾 (大分類)
    for cat_folder in os.listdir(base_dir):
        cat_path = os.path.join(base_dir, cat_folder)
        if not os.path.isdir(cat_path): continue

        # 1. 讀取大分類的 detail.json
        cat_json_path = os.path.join(cat_path, 'detail.json')
        cat_title = cat_folder 
        cat_meta = ""   
        cat_desc = ""   
        cat_cover = None  # ✨ 新增
        cat_order = 999

        if os.path.isfile(cat_json_path):
            try:
                with open(cat_json_path, 'r', encoding='utf-8') as f:
                    cat_data = json.load(f)
                    cat_title = cat_data.get('title', cat_folder)
                    cat_meta = cat_data.get('meta', '')           
                    cat_desc = cat_data.get('description', '')    
                    cat_cover = cat_data.get('cover') # ✨ 抓取圖片
                    cat_order = cat_data.get('order', 999)
            except Exception as e:
                print(f"Error reading {cat_json_path}: {e}")

        output_data["categories"].append({
            "id": cat_folder,
            "title": cat_title,
            "meta": cat_meta,            
            "description": cat_desc, 
            "cover_image": f"{base_dir}/{cat_folder}/{cat_cover}" if cat_cover else None, # ✨ 組合路徑
            "order": cat_order
        })

        # 2. 掃描分類底下的各個專案
        for proj_folder in os.listdir(cat_path):
            proj_path = os.path.join(cat_path, proj_folder)
            if not os.path.isdir(proj_path): continue

            proj_json_path = os.path.join(proj_path, 'detail.json')
            if not os.path.isfile(proj_json_path): continue

            try:
                with open(proj_json_path, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                
                data['id'] = proj_folder
                data['category'] = cat_folder
                data['order'] = data.get('order', 999) 
                
                # ✨ 新增：抓取專案的封面圖片
                proj_cover = data.get('cover')
                if proj_cover:
                    data['cover_image'] = f"{base_dir}/{cat_folder}/{proj_folder}/{proj_cover}"
                
                articles = []

                for item in os.listdir(proj_path):
                    item_path = os.path.join(proj_path, item)
                    md_file_path = None
                    article_id = item 
                    rel_base = f"{base_dir}/{cat_folder}/{proj_folder}" 
                    
                    meta_title = None
                    meta_desc = None
                    meta_order = 999 
                    meta_cover = None 

                    if os.path.isdir(item_path):
                        sub_json_path = os.path.join(item_path, 'detail.json')
                        if os.path.isfile(sub_json_path):
                            with open(sub_json_path, 'r', encoding='utf-8') as sub_f:
                                sub_data = json.load(sub_f)
                                meta_title = sub_data.get('title')
                                meta_desc = sub_data.get('description')
                                meta_order = sub_data.get('order', 999)
                                meta_cover = sub_data.get('cover') 

                        for sub_item in os.listdir(item_path):
                            if sub_item.endswith('.md'):
                                md_file_path = os.path.join(item_path, sub_item)
                                rel_base = f"{base_dir}/{cat_folder}/{proj_folder}/{item}"
                            elif sub_item.lower().endswith(('.png', '.jpg', '.jpeg', '.webp')):
                                if not meta_cover:
                                    meta_cover = sub_item
                                
                    if md_file_path:
                        with open(md_file_path, 'r', encoding='utf-8') as md_file:
                            content = md_file.read() 
                            
                            # 組合出這個角色專屬的真實路徑
                            real_path = f"./projects/{cat_folder}/{proj_folder}/{item}/"
                            
                            # 將文章中所有的 ./ 瞬間替換成真實路徑 (這樣 HTML 裡的 <img src="./..."> 就能起作用了)
                            content = content.replace('./', real_path)

                            final_title = meta_title
                            if not final_title:
                                if content.startswith('# '):
                                    final_title = content.split('\n')[0].replace('# ', '').strip()
                                else:
                                    final_title = article_id
                            
                            cover_path = f"{rel_base}/{meta_cover}" if meta_cover else None

                            articles.append({
                                "sort_order": meta_order,     
                                "folder_name": article_id,    
                                "title": final_title,
                                "description": meta_desc,
                                "cover_image": cover_path, 
                                "content": content
                            })

                if articles:
                    sorted_articles = sorted(articles, key=lambda x: (x['sort_order'], x['folder_name']), reverse=True) # New to Old
                    for art in sorted_articles:
                        del art['sort_order']
                        del art['folder_name']
                    data['articles'] = sorted_articles

                output_data["projects"].append(data)

            except Exception as e:
                print(f"Error reading {proj_path}: {e}")

    # 對分類與專案進行全域排序
    output_data["categories"].sort(key=lambda x: x.get('order', 999))
    output_data["projects"].sort(key=lambda x: x.get('order', 999))

    with open('all_projects.json', 'w', encoding='utf-8') as f:
        json.dump(output_data, f, ensure_ascii=False, indent=2)
    
    print(f"Success: Categorized {len(output_data['projects'])} projects into {len(output_data['categories'])} categories.")

if __name__ == "__main__":
    # ==========================================
    # 🚀 系統啟動序列
    # ==========================================
    
    # [Step 1] 優先執行圖片轉檔與防偽寫入
    # 設定 quality=25，並開啟自動模式 (auto_mode=False 代表遇到舊圖就跳過)
    convert_to_webp_with_protection(directory="projects", quality=25, auto_mode=False)
    
    # [Step 2] 執行原本的資料庫打包程序
    print(f"\n==========================================")
    print(f"📦 [第二階段] 開始解析 Markdown 並打包 JSON 資料庫...")
    print(f"==========================================")
    generate_projects_json()
    print(f"\n==========================================")
    print(f"📦 [第三階段] 開始修改路徑...")
    print(f"==========================================")
    update_extensions_to_webp()