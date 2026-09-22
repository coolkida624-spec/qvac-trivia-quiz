// QVAC Trivia Quiz — original fact catalog (not copied from any
// external trivia database; written for this app).

export const FACTS = [
  { id: 1, topic: "space", fact: "A day on Venus is longer than a year on Venus." },
  { id: 2, topic: "space", fact: "Neutron stars can spin at over 600 rotations per second." },
  { id: 3, topic: "space", fact: "Saturn's moon Titan has lakes made of liquid methane." },
  { id: 4, topic: "biology", fact: "Octopuses have three hearts and blue blood." },
  { id: 5, topic: "biology", fact: "A group of flamingos is called a flamboyance." },
  { id: 6, topic: "biology", fact: "Sea otters hold hands while sleeping so they don't drift apart." },
  { id: 7, topic: "history", fact: "The Great Fire of London in 1666 reportedly killed very few people." },
  { id: 8, topic: "history", fact: "Oxford University is older than the Aztec Empire." },
  { id: 9, topic: "history", fact: "The first computer programmer, Ada Lovelace, worked in the 1840s." },
  { id: 10, topic: "geography", fact: "Russia spans eleven time zones." },
  { id: 11, topic: "geography", fact: "Africa is the only continent that lies in all four hemispheres." },
  { id: 12, topic: "geography", fact: "The Dead Sea is so salty that people float on its surface easily." },
  { id: 13, topic: "technology", fact: "The first computer mouse was carved out of wood." },
  { id: 14, topic: "technology", fact: "The first message ever sent over the internet crashed the system after two letters." },
  { id: 15, topic: "food", fact: "Honey found in ancient tombs is still technically edible thousands of years later." },
  { id: 16, topic: "food", fact: "Carrots were originally purple before orange varieties became common." },
];

export function randomFact(excludeIds = []) {
  const pool = FACTS.filter((f) => !excludeIds.includes(f.id));
  const source = pool.length > 0 ? pool : FACTS;
  return source[Math.floor(Math.random() * source.length)];
}
