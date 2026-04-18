const OPEN_APP_SIGN_IN_URL = "vouch://sign-in";
const DEFAULT_WEBSITE_URL = "https://tas.tarunh.com";

function getWebsiteUrl(): string {
    return (process.env.NEXT_PUBLIC_APP_URL || DEFAULT_WEBSITE_URL).trim().replace(/\/+$/, "");
}

export default function EmailConfirmedPage() {
    const websiteUrl = getWebsiteUrl();

    return (
        <main
            style={{
                minHeight: "100vh",
                maxWidth: 720,
                margin: "0 auto",
                padding: "40px 20px",
                fontFamily: "Arial, sans-serif",
                lineHeight: 1.5,
                color: "#111827",
                backgroundColor: "#ffffff",
            }}
        >
            <h1 style={{ margin: 0, fontSize: 28 }}>Your email has been verified</h1>
            <p style={{ marginTop: 16, marginBottom: 24, fontSize: 18 }}>
                Thanks for confirming your email. You can continue in the app or on the website.
            </p>
            <p style={{ margin: "8px 0", fontSize: 18 }}>
                <a href={OPEN_APP_SIGN_IN_URL} style={{ color: "#0b5fff", textDecoration: "underline" }}>
                    Open the app
                </a>
            </p>
            <p style={{ margin: "8px 0", fontSize: 18 }}>
                <a href={websiteUrl} style={{ color: "#0b5fff", textDecoration: "underline" }}>
                    Open the website
                </a>
            </p>
        </main>
    );
}
