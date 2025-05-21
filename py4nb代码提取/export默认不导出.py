

import json, sys, re
from pathlib import Path
from datetime import datetime

def exportpy(notebook_path):
    notebook = json.loads(Path(notebook_path).read_text(encoding='utf-8'))
    
    exported_code = []
    for cell in notebook['cells']:
        if cell['cell_type'] != 'code':
            continue
        source = cell['source']
        if not source:  # 空单元格跳过
            continue
        
  
        # 逐行检测, 检测到导出符号, 从下一行开始导出
        export_started_for_cell = False
        cell_clean_lines = []
        for line_content in source: # 遍历单元格的每一行
            stripped_line = line_content.strip()

            if export_started_for_cell:
                # 如果已经开始导出这个单元格的内容
                # 检查是否遇到 # ,test 标记，若是则停止导出该单元格后续内容
                if re.match(r'^\s*# ,test( .*)?$', stripped_line):
                    break 
                
                # 跳过其他注释行
                if not stripped_line.startswith('#'):
                    cell_clean_lines.append(line_content.rstrip('\n')) # 保留原始行（包括缩进）, 移除尾部回车, 因为组合的时候会加上. 不保留回车是因为最后一行会没有回车.
            else:
                # 如果尚未开始导出，检查当前行是否为 # ,export 标记
                if re.match(r'^\s*# ,export( .*)?$', stripped_line):
                    export_started_for_cell = True # 从下一行开始导出
        
        if cell_clean_lines:
            exported_code.extend(cell_clean_lines)
            

    output_path= f'{notebook_path}.py4nb.export{datetime.now().strftime("%d-%H:%M:%S")}.py'
    Path(output_path).write_text('\n'.join(exported_code), encoding='utf-8')







if __name__ == "__main__":
    if len(sys.argv) > 1:
        file_path = sys.argv[1]
        count = exportpy(file_path)
        print(count, file_path, "=====")
    else:
        print("======No file path provided.======")
        # sys.exit(1)
        # file_path = os.path.join(os.path.dirname(__file__), 'data', 'export.py')
        # count = exportpy(file_path)
        # print(count, file_path, "=====")