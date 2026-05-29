import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { VehicleDetailClient } from "./client";

export default async function VehicleDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const dbUser = await prisma.user.findUnique({ where: { email: user.email! } });
  if (!dbUser || !["ADMIN", "SUPERVISOR"].includes(dbUser.role)) redirect("/dashboard");

  const [vehicle, drivers, centers, checklists, tickets] = await Promise.all([
    prisma.vehicle.findUnique({ where: { id }, include: { driver: true, workCenter: true } }),
    prisma.user.findMany({ where: { role: "DRIVER", isActive: true }, orderBy: { name: "asc" } }),
    prisma.workCenter.findMany({ orderBy: { name: "asc" } }),
    prisma.checklist.findMany({ where: { vehicleId: id }, orderBy: { createdAt: "desc" }, take: 10 }),
    prisma.maintenanceTicket.findMany({ where: { vehicleId: id }, orderBy: { createdAt: "desc" }, take: 10 }),
  ]);

  if (!vehicle) redirect("/vehiculos");

  return (
    <VehicleDetailClient
      vehicle={JSON.parse(JSON.stringify(vehicle))}
      drivers={JSON.parse(JSON.stringify(drivers))}
      centers={JSON.parse(JSON.stringify(centers))}
      checklists={JSON.parse(JSON.stringify(checklists))}
      tickets={JSON.parse(JSON.stringify(tickets))}
    />
  );
}
