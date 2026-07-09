import { redirect } from "next/navigation";

/** La page d'accueil EST la page des patchs (structure du site d'origine). */
export default function PatchsPage() {
  redirect("/");
}
