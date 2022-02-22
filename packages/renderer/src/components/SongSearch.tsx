import { Icon } from "@iconify/react"
import {
  InputWrapper,
  Group,
  Input,
  Button,
  Image,
  Text,
  Collapse,
  ActionIcon,
  Center,
  Loader,
  ScrollArea,
  Tooltip,
  Anchor,
} from "@mantine/core"
import type { ReactElement } from "react"
import React, { ChangeEvent } from "react"
import throttle from "lodash.throttle"
import type { Playlist, Video } from "ytsr"
import ytsr from "ytsr"
import { useBooleanToggle } from "@mantine/hooks"
import type { MoreVideoDetails, videoInfo } from "ytdl-core"
import { useAppDispatch, useAppSelector } from "../store"
import { addSong } from "../store/slices/songs"

type Results = Video[] | videoInfo[] | Playlist[]

export default function SongSearch(): ReactElement {
  const [search, setSearch] = React.useState("")
  const [songResults, setResults] = React.useState<Results>([])
  const [loading, toggleLoading] = useBooleanToggle(false)

  const addSongFromUrl = (url?: string) => {
    if (url) window.electron.music.addSong(url)
    else window.electron.music.addSong(search)
  }

  const searchSongs = throttle(
    async () => {
      if (search.length === 0) {
        toggleLoading(false)
        return
      }
      if (search.match(/(?<=(https?:\/\/|youtube\.com))/g)) {
        const video = await window.electron.music.getVideoInfo(search)
        setResults([video])
        return
      }
      try {
        const results = await window.electron.music.searchSongs(search)
        setResults(
          results?.items.filter((res) => res.type === "video" || res.type === "playlist") as Video[] | Playlist[],
        )
      } catch (e) {
        console.error(e)
      }
      toggleLoading(false)
    },
    500,
    { trailing: true },
  )

  React.useEffect(() => {
    toggleLoading(true)
    searchSongs()
  }, [search])

  const currentMood = useAppSelector((state) => state.currentSong.mood)
  const dispatch = useAppDispatch()
  return (
    <div className="rounded-xl transition-all border-2 w-full border-green-500 overflow-hidden">
      <InputWrapper className="w-full top-0 bg-base-200 p-4" label="Add a Video:" style={{ height: "33%" }}>
        <Group className="w-full" direction="row">
          <Input
            icon={<Icon icon="fas:music-note" />}
            id="add-song"
            value={search}
            onKeyPress={(e) => {
              if (e.key === " ") {
                e.stopPropagation()
                // e.preventDefault()
              }
            }}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
              e.preventDefault()
              e.stopPropagation()
              setSearch(e.target.value)
            }}
            placeholder="Search or Enter URL..."
            className="flex-grow"
            rightSectionWidth={36}
            rightSection={
              search.length > 0 && (
                <ActionIcon radius="xl" onClick={(e) => setSearch("")}>
                  <Icon icon="fas:xmark" />
                </ActionIcon>
              )
            }
          />
          <Button variant="filled" disabled={!search.startsWith("https://")} onClick={() => addSongFromUrl()}>
            Add
          </Button>
        </Group>
      </InputWrapper>
      <ScrollArea
        type="hover"
        style={{
          display: search.length === 0 ? "none" : undefined,
          height: 250,
          scrollBehavior: "smooth",
        }}>
        <div>
          {loading ? (
            <Center className="h-24">
              <Loader variant="bars" />
            </Center>
          ) : (
            <Group direction="column" spacing={1}>
              {songResults.length === 1 &&
                (songResults as videoInfo[]).map((result: videoInfo) => (
                  <ResultView
                    type="direct"
                    key={result.videoDetails.videoId}
                    result={result}
                    onAdd={(result) => {
                      console.log("added song: ", result)
                      dispatch(addSong({ ...result, mood: [currentMood] }))
                    }}
                  />
                ))}
              {songResults.length > 1 &&
                (songResults as Video[] | Playlist[]).map((result: Video | Playlist) => (
                  <ResultView
                    type="search"
                    key={result.url}
                    result={result}
                    onAdd={(result) => {
                      console.log("added song: ", result)
                      dispatch(addSong({ ...result, mood: [currentMood] }))
                    }}
                  />
                ))}
            </Group>
          )}
        </div>
      </ScrollArea>
    </div>
  )
}

type ResultViewProps = {
  type: "direct" | "search"
  result: Video | Playlist | videoInfo
  onAdd: (result: SongJSON) => void
}

function ResultView({ type, result, onAdd }: ResultViewProps): ReactElement {
  // const [opened, open] = useBooleanToggle(false)
  const [hovering, setHover] = useBooleanToggle(false)
  const res = type === "direct" ? (result as videoInfo).videoDetails : (result as Video | Playlist)
  const imgSrc =
    type === "direct"
      ? (res as videoInfo["videoDetails"])?.thumbnails[0]?.url
      : (res as Video)?.bestThumbnail?.url || (res as Playlist)?.firstVideo?.bestThumbnail.url
  const title = res.title
  const channel =
    type === "direct"
      ? (res as videoInfo["videoDetails"]).author?.name
      : (res as Video).author?.name || (res as Playlist)?.owner?.name
  const url = type === "direct" ? (res as MoreVideoDetails).video_url : (result as Video | Playlist).url

  const tooltip = (
    <div className="">
      <Button onClick={(e) => window.electron.misc.openURL(url)}>Video URL</Button>
    </div>
  )
  return (
    <div
      className="flex flex-col p-2  hover:bg-neutral-focus transition-all w-full -z-0"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}>
      <div className="flex flex-row transition-all h-16 w-full items-center ">
        <Tooltip allowPointerEvents label={tooltip} delay={500}>
          <div className="h-16 min-w-32">
            <img src={imgSrc} className="h-full aspect-video rounded-lg" />
          </div>
        </Tooltip>
        <div className="inline-flex  flex-col p-2 truncate max-w-sm">
          <div className="text-lg">{title}</div>
          <div className="text-sm">{channel}</div>
        </div>
        <div className="flex-grow" />
        <ActionIcon
          mr="10px"
          variant="filled"
          onClick={
            ((e) => {
              result = result as Video | Playlist
              e.stopPropagation()
              e.preventDefault()
              if (result && result !== null)
                window.electron.music
                  .addSong(result.type === "video" ? result.url : result.firstVideo?.url)
                  .then((addedInfo) => {
                    onAdd(addedInfo)
                  })
            }) as React.MouseEventHandler<HTMLButtonElement>
          }>
          <Icon icon="fas:download" />
        </ActionIcon>
      </div>
    </div>
  )
}
