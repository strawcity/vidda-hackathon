export default function Home() {
  return (
    <div className="flex flex-1 flex-col bg-zinc-50 font-sans dark:bg-zinc-950">
      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col justify-center px-6 py-20 sm:px-8 sm:py-28">
        <p className="mb-4 font-mono text-xs uppercase tracking-[0.25em] text-zinc-500 dark:text-zinc-400">
          Vidda hackathon
        </p>
        <h1 className="text-4xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50 sm:text-5xl sm:leading-[1.1]">
          Team{" "}
          <span className="relative inline-block">
            <span className="relative z-10">Trace</span>
            <span
              aria-hidden
              className="absolute -bottom-1 left-0 right-0 h-2 bg-emerald-400/40 dark:bg-emerald-400/25"
            />
          </span>
        </h1>
        <p className="mt-6 max-w-lg text-lg leading-relaxed text-zinc-600 dark:text-zinc-400">
          We are building at the Vidda hackathon — exploring ideas, shipping
          fast, and leaving a clear trail from problem to prototype.
        </p>
        <div className="mt-10 flex flex-wrap items-center gap-4 border-t border-zinc-200 pt-10 dark:border-zinc-800">
          <div className="flex items-center gap-3">
            <span
              className="h-px w-12 bg-zinc-300 dark:bg-zinc-600"
              aria-hidden
            />
            <span className="font-mono text-sm text-zinc-500 dark:text-zinc-400">
              trace → build → demo
            </span>
          </div>
        </div>
      </main>
    </div>
  );
}
