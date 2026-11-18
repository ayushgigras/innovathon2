export interface FieldOfficerContact {
  district: string;
  officerName: string;
  rank: string;
  unit: string;
  phone: string;
  radioFrequency: string;
  locationBase: string;
  currentStatus: "on_patrol" | "en_route" | "at_scene" | "standing_by";
  distanceKm: number;
}

export const AREA_FIELD_OFFICERS: Record<string, FieldOfficerContact> = {
  Udhampur: {
    district: "Udhampur",
    officerName: "Officer R. Katoch",
    rank: "Assistant Sub-Inspector / Highway Patrol Lead",
    unit: "Patrol Unit 2 (Chenani-Udhampur Corridor)",
    phone: "+91-94191-23001",
    radioFrequency: "VHF-UDH-CH4 (154.250 MHz)",
    locationBase: "Samroli / Chenani Quick Response Post",
    currentStatus: "on_patrol",
    distanceKm: 2.1,
  },
  Ramban: {
    district: "Ramban",
    officerName: "Officer S. Manhas",
    rank: "Sub-Inspector / Disaster Response Lead",
    unit: "Patrol Unit 4 (Panthyal-Ramban NH-44 Sector)",
    phone: "+91-94191-88421",
    radioFrequency: "VHF-RMB-CH9 (155.125 MHz)",
    locationBase: "Panthyal Tunnel Approach Post",
    currentStatus: "on_patrol",
    distanceKm: 3.4,
  },
  Doda: {
    district: "Doda",
    officerName: "Officer K. Sharma",
    rank: "Station House Officer / Riverfront Sentinel",
    unit: "Chenab River & Valley Patrol Unit 1",
    phone: "+91-96229-45120",
    radioFrequency: "VHF-DOD-CH2 (152.875 MHz)",
    locationBase: "Thathri Bridge Checkpost",
    currentStatus: "on_patrol",
    distanceKm: 1.8,
  },
  Kishtwar: {
    district: "Kishtwar",
    officerName: "Officer M. Rathore",
    rank: "Mountain Rescue Unit Commander",
    unit: "High-Altitude Response Team 1",
    phone: "+91-94192-33445",
    radioFrequency: "VHF-KST-CH3 (153.400 MHz)",
    locationBase: "Paddar / Sinthan Top Base",
    currentStatus: "on_patrol",
    distanceKm: 4.2,
  },
  Shopian: {
    district: "Shopian",
    officerName: "Officer T. Mir",
    rank: "Mughal Road Surveillance Lead",
    unit: "Peer Ki Gali Mountain Patrol Unit 3",
    phone: "+91-97971-66230",
    radioFrequency: "VHF-SHP-CH7 (154.800 MHz)",
    locationBase: "Dubjan / Peer Ki Gali Sentinel Post",
    currentStatus: "on_patrol",
    distanceKm: 2.7,
  },
  Jammu: {
    district: "Jammu",
    officerName: "Officer V. Singh",
    rank: "Inspector / DDMA Emergency Wing",
    unit: "Jammu City & Bypass Response Unit",
    phone: "+91-94190-11223",
    radioFrequency: "VHF-JMU-CH1 (151.200 MHz)",
    locationBase: "Nagrota Toll Checkpost",
    currentStatus: "on_patrol",
    distanceKm: 1.5,
  },
  Srinagar: {
    district: "Srinagar",
    officerName: "Officer A. Lone",
    rank: "Flood & Highway Response In-charge",
    unit: "Jhelum Basin Surveillance Unit 5",
    phone: "+91-94194-55667",
    radioFrequency: "VHF-SXR-CH5 (156.000 MHz)",
    locationBase: "Pantha Chowk Response Base",
    currentStatus: "on_patrol",
    distanceKm: 3.1,
  },
  Anantnag: {
    district: "Anantnag",
    officerName: "Officer G. Bhat",
    rank: "Tunnel Security & Patrol Inspector",
    unit: "Navyug Tunnel & Qazigund Patrol 2",
    phone: "+91-94197-22334",
    radioFrequency: "VHF-ANG-CH8 (155.650 MHz)",
    locationBase: "Qazigund Emergency Control Point",
    currentStatus: "on_patrol",
    distanceKm: 2.9,
  },
  Reasi: {
    district: "Reasi",
    officerName: "Officer D. Chib",
    rank: "Chenab Gorge Security Commander",
    unit: "Chenab Bridge & Katra Sector Unit",
    phone: "+91-94193-77889",
    radioFrequency: "VHF-RSI-CH6 (153.950 MHz)",
    locationBase: "Bakkal / Kauri Approach Post",
    currentStatus: "on_patrol",
    distanceKm: 2.2,
  },
  Poonch: {
    district: "Poonch",
    officerName: "Officer Z. Khan",
    rank: "Border Corridor & Hill Patrol Lead",
    unit: "Mughal Road Southern Patrol 1",
    phone: "+91-94195-99001",
    radioFrequency: "VHF-PCH-CH4 (152.100 MHz)",
    locationBase: "Surankote / Bafliaz Post",
    currentStatus: "on_patrol",
    distanceKm: 3.8,
  },
  Rajouri: {
    district: "Rajouri",
    officerName: "Officer P. Raina",
    rank: "Disaster Quick Response Lead",
    unit: "Rajouri Sector Mountain Patrol",
    phone: "+91-94196-88112",
    radioFrequency: "VHF-RJR-CH3 (154.550 MHz)",
    locationBase: "Thanamandi Response Point",
    currentStatus: "on_patrol",
    distanceKm: 4.5,
  },
};

/**
 * Retrieve designated Field Officer for a specific district
 */
export function getFieldOfficerForDistrict(districtName: string): FieldOfficerContact {
  const norm = (districtName || "").trim();
  const matchKey = Object.keys(AREA_FIELD_OFFICERS).find(
    (k) => k.toLowerCase() === norm.toLowerCase()
  );

  if (matchKey && AREA_FIELD_OFFICERS[matchKey]) {
    return AREA_FIELD_OFFICERS[matchKey]!;
  }

  // Fallback generic response unit
  return {
    district: districtName || "District Sector",
    officerName: `Officer ${districtName || "Field"} Patrol Lead`,
    rank: "Patrol Inspector / DDMA Quick Response",
    unit: `${districtName || "Area"} Mobile Sentinel Unit`,
    phone: "+91-94190-00112",
    radioFrequency: "VHF-DDMA-TAC1",
    locationBase: `${districtName || "District"} EOC Field Post`,
    currentStatus: "on_patrol",
    distanceKm: 2.5,
  };
}
