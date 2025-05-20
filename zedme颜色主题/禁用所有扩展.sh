

# 这破玩意没用, 正解是命令面板和扩展界面的三个点.

echo '#!/bin/bash
# 获取所有已安装的扩展
extensions=$(code --list-extensions)

# 逐个禁用扩展
for ext in $extensions; do
  echo "禁用扩展: $ext"
  code --disable-extension "$ext"
done

# echo "所有扩展已被禁用"' > /tmp/disable_all_extensions.sh && chmod +x /tmp/disable_all_extensions.sh && /tmp/disable_all_extensions.shextensions=$(code --list-extensions)
for ext in $extensions; do
  code --disable-extension "$ext"
done
