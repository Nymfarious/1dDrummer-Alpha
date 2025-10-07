interface LocationMapProps {
  city: string;
}

export const LocationMap = ({ city }: LocationMapProps) => {
  return (
    <div className="w-full h-64 rounded-lg overflow-hidden border border-border bg-muted flex items-center justify-center relative">
      <div className="text-center">
        <div className="w-4 h-4 bg-red-500 rounded-full mx-auto mb-2"></div>
        <p className="text-sm text-muted-foreground">{city}</p>
        <p className="text-xs text-muted-foreground mt-1">Map placeholder - Coming soon</p>
      </div>
    </div>
  );
};
