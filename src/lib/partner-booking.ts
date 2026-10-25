// Which departures a partner may book for a customer: the tour's own joining/leaving dates
// (no launching city) or dates launched from the partner's own city. Never another city's.
export const isBaseDeparture = (d: any) => (d.isBase !== undefined ? Boolean(d.isBase) : !d.launchId);
export const departureCityId = (d: any) => String(d.cityId?._id || d.cityId || "");
export const isMyCityDeparture = (d: any, myCityId?: string) => Boolean(myCityId) && !isBaseDeparture(d) && departureCityId(d) === String(myCityId);
export const partnerCanBook = (d: any, myCityId?: string) => isBaseDeparture(d) || isMyCityDeparture(d, myCityId);
