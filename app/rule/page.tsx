import type { Metadata } from "next";

import RuleCreationForm from "./RuleCreationForm";

export const metadata: Metadata = {
    title: "Create Rule | SysMind",
};

export default function RulePage() {
    return <RuleCreationForm />;
}
