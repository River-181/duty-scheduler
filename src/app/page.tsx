import { DataProvider } from "@/context/DataContext";
import { AppShell } from "@/components/AppShell";

export default function Home() {
  return (
    <DataProvider>
      <AppShell />
    </DataProvider>
  );
}
