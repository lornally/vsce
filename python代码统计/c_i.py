# 扩展于外部的c_sta.py

import re
import sys

def count_effective_chars(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # 移除单行注释（# 开头直到行尾）
    content = re.sub(r'#.*$', '', content, flags=re.MULTILINE)
    # 移除多行注释（''' 或 """ 开头和结尾）
    content = re.sub(r'\'\'\'.*?\'\'\'|""".*?"""', '', content, flags=re.DOTALL)
    # 移除空白字符（空格、换行等）
    effective_content = ''.join(content.split())
    
    return len(effective_content)

# 示例使用
# file_path = "/Users/bergman/my2024/X/oh-my-project/技术/我的编辑器_MarkMind/2025/可行性分析/python/pyQt.py"

# file_path = "/Users/bergman/my2024/X/oh-my-project/技术/我的编辑器_MarkMind/2025/可行性分析/python/pyside.py"


# char_count = count_effective_chars(file_path)
# print(f"有效字符数（扣除注释和空白）：{char_count}")


if __name__ == "__main__":
    if len(sys.argv) > 1:
        file_path = sys.argv[1]
        count = count_effective_chars(file_path)
        print(count)