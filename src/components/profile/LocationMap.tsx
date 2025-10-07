interface LocationMapProps {
  city?: string;
}

export const LocationMap = ({ city }: LocationMapProps) => {
  return (
    <div className="w-full h-64 rounded-lg overflow-hidden border border-border bg-muted flex items-center justify-center">
      <div className="text-center space-y-2">
        <p className="text-sm text-muted-foreground font-medium">Location Map</p>
        <p className="text-xs text-muted-foreground">Coming soon</p>
        {city && <p className="text-xs text-muted-foreground mt-1">{city}</p>}
      </div>
    </div>
  );
};