# 自动导出的py文件, 因此不必git控制, 控一下也好, 免得麻烦
# python自动缩进.ipynb.py4nb.export20-11:03:25

import re

def 预处理(content): 

    content = content.replace('\r\n', '\n').replace('\r', '\n')

   

    content = re.sub(r'\n\s*\n\s*\n+', '\n\n', content)

    lines= content.split('\n')

    for i in range(1, len(lines)):

        if lines[i].strip() == '':

            lines[i] = ' ' *(len(lines[i-1])-len(lines[i-1].lstrip())) 



    return '\n'.join(lines)

import re # 确保导入 re



def 预处理字符块(content):

    block_map = {}

    counter = 0



    def replacer(match):

        nonlocal counter # 允许修改外部作用域的计数器

        counter += 1

        holder=f'_$STR{counter}$$__'

        block_map[holder] = match.group(0)

        return holder # 用占位符替换

          

    pattern = r'"""[\s\S]*?"""|\'\'\'[\s\S]*?\'\'\''



    

    content = re.sub(pattern, replacer, content, flags=re.MULTILINE)

    

    return {

        "content": content,

        "block_map": block_map

    }
def 后处理字符块(content, block_map):

    for placeholder, block in block_map.items():

        content = content.replace(placeholder, block)

    return content
def 预处理注释(content):

    lines = content.split('\n')



    for i in range(len(lines)):

        #print(f'当前{i}行:', repr(lines[i]))

        line = lines[i]

        if line.lstrip().startswith('#'):

            current_indent = len(line) - len(line.lstrip())

            prev_indent = len(lines[i - 1]) - len(lines[i - 1].lstrip())if i > 0 else 0

            next_indent = len(lines[i + 1]) - len(lines[i + 1].lstrip())if i < len(lines) - 1 else 0

            prev_diff = abs(current_indent - prev_indent)

            next_diff = abs( next_indent -current_indent)

            #print(f'当前行缩进: {current_indent}, 上一行缩进: {prev_indent}, 下一行缩进: {next_indent}',                   f'差距: 前:{prev_diff}, 后:{next_diff}, {prev_diff <=next_diff}')

            lines[i] = ' ' * prev_indent + line.lstrip() if prev_diff <=next_diff else   ' ' * next_indent + line.lstrip()

  

    return '\n'.join(lines)
def 处理缩进(content):

    indent_width = 2

    lines = content.split('\n')

    原始缩进栈 = []

    result = []

   

    for line in lines:

        leading_spaces_count = len(line) - len(line.lstrip(' '))

        stripped_content = line.strip() # 干净的行.

       

        if not 原始缩进栈:

            原始缩进栈.append(leading_spaces_count)     

            result.append(stripped_content)

            continue

       

        while leading_spaces_count < 原始缩进栈[-1]:

            原始缩进栈.pop()  # 弹出栈顶元素

        if leading_spaces_count > 原始缩进栈[-1]:

            原始缩进栈.append(leading_spaces_count)

        

        result.append(' '*(len(原始缩进栈)-1)*indent_width+stripped_content)

                                 

    return '\n'.join(result)

def 整体处理(content):

    

    content = 预处理(content)

    #print('预处理后', content)

    result = 预处理字符块(content)

    content = result["content"]

    block_map = result["block_map"]

    #print('预处理字符块后', content)

    

    

    content = 预处理注释(content)

    #print('预处理注释后', content)

    

    content = 处理缩进(content)

    #print('处理缩进后', content)



    content = 后处理字符块(content=content, block_map=block_map)

    #print('后处理字符块后', content)

    

    return content



from datetime import datetime
def formatpy(filepath):
    
  with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()
    sacomm_result = 整体处理(content)
    # print("最终处理结果==================:\n", sacomm_result)
    # 在原本的文件旁边存放一个处理后的文件
    with open( f'{filepath}处理后{datetime.now().strftime("%d日%H:%M:%S")}.py', 'w', encoding='utf-8') as f2:
      f2.write(sacomm_result)
      print('处理完成, 结果存放在:', filepath.replace('.py', '_处理后日时分秒.py'))

import sys
if __name__ == "__main__":
    if len(sys.argv) > 1:
        file_path = sys.argv[1]
        count = formatpy(file_path)
        print(count, file_path, "=====")
    else:
        print("======No file path provided.======")