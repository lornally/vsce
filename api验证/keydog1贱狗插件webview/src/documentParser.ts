export function parseDocument(content: string) {
    const LEFT_MARKER = '# -----昭-----';   // 改为您的格式
    const RIGHT_MARKER = '# -----穆------';  // 改为您的格式
    
    const rightIndex = content.indexOf(RIGHT_MARKER);
    const leftIndex = content.indexOf(LEFT_MARKER);
    
    if (rightIndex === -1 || leftIndex === -1) {
        return { header: content, leftContent: '', rightContent: '' };
    }
    
    return {
        header: content.substring(0, rightIndex).trim(),
        rightContent: content.substring(rightIndex + RIGHT_MARKER.length, leftIndex).trim(),
        leftContent: content.substring(leftIndex + LEFT_MARKER.length).trim()
    };
}

