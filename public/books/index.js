const curUrl = import.meta.url

console.log(curUrl)

const bookUrl = (bookName, suffix = 'txt') => new URL(`./${bookName}.${suffix}`, curUrl).href
const coverUrl = (name) => new URL(`./covers/${name}.jpeg`, curUrl).href

export const books = [
  {
    id: '1',
    cover: coverUrl('wzzj'),
    title: '万族之劫',
    author: '老鹰吃小鸡',
    downloadUrl: bookUrl('万族之劫')
  },
  {
    id: '2',
    cover: coverUrl('qqgw'),
    title: '全球高武',
    author: '老鹰吃小鸡',
    downloadUrl: bookUrl('全球高武')
  },
  {
    id: '3',
    cover: coverUrl('zt'),
    title: '遮天',
    author: '辰东',
    downloadUrl: bookUrl('遮天')
  },
  {
    id: '4',
    cover: coverUrl('wmsj'),
    title: '完美世界',
    author: '辰东',
    downloadUrl: bookUrl('完美世界')
  },
  {
    id: '5',
    cover: coverUrl('dfdgr'),
    title: '大奉打更人',
    author: '卖报小郎君',
    downloadUrl: bookUrl('大奉打更人')
  },
  {
    id: '6',
    cover: coverUrl('gmzz'),
    title: '诡秘之主',
    author: '爱潜水的乌贼',
    downloadUrl: bookUrl('诡秘之主')
  },
  {
    id: '7',
    cover: coverUrl('sm'),
    title: '神墓',
    author: '辰东',
    downloadUrl: bookUrl('神墓')
  },
  {
    id: '9',
    cover: coverUrl('nocover'),
    title: '佛本是道',
    author: '梦入神机',
    downloadUrl: bookUrl('佛本是道')
  },
  {
    id: '10',
    cover: coverUrl('wsxsztwjl'),
    title: '我师兄实在太稳健了',
    author: '言归正传',
    downloadUrl: bookUrl('我师兄实在太稳健了')
  },
  {
    id: '11',
    cover: coverUrl('xzltq'),
    title: '修真聊天群',
    author: '圣骑士的传说',
    downloadUrl: bookUrl('修真聊天群')
  },
  {
    id: '12',
    cover: coverUrl('msj'),
    title: '牧神记',
    author: '宅猪',
    downloadUrl: bookUrl('牧神记')
  },
  {
    id: '13',
    cover: coverUrl('wxkb'),
    title: '无限恐怖',
    author: 'zhttty',
    downloadUrl: bookUrl('无限恐怖'),
    tocRegList: [
      /^(上半部|下半部)/,
      /^第[一二三四五六七八九十零百千万亿]+[集]\s*[：:·\-—]?\s*(.+)$/,
      /^第[一二三四五六七八九十零百千万亿\d]+[章]\s*[：:·\-—]?\s*(.+)$/,
    ]
  },
  {
    id: '14',
    cover: coverUrl('asjct'),
    title: '傲世九重天',
    author: '风凌天下',
    downloadUrl: bookUrl('傲世九重天'),
    tocRegList: [
      /^第[一二三四五六七八九十]部\s/,
      /^第[一二三四五六七八九十零百千万亿\d]+[章]\s*[：:·\-—]?\s*(.+)$/,
    ]
  },
  {
    id: '15',
    cover: coverUrl('st'),
    title: '三体(全集)',
    author: '刘慈欣',
    downloadUrl: bookUrl('【精】三体（全集）', 'epub')
  },
  {
    id: '16',
    cover: coverUrl('tsxk'),
    title: '吞噬星空',
    author: '我吃西红柿',
    downloadUrl: bookUrl('吞噬星空'),
    tocRegList: [
      /^第.{1,5}篇\s/,
      /^第[一二三四五六七八九十零百千万亿\d]+[章]\s*[：:·\-—]?\s*(.+)$/
    ]
  }
]
