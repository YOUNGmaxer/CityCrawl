const charset = require('superagent-charset');
// 注意使用 superagent 需要搭配 superagent-charset 来处理中文乱码问题！！
const request = charset(require('superagent'));
const cheerio = require('cheerio');
const DbManager = require('./mongo-client');

const Header = {
  Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
  'Accept-Encoding': 'gzip, deflate',
  'Accept-Language': 'zh-CN,zh;q=0.9,en-US;q=0.8,en;q=0.7,zh-TW;q=0.6',
  UserAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_13_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/71.0.3578.98 Safari/537.36'
}
const cities = {
  country: 'CN',
  rows: []
}

async function extractArea(cities) {
  // 2017年国家城乡划分数据来源
  const URL = 'http://www.stats.gov.cn/tjsj/tjbz/tjyqhdmhcxhfdm/2017/index.html';
  
  try {
    const res = await request.get(URL).set(Header).charset('gbk');
    const rows = cities.rows;
    // 指定要解析的文档
    const $ = cheerio.load(res.text);
    let trs = $('.provincetable .provincetr');
    trs.each((i, tr) => {
      tr.childNodes.forEach(td => {
        let a_node = $(td).find('a');
        // 此处过滤空内容的节点
        if (a_node.length) {
          const area = a_node.text();
          const a_href = a_node.attr('href');
          const cities_url = URL.replace('index.html', a_href);
          const row = { area, cities_url };
          // 直辖市不再垂直爬取
          if (area.includes('市')) {
            row.type = '直辖市';
          } else {
            area.includes('自治区') ?
              row.type = '自治区' : row.type = '省';
          }
          rows.push(row);
        }
      });
    });
    console.log(cities);
    return cities;
  } catch(err) {
    console.error(err);
  }
}

async function extractCities(cities) {
  const rows = cities.rows || [];
  for (let i = 0, len = rows.length; i < len; i++) {
    const url = rows[i].cities_url;
    const res = await request.get(url).set(Header).charset('gbk');
    const $ = cheerio.load(res.text);
    const trs = $('.citytable .citytr');
    let _cities = [];
    // 遍历省的城市
    trs.each((i, tr) => {
      let a_node = $(tr).find('a').get(1);
      _cities.push($(a_node).text());
    });
    rows[i].cities = _cities;
  }
}

async function main() {
  const MONGO_URL = 'mongodb://localhost:27017';
  const MONGO_DB = 'sights';

  await extractArea(cities).catch(err => {
    console.log('extractArea', err);
  })
  await extractCities(cities).catch(err => {
    console.error('extractCities', err);
  })
  console.log(cities);
  const dbManager = new DbManager(MONGO_URL, MONGO_DB);
  await dbManager.insert('城市名单', cities);
  await dbManager.close();
}

main();
