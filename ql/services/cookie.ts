import { Service, Inject } from 'typedi';
import winston from 'winston';
import fetch from 'node-fetch';
import { getFileContentByName } from '../config/util';
import config from '../config';
import * as fs from 'fs';
import got from 'got';
import DataStore from 'nedb';
import { Cookie, CookieStatus, initCookiePosition } from '../data/cookie';

@Service()
export default class CookieService {
  private gCookies: string = '';
  private s_token: string = '';
  private guid: string = '';
  private lsid: string = '';
  private lstoken: string = '';
  private okl_token: string = '';
  private token: string = '';
  private cronDb = new DataStore({ filename: config.cookieDbFile });
  constructor(@Inject('logger') private logger: winston.Logger) {
    this.cronDb.loadDatabase((err) => {
      if (err) throw err;
    });
  }

  public async getCookies() {
    const content = getFileContentByName(config.cookieFile);
    return this.formatCookie(content.split('\n').filter((x) => !!x));
  }

  public async getQrUrl(): Promise<{ qrurl: string }> {
    await this.step1();
    const qrurl = await this.step2();
    return { qrurl };
  }

  private async step1() {
    try {
      let timeStamp = new Date().getTime();
      let url =
        'https://plogin.m.jd.com/cgi-bin/mm/new_login_entrance?lang=chs&appid=300&returnurl=https://wq.jd.com/passport/LoginRedirect?state=' +
        timeStamp +
        '&returnurl=https://home.m.jd.com/myJd/newhome.action?sceneval=2&ufc=&/myJd/home.action&source=wq_passport';
      const text = await fetch(url, {
        method: 'get',
        headers: {
          Connection: 'Keep-Alive',
          'Content-Type': 'application/x-www-form-urlencoded',
          Accept: 'application/json, text/plain, */*',
          'Accept-Language': 'zh-cn',
          Referer:
          'https://plogin.m.jd.com/login/login?appid=300&returnurl=https://wq.jd.com/passport/LoginRedirect?state=' +
          timeStamp +
          '&returnurl=https://home.m.jd.com/myJd/newhome.action?sceneval=2&ufc=&/myJd/home.action&source=wq_passport',
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/86.0.4240.111 Safari/537.36',
          Host: 'plogin.m.jd.com',
        },
      });
      await this.praseSetCookies(text);
    } catch (error) {
      this.logger.error(error);
    }
  }

  private async step2() {
    try {
      if (this.gCookies == '') {
        return '';
      }
      let timeStamp = new Date().getTime();
      let url =
        'https://plogin.m.jd.com/cgi-bin/m/tmauthreflogurl?s_token=' +
        this.s_token +
        '&v=' +
        timeStamp +
        '&remember=true';
      const response: any = await fetch(url, {
        method: 'post',
        body: JSON.stringify({
          lang: 'chs',
          appid: 300,
          returnurl:
          'https://wqlogin2.jd.com/passport/LoginRedirect?state=' +
          timeStamp +
          '&returnurl=//home.m.jd.com/myJd/newhome.action?sceneval=2&ufc=&/myJd/home.action',
          source: 'wq_passport',
        }),
        headers: {
          Connection: 'Keep-Alive',
          'Content-Type': 'application/x-www-form-urlencoded; Charset=UTF-8',
          Accept: 'application/json, text/plain, */*',
          Cookie: this.gCookies,
          Referer:
          'https://plogin.m.jd.com/login/login?appid=300&returnurl=https://wqlogin2.jd.com/passport/LoginRedirect?state=' +
          timeStamp +
          '&returnurl=//home.m.jd.com/myJd/newhome.action?sceneval=2&ufc=&/myJd/home.action&source=wq_passport',
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/86.0.4240.111 Safari/537.36',
          Host: 'plogin.m.jd.com',
        },
      });
      const body = await response.json();
      this.token = body.token;
      const setCookies = response.headers.get('set-cookie');
      this.okl_token = setCookies.match(/okl_token=(.+?);/)[1];
      var qrUrl =
        'https://plogin.m.jd.com/cgi-bin/m/tmauth?appid=300&client_type=m&token=' +
        this.token;
      return qrUrl;
    } catch (error) {
      console.log(error.response.body);
      return '';
    }
  }

  private async praseSetCookies(response: any) {
    const body = await response.json();
    this.s_token = body.s_token;
    const setCookies = response.headers.get('set-cookie');
    this.guid = setCookies.match(/guid=(.+?);/)[1];
    this.lsid = setCookies.match(/lsid=(.+?);/)[1];
    this.lstoken = setCookies.match(/lstoken=(.+?);/)[1];
    this.gCookies =
      'guid=' +
      this.guid +
      '; lang=chs; lsid=' +
      this.lsid +
      '; lstoken=' +
      this.lstoken +
      '; ';
  }

  private getCookie(response: any) {
    const setCookies = response.headers['set-cookie'];
    var TrackerID = setCookies[0].match(/TrackerID=(.+?);/)[1];
    var pt_key = setCookies[1].match(/pt_key=(.+?);/)[1];
    var pt_pin = setCookies[2].match(/pt_pin=(.+?);/)[1];
    var pt_token = setCookies[3].match(/pt_token=(.+?);/)[1];
    var pwdt_id = setCookies[4].match(/pwdt_id=(.+?);/)[1];
    var s_key = setCookies[5].match(/s_key=(.+?);/)[1];
    var s_pin = setCookies[6].match(/s_pin=(.+?);/)[1];
    this.gCookies =
      'TrackerID=' +
      TrackerID +
      '; pt_key=' +
      pt_key +
      '; pt_pin=' +
      pt_pin +
      '; pt_token=' +
      pt_token +
      '; pwdt_id=' +
      pwdt_id +
      '; s_key=' +
      s_key +
      '; s_pin=' +
      s_pin +
      '; wq_skey=';
    var userCookie = 'pt_key=' + pt_key + ';pt_pin=' + pt_pin + ';';
    return userCookie;
  }

  public async addQrCookie(cookie: string) {
    const res: any = await this.checkLogin();
    if (res.body.errcode === 0) {
      let ucookie = this.getCookie(res);
      let pin = ucookie.split(";")[1]

      const cookieList = await this.cookies();

      const index = cookieList.map(item => item.value.split(";")[1]).findIndex((x) => x === pin)

      if (index !== -1) {
        let item = cookieList[index]
        item.value = ucookie
        await this.update(item)
      } else {
        let cookieAttr = []
        cookieAttr.push(ucookie)
        await this.create(cookieAttr)
      }
      return { cookie: ucookie }
    } else {
      return res.body;
    }
  }

  public async addCookie(cookies: string[]) {
    let content = getFileContentByName(config.cookieFile);
    const originCookies = content.split('\n').filter((x) => !!x);
    const result = originCookies.concat(cookies);
    fs.writeFileSync(config.cookieFile, result.join('\n'));
    return '';
  }

  public async updateCookie({ cookie, oldCookie }) {
    let content = getFileContentByName(config.cookieFile);
    const cookies = content.split('\n');
    const index = cookies.findIndex((x) => x === oldCookie);
    if (index !== -1) {
      cookies[index] = cookie;
      fs.writeFileSync(config.cookieFile, cookies.join('\n'));
      return '';
    } else {
      return '未找到要原有Cookie';
    }
  }

  public async deleteCookie(cookie: string) {
    let content = getFileContentByName(config.cookieFile);
    const cookies = content.split('\n');
    const index = cookies.findIndex((x) => x === cookie);
    if (index !== -1) {
      cookies.splice(index, 1);
      fs.writeFileSync(config.cookieFile, cookies.join('\n'));
      return '';
    } else {
      return '未找到要删除的Cookie';
    }
  }

  private async checkLogin() {
    try {
      if (this.gCookies == '') {
        return '';
      }
      let timeStamp = new Date().getTime();
      let url =
        'https://plogin.m.jd.com/cgi-bin/m/tmauthchecktoken?&token=' +
        this.token +
        '&ou_state=0&okl_token=' +
        this.okl_token;
      return got.post(url, {
        responseType: 'json',
        form: {
          lang: 'chs',
          appid: 300,
          returnurl:
            'https://wqlogin2.jd.com/passport/LoginRedirect?state=1100399130787&returnurl=//home.m.jd.com/myJd/newhome.action?sceneval=2&ufc=&/myJd/home.action',
          source: 'wq_passport',
        },
        headers: {
          Referer:
            'https://plogin.m.jd.com/login/login?appid=300&returnurl=https://wqlogin2.jd.com/passport/LoginRedirect?state=' +
            timeStamp +
            '&returnurl=//home.m.jd.com/myJd/newhome.action?sceneval=2&ufc=&/myJd/home.action&source=wq_passport',
          Cookie: this.gCookies,
          Connection: 'Keep-Alive',
          'Content-Type': 'application/x-www-form-urlencoded; Charset=UTF-8',
          Accept: 'application/json, text/plain, */*',
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/86.0.4240.111 Safari/537.36',
        },
      });
    } catch (error) {
      console.log(error);
      let res: any = {};
      res.body = { check_ip: 0, errcode: 222, message: '出错' };
      res.headers = {};
      return res;
    }
  }

  private async formatCookie(data: any[]) {
    const result = [];
    for (const x of data) {
      const { nickname, status } = await this.getJdInfo(x);
      if (/pt_pin=(.+?);/.test(x)) {
        result.push({
          pin: x.match(/pt_pin=(.+?);/)[1],
          cookie: x,
          status,
          nickname: nickname,
        });
      } else {
        result.push({
          pin: 'pin未匹配到',
          cookie: x,
          status,
          nickname: nickname,
        });
      }
    }
    return result;
  }

  public async refreshCookie(_id: string) {
    const current = await this.get(_id);
    const { status, nickname } = await this.getJdInfo(current.value);
    return {
      ...current,
      status,
      nickname,
    };
  }

  private getJdInfo(cookie: string) {
    return fetch(
      `https://me-api.jd.com/user_new/info/GetJDUserInfoUnion?orgFlag=JD_PinGou_New&callSource=mainorder&channel=4&isHomewhite=0&sceneval=2&_=${Date.now()}&sceneval=2&g_login_type=1&g_ty=ls`,
      {
        method: 'get',
        headers: {
          Accept: '*/*',
          'Accept-Encoding': 'gzip, deflate, br',
          'Accept-Language': 'zh-cn',
          Connection: 'keep-alive',
          Cookie: cookie,
          Referer: 'https://home.m.jd.com/myJd/newhome.action',
          'User-Agent':
            'Mozilla/5.0 (iPhone; CPU iPhone OS 14_4_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0.3 Mobile/15E148 Safari/604.1',
          Host: 'me-api.jd.com',
        },
      },
    )
      .then((x) => x.json())
      .then((x) => {
        if (x.retcode === '0' && x.data && x.data.userInfo) {
          return {
            nickname: x.data.userInfo.baseInfo.nickname,
            status: CookieStatus.normal,
          };
        } else if (x.retcode === 13) {
          return { status: CookieStatus.invalid, nickname: '-' };
        }
        return { status: CookieStatus.abnormal, nickname: '-' };
      });
  }

  public async create(payload: string[]): Promise<Cookie[]> {
    const cookies = await this.cookies('');
    let position = initCookiePosition;
    if (cookies && cookies.length > 0) {
      position = cookies[cookies.length - 1].position;
    }
    const tabs = payload.map((x) => {
      const cookie = new Cookie({ value: x, position });
      position = position / 2;
      cookie.position = position;
      return cookie;
    });
    const docs = await this.insert(tabs);
    await this.set_cookies();
    return docs;
  }

  public async insert(payload: Cookie[]): Promise<Cookie[]> {
    return new Promise((resolve) => {
      this.cronDb.insert(payload, (err, docs) => {
        if (err) {
          this.logger.error(err);
        } else {
          resolve(docs);
        }
      });
    });
  }

  public async update(payload: Cookie): Promise<Cookie> {
    const { _id, ...other } = payload;
    const doc = await this.get(_id);
    const tab = new Cookie({ ...doc, ...other });
    const newDoc = await this.updateDb(tab);
    await this.set_cookies();
    return newDoc;
  }

  public async updateDb(payload: Cookie): Promise<Cookie> {
    return new Promise((resolve) => {
      this.cronDb.update(
        { _id: payload._id },
        payload,
        { returnUpdatedDocs: true },
        (err, docs) => {
          if (err) {
            this.logger.error(err);
          } else {
            resolve(docs as Cookie);
          }
        },
      );
    });
  }

  public async remove(_id: string) {
    this.cronDb.remove({ _id }, {});
    await this.set_cookies();
  }

  public async move(
    _id: string,
    {
      fromIndex,
      toIndex,
    }: {
      fromIndex: number;
      toIndex: number;
    },
  ) {
    let targetPosition: number;
    const isUpward = fromIndex > toIndex;
    const cookies = await this.cookies();
    if (toIndex === 0 || toIndex === cookies.length - 1) {
      targetPosition = isUpward
        ? cookies[0].position * 2
        : cookies[toIndex].position / 2;
    } else {
      targetPosition = isUpward
        ? (cookies[toIndex].position + cookies[toIndex - 1].position) / 2
        : (cookies[toIndex].position + cookies[toIndex + 1].position) / 2;
    }
    this.update({
      _id,
      position: targetPosition,
    });
    await this.set_cookies();
  }

  public async cookies(
    searchText?: string,
    sort: any = { position: -1 },
  ): Promise<Cookie[]> {
    let query = {};
    if (searchText) {
      const reg = new RegExp(searchText);
      query = {
        $or: [
          {
            name: reg,
          },
          {
            command: reg,
          },
        ],
      };
    }
    return new Promise((resolve) => {
      this.cronDb
        .find(query)
        .sort({ ...sort })
        .exec((err, docs) => {
          resolve(docs);
        });
    });
  }

  public async get(_id: string): Promise<Cookie> {
    return new Promise((resolve) => {
      this.cronDb.find({ _id }).exec((err, docs) => {
        resolve(docs[0]);
      });
    });
  }

  public async getBySort(sort: any): Promise<Cookie> {
    return new Promise((resolve) => {
      this.cronDb
        .find({})
        .sort({ ...sort })
        .limit(1)
        .exec((err, docs) => {
          resolve(docs[0]);
        });
    });
  }

  public async disabled(_id: string) {
    this.cronDb.update({ _id }, { $set: { status: CookieStatus.disabled } });
    await this.set_cookies();
  }

  public async enabled(_id: string) {
    this.cronDb.update({ _id }, { $set: { status: CookieStatus.noacquired } });
  }

  private async set_cookies() {
    const cookies = await this.cookies();
    let cookie_string = '';
    cookies.forEach((tab) => {
      if (tab.status !== CookieStatus.disabled) {
        cookie_string += tab.value;
        cookie_string += '\n';
      }
    });
    fs.writeFileSync(config.cookieFile, cookie_string);
  }
}
