const COLORS = [
  '#000000', // 黑色
  '#333333', // 深灰
  '#666666', // 中灰
  '#999999', // 浅灰
  '#CCCCCC', // 更浅灰
  '#000000', // 黑色
  '#1A1A1A', // 深黑
  '#4D4D4D', // 中深灰
  '#808080', // 中等灰
  '#B3B3B3', // 浅灰
];

export function generateAvatarUrl(name: string): string {
  const initial = name[0].toUpperCase();
  
  const colorIndex = Array.from(name).reduce(
    (acc, char) => acc + char.charCodeAt(0), 0
  ) % COLORS.length;
  
  const backgroundColor = COLORS[colorIndex];
  
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
      <rect width="100" height="100" fill="${backgroundColor}"/>
      <text 
        x="50%" 
        y="50%" 
        fill="white" 
        font-family="system-ui, -apple-system, sans-serif" 
        font-size="45" 
        font-weight="500"
        text-anchor="middle"
        alignment-baseline="central"
        dominant-baseline="central"
        style="text-transform: uppercase"
      >
        ${initial}
      </text>
    </svg>
  `.trim();

  const encoder = new TextEncoder();
  const bytes = encoder.encode(svg);
  const base64 = Buffer.from(bytes).toString('base64');
  
  return `data:image/svg+xml;base64,${base64}`;
} 