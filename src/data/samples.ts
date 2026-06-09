// Sample damage photos with honest matching metadata, for the intake demo.
// Each sample's details genuinely describe its photo — picking one in intake
// pre-fills the matching scenario so a recorded demo runs cleanly.

export type SamplePhoto = {
  id: string;
  src: string;
  label: string;
  vehicle: { year: number; make: string; model: string; trim: string; acv: number };
  accident: { location: string; description: string };
};

export const samplePhotos: SamplePhoto[] = [
  {
    id: "side-impact",
    src: "/damage/door-side.jpg",
    label: "Side impact — door & fender",
    vehicle: { year: 2014, make: "Ford", model: "Focus", trim: "SE", acv: 8500 },
    accident: {
      location: "Newark, NJ (Market St)",
      description:
        "Side-impact collision at intersection. Driver-side doors and front fender struck; driver-side window shattered. Vehicle drivable.",
    },
  },
  {
    id: "front-collision",
    src: "/damage/maxima-front.jpg",
    label: "Front-corner collision",
    vehicle: { year: 2015, make: "Nissan", model: "Maxima", trim: "SV", acv: 11000 },
    accident: {
      location: "Brooklyn, NY (Atlantic Ave)",
      description:
        "T-bone at intersection — struck on front-right while turning. Front bumper and passenger-side doors damaged. Vehicle drivable.",
    },
  },
  {
    id: "mirror",
    src: "/damage/mirror-bmw.jpg",
    label: "Mirror — minor / fast-track",
    vehicle: { year: 2018, make: "Toyota", model: "Camry", trim: "SE", acv: 14200 },
    accident: {
      location: "Queens, NY (parking lot)",
      description:
        "Driver-side mirror struck and shattered by passing vehicle in parking lot. Other driver left insurance info.",
    },
  },
  {
    id: "severe-front",
    src: "/damage/generic-crash.jpg",
    label: "Severe front-end / possible total loss",
    vehicle: { year: 2016, make: "Nissan", model: "Sentra", trim: "SV", acv: 9500 },
    accident: {
      location: "Long Island, NY (Sunrise Hwy)",
      description:
        "Front-end collision with tree after swerving to avoid a deer. Front of vehicle crushed, windshield damaged. Vehicle towed.",
    },
  },
];
