import backgroundMapUrl from "../assets/world-map-background.jpg";

export function InteractiveWorldMap() {
  return <img className="world-map-artwork" src={backgroundMapUrl} alt="" aria-hidden="true" />;
}
