export interface TaskTitleOverlaySegment {
    className: string;
    style?: {
        color?: string;
    };
}

export function shouldRenderTaskTitleOverlay(
    title: string,
    segments: TaskTitleOverlaySegment[],
    completionSuffix?: string
): boolean {
    if (!title) return false;
    if (completionSuffix) return true;

    return segments.some((segment) => segment.className !== "text-white" || Boolean(segment.style?.color));
}
