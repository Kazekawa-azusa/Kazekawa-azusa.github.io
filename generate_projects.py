import os
import json

def generate_projects_json():
    projects_dir = 'projects'
    all_projects = []

    # 檢查 projects 資料夾是否存在
    if not os.path.exists(projects_dir):
        print(f"Directory '{projects_dir}' not found.")
        return

    # 遍歷子資料夾
    for folder_name in os.listdir(projects_dir):
        folder_path = os.path.join(projects_dir, folder_name)
        
        if os.path.isdir(folder_path):
            json_path = os.path.join(folder_path, 'detail.json')
            
            if os.path.isfile(json_path):
                try:
                    with open(json_path, 'r', encoding='utf-8') as f:
                        data = json.load(f)
                        # 將資料夾名稱也存入，以防 detail.json 沒寫 title
                        data['id'] = folder_name
                        all_projects.append(data)
                except Exception as e:
                    print(f"Error reading {json_path}: {e}")

    # 寫入總表
    with open('all_projects.json', 'w', encoding='utf-8') as f:
        json.dump(all_projects, f, ensure_ascii=False, indent=2)
    
    print(f"Successfully generated all_projects.json with {len(all_projects)} projects.")

if __name__ == "__main__":
    generate_projects_json()