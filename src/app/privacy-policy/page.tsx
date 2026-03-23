import { readFile } from "fs/promises";
import path from "path";

export const metadata = {
    title: "Privacy Policy | Vouch",
};

export default async function PrivacyPolicyPage() {
    let policyText = "Privacy policy is currently unavailable.";

    try {
        const policyPath = path.join(process.cwd(), "privacy-policy.md");
        policyText = await readFile(policyPath, "utf8");
    } catch (error) {
        console.error("Failed to load privacy policy:", error);
    }

    return (
        <main style={{ minHeight: "100dvh", background: "#020617", color: "#f8fafc", padding: "40px 20px" }}>
            <div style={{ maxWidth: "920px", margin: "0 auto" }}>
                <h1 style={{ fontSize: "28px", marginBottom: "16px" }}>Privacy Policy</h1>
                <p style={{ color: "#94a3b8", marginBottom: "20px" }}>
                    This page reflects the current contents of <code>privacy-policy.md</code>.
                </p>
                <article
                    style={{
                        border: "1px solid #1e293b",
                        background: "#0f172a",
                        borderRadius: "8px",
                        padding: "20px",
                        overflowX: "auto",
                    }}
                >
                    <pre
                        style={{
                            margin: 0,
                            whiteSpace: "pre-wrap",
                            lineHeight: 1.6,
                            fontSize: "14px",
                            fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, Liberation Mono, Courier New, monospace",
                        }}
                    >
                        {policyText}
                    </pre>
                </article>
            </div>
        </main>
    );
}
