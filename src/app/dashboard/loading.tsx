export default function DashboardLoading() {
    return (
        <div className="max-w-4xl mx-auto px-4 md:px-0 py-8">
            <div className="animate-pulse space-y-4">
                <div className="h-8 w-48 rounded bg-slate-800/80" />
                <div className="h-4 w-72 rounded bg-slate-900/80" />
                <div className="mt-8 space-y-3">
                    <div className="h-16 rounded bg-slate-900/70" />
                    <div className="h-16 rounded bg-slate-900/70" />
                    <div className="h-16 rounded bg-slate-900/70" />
                </div>
            </div>
        </div>
    );
}
