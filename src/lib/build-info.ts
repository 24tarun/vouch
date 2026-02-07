import { execSync } from "node:child_process";

export interface BuildInfo {
    env: string;
    branch: string;
    sha: string;
    subject: string;
    label: string;
}

function normalize(value: string | undefined, fallback: string): string {
    const normalized = value?.trim();
    return normalized ? normalized : fallback;
}

function shortSha(sha: string | undefined): string {
    const normalized = normalize(sha, "unknown");
    return normalized === "unknown" ? normalized : normalized.slice(0, 7);
}

function readLocalGitValue(command: string): string | null {
    try {
        const output = execSync(command, {
            stdio: ["ignore", "pipe", "ignore"],
            encoding: "utf8",
        }).trim();
        return output || null;
    } catch {
        return null;
    }
}

function resolveBuildInfo(): BuildInfo {
    const env = normalize(process.env.VERCEL_ENV || process.env.NODE_ENV, "local");

    const gitBranch = normalize(
        process.env.VERCEL_GIT_COMMIT_REF || readLocalGitValue("git rev-parse --abbrev-ref HEAD") || undefined,
        "unknown"
    );

    const gitSha = shortSha(
        process.env.VERCEL_GIT_COMMIT_SHA || readLocalGitValue("git rev-parse --short HEAD") || undefined
    );

    const commitSubject = normalize(
        process.env.VERCEL_GIT_COMMIT_MESSAGE || readLocalGitValue("git log -1 --pretty=%s") || undefined,
        "unknown"
    );

    const cleanedSubject = commitSubject.replace(/\s+/g, " ").trim() || "unknown";
    const label = `currently on ${env} ${normalize(gitBranch, "unknown")} ${normalize(gitSha, "unknown")} ${cleanedSubject}`;

    return {
        env,
        branch: gitBranch,
        sha: normalize(gitSha, "unknown"),
        subject: cleanedSubject,
        label,
    };
}

const BUILD_INFO = resolveBuildInfo();

export function getBuildInfo(): BuildInfo {
    return BUILD_INFO;
}
