export default function NewCommitmentLoading() {
    return (
        <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 md:px-0 pb-20 mt-12">
            <div className="space-y-2">
                <div className="h-9 w-64 animate-pulse rounded bg-slate-900/60" />
                <div className="h-4 w-80 animate-pulse rounded bg-slate-900/50" />
            </div>

            <div className="mt-8 grid grid-cols-2 md:grid-cols-3 gap-8">
                <div className="space-y-2">
                    <div className="h-3 w-24 animate-pulse rounded bg-slate-900/50" />
                    <div className="h-12 w-40 animate-pulse rounded bg-slate-900/60" />
                </div>
                <div className="space-y-2">
                    <div className="h-3 w-20 animate-pulse rounded bg-slate-900/50" />
                    <div className="h-12 w-28 animate-pulse rounded bg-slate-900/60" />
                </div>
                <div className="space-y-2">
                    <div className="h-3 w-16 animate-pulse rounded bg-slate-900/50" />
                    <div className="h-12 w-24 animate-pulse rounded bg-slate-900/60" />
                </div>
            </div>

            <div className="mt-8 space-y-4 border-b border-slate-900 pb-8">
                <div className="h-6 w-24 animate-pulse rounded bg-slate-900/60" />
                <div className="h-10 w-full animate-pulse rounded-md bg-slate-900/55" />
                <div className="h-24 w-full animate-pulse rounded-md bg-slate-900/55" />
                <div className="h-10 w-full animate-pulse rounded-md bg-slate-900/55" />
            </div>
        </div>
    );
}
