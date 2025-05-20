# 自动导出的py文件, 无需git控制, 控一下也好, 免得麻烦....
# QML代码格式处理.ipynb.py4nb.export20-11:23:29


状态={'准备':'准备','"':'字符串',"'":'字符串','`':'字符串','*': '块注释','/':'行注释',}



终止符={

'字符':{ '"':'"', "'":"'", '`':'`'},

'注释':{'*':'/', '/':'\n'}, 

'行注释':'\n',

'块注释':'/',

}

转义符='\\' # 字符串终止符会受转义符影响, 不再考虑单双引号是否跨行的情况.



def 准备处理(*, char, last, **无用参数):   

    开始符={'/','*', '"', "'", '`'}  

    if char not in 开始符:

        return 状态['准备'] 

    if char in 终止符['注释'] and last != '/': # * 这里是个硬编码, 但是, 就用在这一个地方, //和/* 都需要/

        return 状态['准备']

    return 状态[char]





def 处理字符串(*, char,  last, start_char, **无用参数):   

    return 状态['准备'] if (last != 转义符 and char == start_char) else '字符串'





def 处理行注释(*, char, **无用参数):

    return 状态['准备'] if char == 终止符['行注释'] else '行注释'



       

def 处理块注释(*, char, last, **无用参数):

    return 状态['准备'] if (last == '*' and char == 终止符['块注释']) else '块注释'



状态处理函数={

    '准备': 准备处理,

    '字符串':处理字符串,

    '行注释':处理行注释,

    '块注释':处理块注释,

}
占位原子='_CMN_PLH_'



def 提取块(content):





  sign=状态['准备'] # 代表当前状态



  c块 = {} # 用于存储匹配块

  占位符计数 = 1  # 占位符计数,  唯一的作用是区分不同的占位符

  stack = []  # 用于存储匹配的起始位置  

  r列表 = []  # 结果列表

  last='' # 缓存一个字符, 用于在(状态处理函数)判断转义, 注释









  for char in content:

      

      r列表.append(char)

      i= len(r列表)-1  # 获取当前字符的索引



      newsign=状态处理函数[sign](**{"char": char, "last": last, 'start_char':'' if not stack else stack[-1][1]})  # 调用状态处理函数

      last = char

      if newsign == sign: continue # 如果状态没有变化, 继续 

        

      

      sign = newsign # 更新状态

                         

      if newsign != 状态['准备']:

          stack.append((i, char))

          continue

      start, start_char = stack.pop()  # 获取起点位置和字符

      

      

      start -= 1 if start_char in 终止符['注释'] else 0





      holder=占位原子*占位符计数



      c块[holder] = "".join(r列表[start:]).rstrip()  # 去掉行尾空格回车



      r列表[start:] = list(holder)  # 替换为占位符

      

      r列表.append('\n') if char ==终止符['行注释'] else None



      占位符计数 +=1

      

  return {'content':"".join(r列表), 'c块': c块} # 返回替换后的内容和匹配块



def 删除尾部块(line):

    c=line.strip()

    while c and c.endswith(占位原子):

        c = c[:-len(占位原子)].rstrip()

    return c





def 删除所有块(content):

    return content.replace(占位原子, '')

def 放回块(*,content, c块):

    

    if not c块:

        return content



    lines = content.split('\n')



    i = len(lines)-1



    while i >=0 and c块:

        while list(c块.keys()) and list(c块.keys())[-1] in lines[i] :

            k, v= c块.popitem() # 弹出

            判断符=v[0]

            if 判断符 in 终止符['字符']:

                lines[i] =lines[i].replace(k, v)

            if 判断符 in 终止符['注释']:

                lines[i] = lines[i].replace(k, '')

                lines[i] = lines[i] + v.rstrip()

        i -= 1    



    content = '\n'.join(lines)

    return content

import re

def 预处理(content):

    content = content.replace('\r\n', '\n').replace('\r', '\n')

   

    content = re.sub(r'\n\s*\n\s*\n+', '\n\n', content)

    

    content = re.sub(r'\s+{', ' {', content)

    content = re.sub(r':\s+', ': ', content)

    

    lines =[lin.strip() for lin in content.split('\n')]

    



  

    

    return '\n'.join(lines) # 重新组合成字符串

def 处理缩进(content):

    indent_width = 2

    lines = content.split('\n')

    indent = 0

    result = []

    

    for line in lines:

        stripped = line.strip()

        

     

        

        if stripped.startswith('}'):

            indent = max(0, indent - 1)   # ? 这里不能continue, 因为还没把行添加到结果中.     

            

        result.append(' ' * (indent_width * indent) + stripped)

        

        temp = 删除尾部块(stripped).strip()

        if temp.endswith('{'):

            indent += 1

        

    

    content = '\n'.join(result)

    return content
def 处理括号(content):

  括号={    '(':')',    '[':']',    '{':'}'  }



  stack = []  # 用于存储匹配的起始位置  

  r列表 = []  # 结果列表



  for char in content:

      

      r列表.append(char)

      if char not in 括号 and char not in 括号.values():

          continue      

            

      if char in 括号:

        i= len(r列表)-1  # 获取当前字符的索引

        stack.append((i, char))

        continue

      elif not stack or char != 括号[stack[-1][1]]:

        continue



      start, _ = stack.pop()  # 获取起点位置和字符

      temp = r列表[start:]  # 获取当前块



      if char in ')]':

          r列表[start:] = [c for c in temp if c != '\n']



      if char == '}':

          istp = ''.join(temp[1:-1])







          lines = [line for line in 删除所有块(istp).split('\n') if line.strip()]

          r列表[start:] = [c for c in temp if c != '\n'] if len(lines) <2 else temp

      







      





                    

  return "".join(r列表) # 返回替换后的内容和匹配块

import re



def 处理单行(content):



    lines = content.split('\n')



    result = []



    lines = [line.strip() for line in lines]

    行尾符={ ')', ':', 'else', '=>'}

    

    i=0

    while i<len(lines)-1:

      lines[i] = lines[i].strip()

      if not any(lines[i].endswith(符) for 符 in 行尾符):

          result.append(lines[i])

          i += 1

          continue

      if lines[i].endswith(')'):

       # print('当前行:', lines[i])







        if re.search(r'(if|for)\s*\([^)]*\)$', lines[i]) or re.search(r'function[^(]+\([^)]*\)$', lines[i]): # 判断function 函数名(参数)这种情况





            lines[i] = lines[i] + lines.pop(i+1)



            continue       



        result.append(lines[i])

        i += 1

        continue



      

      else:

          lines[i] = lines[i].replace('else', 'else ') + lines.pop(i+1) #if i + 1 < len(lines) else lines[i]

          continue

    result.append(lines[i])    



        

    

    content = '\n'.join(result)

    return content









def 处理空格(content):

  content = re.sub(r'\t', ' ', content)  # 替换tab为空格

  content = re.sub(r' {2,}', ' ', content)  # 替换两个以上空格为一个空格

  content = re.sub(r'} +', '}', content)  # 替换}后面的空格

  content = content.replace('}else', '}\nelse')  # 替换}else}为}\nelse

  content = re.sub(' *(' + re.escape(占位原子) + '+) *', r'\1', content)

  return content



def deal(content):



  content=预处理(content)

 # print('预处理:',content)

  re=提取块(content)

  c块=re['c块']

  content=re['content']

 # print('替换后的内容:',re)



  content=处理括号(content)

 # print('处理括号:',content)

  content=处理单行(content)

 # print('处理单行:',content)





  content=处理空格(content)

 # print('空格处理:',content)



  content=放回块(content=content, c块=c块)

 # print('恢复块:',content)

  content=处理缩进(content)

  return content




from datetime import datetime
def formatpy(filepath):
    
  with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()
    sacomm_result = deal(content)
    # print("最终处理结果==================:\n", sacomm_result)
    # 在原本的文件旁边存放一个处理后的文件
    with open( f'{filepath}处理后{datetime.now().strftime("%d日%H:%M:%S")}.qml', 'w', encoding='utf-8') as f2:
      f2.write(sacomm_result)
      print('处理完成, 结果存放在:', filepath.replace('.qml', '_处理后日时分秒.qml'))

import sys
if __name__ == "__main__":
    if len(sys.argv) > 1:
        file_path = sys.argv[1]
        count = formatpy(file_path)
        print(count, file_path, "=====")
    else:
        print("======No file path provided.======")
