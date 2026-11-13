export type EnumOption = readonly [value: string, label: string];

export const FACULTY_OPTIONS: readonly EnumOption[] = [
  ["education", "Education"],
  ["psychology", "Psychology"],
  ["dentistry", "Dentistry"],
  ["law", "Law"],
  ["communication-arts", "Communication Arts"],
  ["nursing", "Nursing"],
  ["commerce-and-accountancy", "Commerce and Accountancy"],
  ["medicine", "Medicine"],
  ["pharmaceutical Science", "Pharmaceutical Science"],
  ["political Science", "Political Science"],
  ["science", "Science"],
  ["sport-science", "Sport Science"],
  ["engineering", "Engineering"],
  ["fine-and-applied-arts", "Fine and Applied Arts"],
  ["economics", "Economics"],
  ["architecture", "Architecture"],
  ["allied-health-sciences", "Allied Health Sciences"],
  ["veterinary-science", "Veterinary Science"],
  ["arts", "Arts"],
  ["bascii", "BAScii"],
  ["agricultural-resources", "Agricultural Resources"],
  ["graduate-school", "Graduate School"],
  ["population-studies", "Population Studies"],
  ["petroleum-and-petrochemical", "Petroleum and Petrochemical"],
  ["public-health-sciences", "Public Health Sciences"],
  ["transportation", "Transportation"],
  ["confucius-institute", "Confucius Institute"],
  ["intellectual-property-institute", "Intellectual Property Institute"],
  ["institute-of-thai-studies", "Institute of Thai Studies"],
  [
    "sasin-graduate-institute-of-business-administration",
    "Sasin Graduate Institute",
  ],
  ["language-institute", "Language Institute"],
  [
    "the-sirindhorn-thai-language-institute",
    "Sirindhorn Thai Language Institute",
  ],
  [
    "aquatic-resources-research-institute",
    "Aquatic Resources Research Institute",
  ],
  [
    "the-institute-of-biotechnology-and-genetic-engineering",
    "Biotechnology & Genetic Engineering",
  ],
  ["energy-research-institute", "Energy Research Institute"],
  [
    "metallurgy-and-materials-science-research-institute",
    "Metallurgy & Materials Science",
  ],
  [
    "sustainable-environment-research-institute",
    "Sustainable Environment Research",
  ],
  ["social-research-institute", "Social Research Institute"],
  ["institute-of-asian-studies", "Institute of Asian Studies"],
];

export const YEAR_OPTIONS: readonly EnumOption[] = [
  ["1", "Year 1"],
  ["2", "Year 2"],
  ["3", "Year 3"],
  ["4", "Year 4"],
  ["5", "Year 5"],
  ["6", "Year 6"],
];

export const GENDER_OPTIONS: readonly EnumOption[] = [
  ["female", "Female"],
  ["male", "Male"],
  ["non-binary", "Non-binary"],
  ["other", "Prefer not to say"],
];

export const RELATIONSHIP_GOAL_OPTIONS: readonly EnumOption[] = [
  ["long-term-partner", "Long-term partner"],
  ["long-term-but-casual-ok", "Long-term, casual OK"],
  ["casual-but-long-term-ok", "Casual, long-term OK"],
  ["casual-fun", "Casual fun"],
  ["new-friends", "New friends"],
  ["still-figuring-it-out", "Still figuring it out"],
];

export const ONBOARDED_OPTIONS: readonly EnumOption[] = [
  ["onboarded", "Onboarded"],
  ["not-onboarded", "Not onboarded"],
];

export const PAUSED_OPTIONS: readonly EnumOption[] = [
  ["active", "Active"],
  ["paused", "Paused now"],
];

export const VALUE_OPTIONS: readonly EnumOption[] = [
  ["honesty-and-trust", "Honesty & Trust"],
  ["self-growth", "Self-Growth"],
  ["having-fun", "Having Fun"],
  ["physical-affection", "Physical Affection"],
  ["independence-and-balance", "Independence & Balance"],
  ["meaningful-conversation", "Meaningful Conversation"],
  ["emotional-support-and-empathy", "Emotional Support & Empathy"],
];

export const INTEREST_OPTIONS: readonly EnumOption[] = [
  ["music-pop", "Music: Pop"],
  ["music-tpop", "Music: T-Pop"],
  ["music-kpop", "Music: K-Pop"],
  ["music-jpop", "Music: J-Pop"],
  ["music-indie", "Music: Indie"],
  ["music-rock", "Music: Rock"],
  ["music-hiphop", "Music: Hip-Hop"],
  ["music-rap", "Music: Rap"],
  ["music-rnb", "Music: R&B"],
  ["music-jazz", "Music: Jazz"],
  ["music-classical", "Music: Classical"],
  ["music-edm", "Music: EDM"],
  ["movies-anime", "Movies: Anime"],
  ["movies-kdrama", "Movies: K-Drama"],
  ["movies-thai-series", "Movies: Thai Series"],
  ["movies-netflix", "Movies: Netflix"],
  ["movies-marvel-dc", "Movies: Marvel / DC"],
  ["movies-action", "Movies: Action"],
  ["movies-horror", "Movies: Horror"],
  ["movies-romcom", "Movies: Rom-com"],
  ["movies-romance", "Movies: Romance"],
  ["movies-indie", "Movies: Indie"],
  ["movies-award", "Movies: Award winning"],
  ["movies-documentary", "Movies: Documentaries"],
  ["movies-scifi", "Movies: Sci-fi"],
  ["reading-fiction", "Reading: Fiction"],
  ["reading-nonfiction", "Reading: Non-fiction"],
  ["reading-manga", "Reading: Manga / Manhwa"],
  ["reading-webtoon", "Reading: Webtoons"],
  ["reading-poetry", "Reading: Poetry"],
  ["reading-selfhelp", "Reading: Self-help"],
  ["reading-fantasy", "Reading: Fantasy"],
  ["reading-biography", "Reading: Biographies"],
  ["reading-mystery", "Reading: Mystery"],
  ["reading-horror", "Reading: Horror"],
  ["sports-running", "Sports: Running"],
  ["sports-gym", "Sports: Gym"],
  ["sports-football", "Sports: Football"],
  ["sports-basketball", "Sports: Basketball"],
  ["sports-badminton", "Sports: Badminton"],
  ["sports-tennis", "Sports: Tennis"],
  ["sports-muaythai", "Sports: Muay Thai"],
  ["sports-pilates", "Sports: Pilates"],
  ["sports-swimming", "Sports: Swimming"],
  ["sports-cycling", "Sports: Cycling"],
  ["sports-climbing", "Sports: Climbing"],
  ["sports-hyrox", "Sports: Hyrox"],
  ["sports-golf", "Sports: Golf"],
  ["sports-rugby", "Sports: Rugby"],
  ["sports-hockey", "Sports: Hockey"],
  ["sports-volleyball", "Sports: Volleyball"],
  ["creativity-photography", "Creativity: Photography"],
  ["creativity-drawing", "Creativity: Drawing / Painting"],
  ["creativity-design", "Creativity: Design"],
  ["creativity-writing", "Creativity: Writing"],
  ["creativity-music", "Creativity: Making music"],
  ["creativity-crafts", "Creativity: Crafts / DIY"],
  ["creativity-dancing", "Creativity: Dancing"],
  ["creativity-singing", "Creativity: Singing"],
  ["creativity-fashion", "Creativity: Fashion"],
  ["creativity-content", "Creativity: Content Creation"],
  ["food-coffee", "Food: Coffee / Cafés"],
  ["food-bubbletea", "Food: Bubble tea"],
  ["food-matcha", "Food: Matcha"],
  ["food-streetfood", "Food: Street food"],
  ["food-sushi", "Food: Sushi / Japanese"],
  ["food-kbbq", "Food: Korean BBQ"],
  ["food-hotpot", "Food: Hot pot"],
  ["food-desserts", "Food: Desserts"],
  ["food-cooking", "Food: Cooking"],
  ["food-vegan", "Food: Vegan / Veggie"],
  ["food-cocktails", "Food: Cocktails"],
  ["goingout-bars", "Going Out: Bars"],
  ["goingout-clubbing", "Going Out: Clubbing"],
  ["goingout-concerts", "Going Out: Concerts"],
  ["goingout-nightmarkets", "Going Out: Night markets"],
  ["goingout-roadtrips", "Going Out: Road trips"],
  ["goingout-festivals", "Going Out: Festivals"],
  ["goingout-karaoke", "Going Out: Karaoke"],
  ["goingout-movies", "Going Out: Movies"],
  ["goingout-boardgame", "Going Out: Boardgame"],
  ["goingout-dinner", "Going Out: Dinner"],
  ["goingout-museum", "Going Out: Museum & Galleries"],
  ["goingout-aquariums", "Going Out: Aquariums"],
  ["stayingin-cozy", "Staying In: Cozy nights"],
  ["stayingin-gaming", "Staying In: Gaming"],
  ["stayingin-movienights", "Staying In: Binge watching"],
  ["stayingin-baking", "Staying In: Baking"],
  ["stayingin-journaling", "Staying In: Journaling"],
  ["stayingin-plants", "Staying In: Plants"],
  ["pets-dogs", "Pets: Dogs"],
  ["pets-cats", "Pets: Cats"],
  ["pets-fish", "Pets: Fish / Aquarium"],
  ["pets-small", "Pets: Small pets"],
  ["pets-birds", "Pets: Birds"],
  ["pets-rabbits", "Pets: Rabbits"],
  ["pets-reptiles", "Pets: Reptiles"],
  ["pets-exotic", "Pets: Exotic"],
  ["pets-want", "Pets: Want pets someday"],
  ["track-study", "Track: สายเรียน"],
  ["track-activity", "Track: สายกิจกรรม"],
  ["track-tee", "Track: สายตี้"],
  ["track-chill", "Track: สายชิว"],
];

export type LabelDimension =
  | "faculty"
  | "year"
  | "gender"
  | "relationshipGoal"
  | "ageBand"
  | "interest"
  | "value";

const facultyLabels = new Map(FACULTY_OPTIONS);
const yearLabels = new Map(YEAR_OPTIONS);
const genderLabels = new Map(GENDER_OPTIONS);
const goalLabels = new Map(RELATIONSHIP_GOAL_OPTIONS);
const valueLabels = new Map(VALUE_OPTIONS);
const interestLabels = new Map(INTEREST_OPTIONS);

export function formatInsightLabel(
  dimension: LabelDimension,
  rawKey: string,
): string {
  if (rawKey === "other") return "Other (<5 rolled)";
  if (rawKey === "no-restriction") return "No restrictions (Open Deck)";
  if (rawKey === "unknown") return "Unknown";

  switch (dimension) {
    case "faculty":
      return facultyLabels.get(rawKey) ?? titleCaseSlug(rawKey);
    case "year":
      return yearLabels.get(rawKey) ?? `Year ${rawKey}`;
    case "gender":
      return genderLabels.get(rawKey) ?? titleCaseSlug(rawKey);
    case "relationshipGoal":
      return goalLabels.get(rawKey) ?? titleCaseSlug(rawKey);
    case "ageBand":
      return rawKey === "<18" ? "Under 18" : rawKey;
    case "value":
      return valueLabels.get(rawKey) ?? titleCaseSlug(rawKey);
    case "interest":
      return interestLabels.get(rawKey) ?? titleCaseSlug(rawKey);
  }
}

function titleCaseSlug(value: string): string {
  return value
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
