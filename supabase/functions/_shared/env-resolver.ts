/**
 * Environment Variable Resolver for Supabase Edge Functions
 * 
 * Handles inconsistent naming between Supabase Secrets and code expectations.
 * Maps various alias names to canonical variable names.
 */

interface EnvMapping {
  canonical: string;
  aliases: string[];
  required: boolean;
  description: string;
}

const ENV_MAPPINGS: EnvMapping[] = [
  {
    canonical: "GOOGLE_MAPS_API_KEY",
    aliases: ["Google Maps Platform API", "google_maps_api_key", "GOOGLE_MAPS_KEY"],
    required: false,
    description: "Google Maps JavaScript API key"
  },
  {
    canonical: "OPENAI_API_KEY",
    aliases: ["OpenAI First Key - FTMM", "openai_api_key", "OPENAI_KEY"],
    required: false,
    description: "OpenAI API key for GPT models"
  },
  {
    canonical: "LOVABLE_API_KEY",
    aliases: ["lovable_api_key", "LOVABLE_KEY"],
    required: false,
    description: "Lovable AI Gateway API key"
  },
  {
    canonical: "SUPABASE_URL",
    aliases: ["supabase_url", "VITE_SUPABASE_URL"],
    required: true,
    description: "Supabase project URL"
  },
  {
    canonical: "SUPABASE_ANON_KEY",
    aliases: ["SUPABASE_PUBLISHABLE_KEY", "supabase_anon_key", "Supabase Public Key"],
    required: true,
    description: "Supabase anonymous/publishable key"
  },
  {
    canonical: "SUPABASE_SERVICE_ROLE_KEY",
    aliases: ["SupaBase Secret Key", "sb_secret", "SUPABASE_SECRET_KEY"],
    required: false,
    description: "Supabase service role key (admin access)"
  },
  {
    canonical: "DROPBOX_APP_KEY",
    aliases: ["DropBox App Key", "dropbox_app_key"],
    required: false,
    description: "Dropbox App key"
  },
  {
    canonical: "DROPBOX_APP_SECRET",
    aliases: ["DropBox App Secret", "dropbox_app_secret"],
    required: false,
    description: "Dropbox App secret"
  },
  {
    canonical: "DROPBOX_DEV_TOKEN",
    aliases: ["DROPBOX_DEV_TOKEN"],
    required: false,
    description: "Dropbox development token"
  }
];

interface ResolveResult {
  value: string | undefined;
  foundAs: string | null;
  mapping: EnvMapping;
}

interface ResolveAllResult {
  resolved: Record<string, string>;
  missing: string[];
  warnings: Array<{ canonical: string; foundAs: string }>;
}

/**
 * Resolve a single environment variable by checking canonical name and aliases
 */
export function resolveEnv(canonical: string): ResolveResult {
  const mapping = ENV_MAPPINGS.find(m => m.canonical === canonical);
  
  if (!mapping) {
    return {
      value: Deno.env.get(canonical),
      foundAs: null,
      mapping: {
        canonical,
        aliases: [],
        required: false,
        description: "Unknown variable"
      }
    };
  }

  // Try canonical name first
  let value = Deno.env.get(canonical);
  if (value) {
    return { value, foundAs: canonical, mapping };
  }

  // Try aliases (case-sensitive first)
  for (const alias of mapping.aliases) {
    value = Deno.env.get(alias);
    if (value) {
      return { value, foundAs: alias, mapping };
    }
  }

  // Try case-insensitive matching as last resort
  const allEnvKeys = Object.keys(Deno.env.toObject());
  const lowerCanonical = canonical.toLowerCase();
  
  for (const key of allEnvKeys) {
    if (key.toLowerCase() === lowerCanonical) {
      value = Deno.env.get(key);
      if (value) {
        return { value, foundAs: key, mapping };
      }
    }
  }

  return { value: undefined, foundAs: null, mapping };
}

/**
 * Resolve all mapped environment variables and return report
 */
export function resolveAll(requiredOnly: boolean = false): ResolveAllResult {
  const resolved: Record<string, string> = {};
  const missing: string[] = [];
  const warnings: Array<{ canonical: string; foundAs: string }> = [];

  const mappingsToCheck = requiredOnly 
    ? ENV_MAPPINGS.filter(m => m.required)
    : ENV_MAPPINGS;

  for (const mapping of mappingsToCheck) {
    const result = resolveEnv(mapping.canonical);
    
    if (result.value) {
      resolved[mapping.canonical] = result.value;
      
      // Warn if we're using an alias instead of canonical name
      if (result.foundAs && result.foundAs !== mapping.canonical) {
        warnings.push({
          canonical: mapping.canonical,
          foundAs: result.foundAs
        });
      }
    } else if (mapping.required) {
      missing.push(mapping.canonical);
    }
  }

  return { resolved, missing, warnings };
}

/**
 * Log environment resolution report
 */
export function logEnvReport(context: string = "Edge Function"): void {
  const report = resolveAll();
  
  console.log(`[${context}] Environment variable resolution:`);
  console.log(`  ✓ Resolved: ${Object.keys(report.resolved).length} variables`);
  
  if (report.warnings.length > 0) {
    console.warn(`  ⚠ Using alias names (consider standardizing):`);
    report.warnings.forEach(w => {
      console.warn(`    ${w.canonical} <- found as "${w.foundAs}"`);
    });
  }
  
  if (report.missing.length > 0) {
    console.error(`  ✗ Missing required variables:`);
    report.missing.forEach(name => {
      const mapping = ENV_MAPPINGS.find(m => m.canonical === name);
      console.error(`    ${name} (${mapping?.description})`);
      if (mapping?.aliases.length) {
        console.error(`      Tried: ${mapping.aliases.join(", ")}`);
      }
    });
  }
}

/**
 * Get environment variable with automatic alias resolution
 * Throws if required variable is missing
 */
export function getEnv(canonical: string, required: boolean = false): string | undefined {
  const result = resolveEnv(canonical);
  
  if (!result.value && required) {
    throw new Error(
      `Required environment variable ${canonical} not found. ` +
      `Tried: ${[canonical, ...result.mapping.aliases].join(", ")}`
    );
  }
  
  return result.value;
}
