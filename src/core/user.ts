import axios from 'axios'
import { generate as generateQRCode } from 'qrcode-terminal'
type GetLoginUrlResult = {
  url: string
  oauthKey: string
}
type LoginInfo = {
  url: string
  refresh_token: string
  timestamp: number
}
type CheckLoginStatusResult =
  | {
      status: false
      data: number
      message: string
    }
  | {
      status: true
      ts: number
      data: LoginInfo
    }
export class User {
  private isLogin_: boolean = false
  get isLogin() {
    return this.isLogin_
  }
  private info_: LoginInfo | undefined

  private async getLoginUrl() {
    return (
      await axios.get('http://passport.bilibili.com/qrcode/getLoginUrl', {
        responseType: 'json'
      })
    ).data.data as GetLoginUrlResult
  }

  private async showQR(loginUrl: string) {
    generateQRCode(
      loginUrl,
      {
        small: true
      },
      (qrcode: string) => {
        console.log(qrcode)
      }
    )
  }

  private checkLoginStatus(oauthKey: string): Promise<LoginInfo> {
    return new Promise((resolve, reject) => {
      let scanFlag = false,
        confirmFlag = false
      const checkScanInterval = setInterval(async () => {
        const status = (
          await axios.post(
            'http://passport.bilibili.com/qrcode/getLoginInfo',
            { oauthKey: oauthKey },
            {
              headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
              },
              responseType: 'json'
            }
          )
        ).data as CheckLoginStatusResult
        if (!status.status) {
          if (!scanFlag)
            if (status.data === -5) {
              console.log('请在手机上确认登录。')
              scanFlag = true
            } else if (status.data != -4) reject(status)
        } else {
          confirmFlag = true
          clearInterval(checkScanInterval)
          resolve(status.data)
        }
      }, 1000)
    })
  }

  public async login() {
    const { url, oauthKey } = await this.getLoginUrl()
    await this.showQR(url)
    this.info_ = await this.checkLoginStatus(oauthKey)
  }
}
