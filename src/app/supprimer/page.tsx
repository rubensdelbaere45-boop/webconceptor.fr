import SupprimerForm from "./SupprimerForm";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Suppression définitive — Klyora",
  robots: { index: false, follow: false },
};

export default function SupprimerPage() {
  return <SupprimerForm />;
}
