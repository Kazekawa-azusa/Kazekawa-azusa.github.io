import os
import json

import os
import json

def generate_projects_json():
    base_dir = 'projects'
    # 定義你想要的分類資料夾名稱
    categories = ['code', 'music', 'art'] # 指定 分類資料夾名稱
    all_projects = []

    if not os.path.exists(base_dir):
        print(f"Directory '{base_dir}' not found.")
        return

    for cat in categories:
        cat_path = os.path.join(base_dir, cat)
        
        if os.path.isdir(cat_path):
            # 遍歷分類資料夾（如 projects/code/）下的每個專案
            for folder_name in os.listdir(cat_path):
                project_path = os.path.join(cat_path, folder_name)
                
                if os.path.isdir(project_path):
                    json_path = os.path.join(project_path, 'detail.json')
                    
                    if os.path.isfile(json_path):
                        try:
                            with open(json_path, 'r', encoding='utf-8') as f:
                                data = json.load(f)
                                data['id'] = folder_name
                                # ✨ 自動填寫分類：直接根據它所在的父資料夾名稱 (code/music/art)
                                data['category'] = cat 
                                all_projects.append(data)
                        except Exception as e:
                            print(f"Error reading {json_path}: {e}")

    with open('all_projects.json', 'w', encoding='utf-8') as f:
        json.dump(all_projects, f, ensure_ascii=False, indent=2)
    
    print(f"Success: Categorized {len(all_projects)} projects into {categories}.")

if __name__ == "__main__":
    generate_projects_json()