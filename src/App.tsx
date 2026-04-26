export function App() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 flex flex-col">
      <main className="flex-1 p-6">
        <h1 className="text-2xl font-medium">AnniFilter</h1>
        <p className="text-sm text-slate-400 mt-1">
          Filter editor for the Diablo 2 mod Annihilus.
        </p>
        <div className="mt-8 inline-block px-4 py-1 bg-black border-y border-amber-500/30">
          <span className="font-avqest text-amber-200 text-base tracking-wide">
            Ohm Rune
          </span>
        </div>
      </main>
      <footer className="text-[10px] text-slate-600 px-6 py-3 border-t border-slate-900">
        Item label font:{' '}
        <a
          href="https://www.1001fonts.com/avqest-font.html"
          className="hover:text-slate-400"
        >
          AvQest
        </a>{' '}
        by Graham Meade / 1001Fonts.
      </footer>
    </div>
  )
}
