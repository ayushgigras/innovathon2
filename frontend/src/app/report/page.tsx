import { redirect } from "next/navigation";

export default function ReportRedirect(): never {
  redirect("/dashboard/incidents/report");
}
