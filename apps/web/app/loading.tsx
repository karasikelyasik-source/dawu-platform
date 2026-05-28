export default function Loading() {
  return (
    <main className="min-h-screen bg-black text-white flex items-center justify-center">
      <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-8 shadow-2xl">
        <div className="flex items-center gap-4">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-zinc-600 border-t-white" />

          <div>
            <div className="text-xl font-bold">Loading</div>
            <div className="text-sm text-zinc-400">Please wait...</div>
          </div>
        </div>
      </div>
    </main>
  );
}