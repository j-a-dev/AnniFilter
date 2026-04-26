import { useCallback } from 'react'
import { useFilterStore } from '@/store/filterStore'

const hasFileSystemAccess =
  typeof window !== 'undefined' &&
  'showOpenFilePicker' in window &&
  'showSaveFilePicker' in window

let currentFileHandle: FileSystemFileHandle | null = null

const FILTER_FILE_PICKER_OPTS = {
  types: [
    {
      description: 'Annihilus Filter Files',
      accept: { 'text/plain': ['.filter'] },
    },
  ],
}

type FilePickerWindow = Window & {
  showOpenFilePicker: (opts: unknown) => Promise<FileSystemFileHandle[]>
  showSaveFilePicker: (opts: unknown) => Promise<FileSystemFileHandle>
}

export function useFileOperations() {
  const { loadFromText, toText, setFilePath, setDirty, filePath } =
    useFilterStore()

  const openFile = useCallback(async () => {
    if (hasFileSystemAccess) {
      try {
        const [fileHandle] = await (
          window as unknown as FilePickerWindow
        ).showOpenFilePicker(FILTER_FILE_PICKER_OPTS)
        if (!fileHandle) return
        const file = await fileHandle.getFile()
        const text = await file.text()
        loadFromText(text)
        setFilePath(file.name)
        currentFileHandle = fileHandle
      } catch {
        // user cancelled
      }
    } else {
      const input = document.createElement('input')
      input.type = 'file'
      input.accept = '.filter'
      input.onchange = async () => {
        const file = input.files?.[0]
        if (!file) return
        const text = await file.text()
        loadFromText(text)
        setFilePath(file.name)
        currentFileHandle = null
      }
      input.click()
    }
  }, [loadFromText, setFilePath])

  const saveFileAs = useCallback(async () => {
    const text = toText()
    if (hasFileSystemAccess) {
      try {
        const handle = await (
          window as unknown as FilePickerWindow
        ).showSaveFilePicker({
          suggestedName: filePath ?? 'my-filter.filter',
          ...FILTER_FILE_PICKER_OPTS,
        })
        const writable = await handle.createWritable()
        await writable.write(text)
        await writable.close()
        setDirty(false)
        setFilePath(handle.name)
        currentFileHandle = handle
      } catch {
        // user cancelled
      }
    } else {
      const blob = new Blob([text], { type: 'text/plain' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filePath ?? 'my-filter.filter'
      a.click()
      URL.revokeObjectURL(url)
      setDirty(false)
    }
  }, [toText, filePath, setDirty, setFilePath])

  const saveFile = useCallback(async () => {
    if (currentFileHandle && hasFileSystemAccess) {
      try {
        const text = toText()
        const writable = await currentFileHandle.createWritable()
        await writable.write(text)
        await writable.close()
        setDirty(false)
        return
      } catch {
        currentFileHandle = null
      }
    }
    await saveFileAs()
  }, [toText, setDirty, saveFileAs])

  const clearFileHandle = useCallback(() => {
    currentFileHandle = null
  }, [])

  const loadFromDrop = useCallback(
    async (file: File) => {
      const text = await file.text()
      loadFromText(text)
      setFilePath(file.name)
      currentFileHandle = null
    },
    [loadFromText, setFilePath],
  )

  return { openFile, saveFile, saveFileAs, clearFileHandle, loadFromDrop }
}
