import Link from "next/link";
import { useAuth } from "@/src/components/Provider/UserProvider";
const LINK_TOKEN = "{link}";

type keyType = "termsOfService" | "privacyPolicy";

export default function Content ({nameKey} : {nameKey: keyType}) {

        const {LENUAGE} = useAuth();
        const doc = LENUAGE.Legal[nameKey];
        const FT = LENUAGE.Footer;

        console.log(LINK_TOKEN)
        const withCrossLink = (text: string) => {

            const idx = text.indexOf(LINK_TOKEN);
            if (idx === -1)
                return text;
            return (
                <>
                    {text.slice(0, idx)}
                        <Link href={`/server/${nameKey === "termsOfService" ? "privacy" : "terms"}`} className="legal-link">
                            {nameKey === "privacyPolicy" ?  FT.terms :  FT.privacy}
                        </Link>
                    {text.slice(idx + LINK_TOKEN.length)}
                </>
            );
        };

    return (
        <>
            <div>
                <span className="legal-eyebrow">Legal</span>
                <h1 className="legal-title">{doc.title}</h1>
                <p className="legal-updated">{doc.updated}</p>
            </div>

            <p className="legal-intro">{doc.intro}</p>

            {doc.sections.map((section, i) => (
                <section className="legal-section" key={i}>
                    <h2 className="legal-heading">{section.heading}</h2>
                    {section.text && (
                        <p className="legal-text">{withCrossLink(section.text)}</p>
                    )}
                    {section.items && (
                        <ul className="legal-list">
                            {section.items.map((item, j) => (
                                <li className="legal-listItem" key={j}>
                                    <span>
                                        {item.label && <strong>{item.label}</strong>}{item.label ? " " : ""}{item.text}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    )}
                </section>
            ))}
        </>
    )
}