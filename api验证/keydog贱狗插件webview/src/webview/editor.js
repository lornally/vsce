const vscode = acquireVsCodeApi();
const leftEditor = document.getElementById('left-editor');
const rightEditor = document.getElementById('right-editor');

let saveTimeout;

function handleChange() {
    clearTimeout(saveTimeout);
    saveTimeout = setTimeout(() => {
        vscode.postMessage({
            type: 'update',
            left: leftEditor.value,
            right: rightEditor.value
        });
    }, 500);
}

leftEditor.addEventListener('input', handleChange);
rightEditor.addEventListener('input', handleChange);

// 接收来自扩展的消息
window.addEventListener('message', event => {
    const message = event.data;
    if (message.type === 'setContent') {
        leftEditor.value = message.left || '';
        rightEditor.value = message.right || '';
    }
});
