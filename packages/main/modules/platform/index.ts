import { app } from "electron"
// import { injectable } from 'inversify';
import path from "path"

export enum PlatformNames {
  LINUX = "linux",
  WINDOWS = "win",
  MAC = "mac",
}

/**
 * @see {@link https://github.com/electron-utils/electron-platform}
 */
// @injectable()
class Platform {
  static getPlatform(): string {
    if (process.platform === "win32") {
      return PlatformNames.WINDOWS
    } else if (process.platform === "darwin") {
      return PlatformNames.MAC
    } else {
      return PlatformNames.LINUX
    }
  }

  static isLinux(): boolean {
    return this.getPlatform() === PlatformNames.LINUX
  }

  static isMac(): boolean {
    return process.platform === "darwin"
  }

  static isWindows(): boolean {
    return process.platform === "win32"
  }

  static getBinaryPath(): string {
    return process.env.NODE_ENV === "production" && app.isPackaged ? path.join(path.dirname(app.getAppPath()), "..", "./resources", "./bin") : path.join(__dirname, "../bin", this.getPlatform())
  }
}

export default Platform
