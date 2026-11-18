export interface DistrictAdvisoryInfo {
  district: string;
  affectedRoad: string;
  closureReason: string;
  alternateRoute: {
    name: string;
    description: string;
    passableFor: string;
    extraTime: string;
    mapRouteId?: string;
  };
  fieldPost: string;
  helpline: string;
}

export const DISTRICT_ADVISORIES: Record<string, DistrictAdvisoryInfo> = {
  Ramban: {
    district: "Ramban",
    affectedRoad: "NH-44 Panthyal - Ramsu Corridor (Km 142 - Km 148)",
    closureReason: "Massive debris and shooting stones blocking both carriageways near Panthyal tunnel approach.",
    alternateRoute: {
      name: "Mughal Road Corridor (Shopian - Bafliaz - Rajouri Bypass)",
      description: "Divert south toward Jammu/Poonch corridor, traverse Mughal Road across Peer Ki Gali (3,485m) into Shopian & Kashmir Valley.",
      passableFor: "Light Motor Vehicles (LMVs) & Emergency Supply Convoys Only",
      extraTime: "+2.5 hrs transit delay",
      mapRouteId: "ALT-PANTHYAL-01",
    },
    fieldPost: "Panthyal Tunnel Approach Quick Response Base",
    helpline: "+91-94191-88421",
  },
  Udhampur: {
    district: "Udhampur",
    affectedRoad: "NH-44 Samroli to Chenani-Nashri Approach",
    closureReason: "Heavy mudflow and road shoulder instability following continuous mountain downpour.",
    alternateRoute: {
      name: "Dhar Road Scenic Detour (Udhampur - Battal Ballian - Majalta)",
      description: "Take Dhar Road east towards Battal Ballian bypassing congested national highway bottleneck.",
      passableFor: "All civilian, passenger cars and standard 2-axle supply trucks",
      extraTime: "+45 mins transit delay",
      mapRouteId: "ALT-UDHAMPUR-01",
    },
    fieldPost: "Samroli / Chenani Quick Response Post",
    helpline: "+91-94191-23001",
  },
  Doda: {
    district: "Doda",
    affectedRoad: "NH-244 Batote - Khellani - Thathri River Corridor",
    closureReason: "Chenab River level surge submerging lower road embankment near Thathri.",
    alternateRoute: {
      name: "Batote - Premnagar - Kishtwar Higher Ridge Alignment",
      description: "Traverse high ridge rural alignment bypassing lower riverbank flooding.",
      passableFor: "LMVs and 4x4 high-clearance utility vehicles only",
      extraTime: "+1.5 hrs transit delay",
      mapRouteId: "ALT-KISHTWAR-02",
    },
    fieldPost: "Thathri Bridge Checkpost Base",
    helpline: "+91-96229-45120",
  },
  Kishtwar: {
    district: "Kishtwar",
    affectedRoad: "Sinthan Top Pass (NH-244 High Altitude Section)",
    closureReason: "Sudden blizzard, ice formation and rock slides on crest descent.",
    alternateRoute: {
      name: "Kishtwar - Doda - Batote Valley Road Axis",
      description: "Turn southwest along Chenab valley road to rejoin Jammu-Srinagar corridor via Banihal.",
      passableFor: "All standard vehicles (Daylight travel recommended)",
      extraTime: "+3.0 hrs transit delay",
      mapRouteId: "ALT-KISHTWAR-02",
    },
    fieldPost: "Paddar / Sinthan Top Base",
    helpline: "+91-94192-33445",
  },
  Shopian: {
    district: "Shopian",
    affectedRoad: "Mughal Road Peer Ki Gali Sector",
    closureReason: "Substantial rockfall from upper crags blocking both lanes near Dubjan sentinel.",
    alternateRoute: {
      name: "NH-44 Main Axis via Navyug Qazigund Tunnel",
      description: "Divert east via Pulwama / Anantnag to access the 8.45km twin-tube Navyug Tunnel corridor.",
      passableFor: "All heavy and light vehicular traffic (24/7 all-weather corridor)",
      extraTime: "+1.0 hr transit delay",
      mapRouteId: "RD-OPEN-004",
    },
    fieldPost: "Dubjan / Peer Ki Gali Sentinel Post",
    helpline: "+91-97971-66230",
  },
  Jammu: {
    district: "Jammu",
    affectedRoad: "Nagrota Bypass (NH-44 Approach)",
    closureReason: "Traffic congestion and safety diversion due to upstream mountain closures.",
    alternateRoute: {
      name: "Old Jammu - Udhampur Circular Road",
      description: "Use Old Heritage alignment via Jhajjar Kotli for local commuter traffic.",
      passableFor: "Light civilian vehicles only",
      extraTime: "+35 mins transit delay",
    },
    fieldPost: "Nagrota Toll Sentinel",
    helpline: "+91-191-2542000",
  },
  Srinagar: {
    district: "Srinagar",
    affectedRoad: "Pantha Chowk Bypass Corridor",
    closureReason: "Precautionary traffic regulation during heavy valley precipitation.",
    alternateRoute: {
      name: "Lasjan - Nowgam Outer Ring Road",
      description: "Divert traffic through outer ring bypass avoiding city center bottleneck.",
      passableFor: "All vehicles",
      extraTime: "+20 mins transit delay",
    },
    fieldPost: "Pantha Chowk Command Post",
    helpline: "+91-194-2452000",
  },
};

export function getAlternateRouteForDistrict(district: string): DistrictAdvisoryInfo {
  return (
    DISTRICT_ADVISORIES[district] || {
      district: district || "Jammu & Kashmir",
      affectedRoad: `${district} Regional Highway Corridor`,
      closureReason: "Debris clearance and slope stabilization operations under emergency management.",
      alternateRoute: {
        name: "Designated DDMA District Alternate Route",
        description: "Follow on-ground police pilot vehicles and traffic signs for approved local bypass.",
        passableFor: "Emergency and light vehicles",
        extraTime: "+45 mins transit delay",
      },
      fieldPost: `${district} Disaster Response Base`,
      helpline: "112 (Emergency National Helpline)",
    }
  );
}
