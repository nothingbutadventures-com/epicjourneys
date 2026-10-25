import User from "@/models/User";
import TourLaunch from "@/models/TourLaunch";
import Tour from "@/models/Tour";

/** The location a partner currently manages. Partner data is owned by this location, not by the person. */
export async function partnerLocation(userId: string): Promise<string | null> {
  const u: any = await User.findById(userId).select("assignedDestination").lean();
  return u?.assignedDestination ? String(u.assignedDestination) : null;
}

/** When a location gets a (new) partner, point its in-flight records at them so they can pick up where the last partner left off. */
export async function rebindLocationPartner(locationId: string, newPartnerId: string) {
  await TourLaunch.updateMany({ cityId: locationId }, { $set: { partnerId: newPartnerId } });
  await Tour.updateMany(
    { "departures.cityId": locationId },
    { $set: { "departures.$[d].partnerId": newPartnerId } },
    { arrayFilters: [{ "d.cityId": locationId, "d.launchId": { $ne: null } }] }
  );
}
