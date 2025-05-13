export function generateBookCover(title: string) {
  return new Promise<Blob>((resolve) => {
    // 高清屏适配（参考网页7）
    const [logicalWidth, logicalHeight] = [300, 400];
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    const dpr = window.devicePixelRatio || 1;
    const backingStoreRatio = 1;
    const renderRatio = dpr / backingStoreRatio;

    canvas.width = logicalWidth * renderRatio;
    canvas.height = logicalHeight * renderRatio;
    canvas.style.width = `${logicalWidth}px`;
    canvas.style.height = `${logicalHeight}px`;
    ctx.scale(renderRatio, renderRatio);

    // 随机渐变背景（网页5配色方案）
    const bgColors = [
      { colors: ["#2C3E50", "#3498DB"], elements: 12 },
      { colors: ["#1A2980", "#26D0CE"], elements: 10 },
      { colors: ["#4776E6", "#8E54E9"], elements: 15 }
    ][Math.floor(Math.random() * 3)];

    const gradient = ctx.createLinearGradient(0, 0, logicalWidth, logicalHeight);
    gradient.addColorStop(0, bgColors.colors[0]);
    gradient.addColorStop(1, bgColors.colors[1]);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, logicalWidth, logicalHeight);

    // 装饰元素（缩小尺寸以适应新画布）
    ctx.fillStyle = 'rgba(255,255,255,0.15)';
    for(let i=0; i<bgColors.elements; i++) {
      ctx.beginPath();
      ctx.arc(
        Math.random() * logicalWidth,
        Math.random() * logicalHeight,
        Math.random() * 6 + 3, // 缩小半径范围[3,9]
        0, Math.PI*2
      );
      ctx.fill();
    }

    // 智能文字排版系统（网页9、网页11综合方案）
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'center';
    ctx.shadowColor = 'rgba(0,0,0,0.35)';
    ctx.shadowBlur = 6;

    // 动态字体计算
    let fontSize = Math.min(36, logicalWidth/8);
    let lineHeight, maxLineWidth;
    const minFontSize = 8; // 最小字号限制

    // 智能换行函数（支持中英文分词）
    const wrapText = (text: string, maxWidth: number) => {
      const words = text.split(/([\u4e00-\u9fa5]|[\w'-]+)/g).filter(Boolean);
      const lines = []
      let currentLine = '';

      words.forEach(word => {
        const testLine = currentLine + word;
        const metrics = ctx.measureText(testLine);
        if (metrics.width > maxWidth && currentLine !== '') {
          lines.push(currentLine);
          currentLine = word;
        } else {
          currentLine = testLine;
        }
      });
      lines.push(currentLine);
      return lines;
    };

    // 字号自动调整循环
    do {
      ctx.font = `${fontSize}px 'Source Han Sans CN'`;
      lineHeight = fontSize * (fontSize < 12 ? 1.8 : 1.3);
      maxLineWidth = logicalWidth * 0.85;

      const tempLines = wrapText(title, maxLineWidth);
      if (tempLines.length * lineHeight <= logicalHeight * 0.8) break;
    } while (--fontSize >= minFontSize);

    // 最终换行处理
    const lines = wrapText(title, maxLineWidth);
    const totalHeight = lines.length * lineHeight;
    const startY = (logicalHeight - totalHeight)/2 + lineHeight/2;

    // 文字渲染（抗锯齿处理）
    ctx.imageSmoothingEnabled = true;
    ctx.fillStyle = 'rgba(255,255,255,0.95)';
    lines.forEach((line, i) => {
      ctx.fillText(line, logicalWidth/2, startY + i*lineHeight);
    });

    // 输出优化（网页7推荐方案）
    canvas.toBlob(blob => {
      resolve(blob!);
    }, 'image/jpeg', 0.85);
  });
}
