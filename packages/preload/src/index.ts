import { ipcRenderer as ipc } from "electron-better-ipc"
// import Store from "electron-store";
import { contextBridge } from "electron"
// import $ from "jquery";
import type { Result } from "ytsr"
import type { IpcRendererEvent } from "electron/renderer"
import type { videoInfo } from "ytdl-core"
import Store from "electron-store"
import createElectronStorage from "redux-persist-electron-storage"
export type ElectronAPI = typeof api;

const electronStore = new Store({
  name: "store",
  watch: true,
})
const electronStorage = createElectronStorage({ electronStore })





declare global {
  // interface DocumentEventMap {
  //   "music-change": CustomEvent<SongJSON[]>;
  //   "download-progress": CustomEvent<{ raw: unknown & { targetSize: number }, msg: `${number}kb downloaded`, dlInfo: unknown }>;
  //   "download-end": CustomEvent<{ path: string, dlInfo: unknown }>;
  // }
}





const api = {
  windowControl: (e: "minimize" | "maximize" | "close") => {
    ipc.send("windowCmd", e)
  },
  music: {
    openLocation: async (path: string) => {
      ipc.callMain("open-location", path)
    },
    saveSong: async (song: SongJSON) => {
      ipc.callMain("music-save", song)
    },
    saveSongs: async (songs: SongJSON[]) => {
      ipc.callMain("music-save-all", songs)
    },
    removeSong: async (...args: [path: string, title: string]) => {
      return await ipc.callMain("music-remove", args)
    },
    getSongs: async () => { return await ipc.callMain("music-get", "songs") as SongJSON[] },
    addSong: async (url: string): Promise<SongJSON> => { return await ipc.callMain("music-add", url) },
    openInEditor: () => { electronStore.openInEditor() },
    getLastSong: async () => { return await ipc.callMain("music-get", "lastSong") as SongJSON },
    setLastSong: async (song: SongJSON): Promise<void> => { return await ipc.callMain("music-set", ["lastSong", song]) },
    getVideoInfo: async (url: string): Promise<videoInfo> => { return await ipc.callMain("video-info", url) },
    searchSongs: async (query: string): Promise<Result> => {
      if (query.length <= 0) throw new Error("Query is empty")
      return await ipc.callMain("music-search", query) as Result
    },
  },
  listeners: {
    onMusicChange: (handler: (e: IpcRendererEvent, songs: SongJSON[]) => void) => ipc.on("music-change", handler),
    onDownloadProgress: (handler: (e: IpcRendererEvent, download: {
      raw: ffmpegProgress;
      msg: `${number}kb downloaded`;
      dlInfo: DownloadInfo
    }) => void) => ipc.on("download-progress", handler),
    onDownloadEnd: (handler: (event: IpcRendererEvent, download: { path: string, dlInfo: DownloadInfo }) => void) => ipc.on("download-end", handler),
  },
  misc: {
    openURL: (url: string) => {
      ipc.callMain("open-url", url)
    },
    toggleAutoLaunch: async () => {
      return await ipc.callMain("toggle-auto-launch")
    },
  },
  store: electronStore,
  electronStorage,
}

contextBridge.exposeInMainWorld(
  "electron",
  api,
)
// window.electron = api