import { useUIStore } from '@/store/uiStore'
import { TopBar } from './TopBar'
import { RuleList } from './RuleList'
import { RuleDetail } from './RuleDetail'
import { RawEditor } from './RawEditor'
import { JumpToIndexOverlay } from './JumpToIndexOverlay'

export function AppShell() {
  const activeTab = useUIStore((s) => s.activeTab)

  return (
    <div className="min-h-screen h-screen flex flex-col bg-[#0a0a0f] text-slate-200">
      <TopBar />

      <div className="flex flex-1 overflow-hidden">
        <RuleList />

        <main className="flex-1 overflow-y-auto bg-[#0b0d10]">
          {activeTab === 'visual' && <RuleDetail />}
          {activeTab === 'raw' && <RawEditor />}
        </main>
      </div>

      <footer className="text-[10px] text-slate-600 px-4 py-1.5 border-t border-[#1d2128] bg-[#0e1014]">
        Item label font: AvQest by Graham Meade / GemFonts (1998).{' '}
        <a
          href="https://github.com/j-a-dev/AnniFilter#license"
          target="_blank"
          rel="noopener noreferrer"
          className="underline hover:text-slate-400"
        >
          Licensing notes
        </a>
        .
      </footer>

      <JumpToIndexOverlay />
    </div>
  )
}
