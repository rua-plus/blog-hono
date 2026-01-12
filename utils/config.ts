import { formatErrorMessage } from "../utils/db.ts";

export function handleError(error: unknown, context: string): never {
  const errorMessage = formatErrorMessage(error, context);
  console.error(errorMessage);
  throw new Error(errorMessage);
}

export function parseConfigFile(path: string) {
  // Read configuration from config.json
  let configFile: string;
  try {
    configFile = Deno.readTextFileSync(
      new URL(path, import.meta.url),
    );
  } catch (error: unknown) {
    handleError(error, "reading config.json");
  }

  // Define configuration types
  interface Config {
    postgresql: {
      host: string;
      port: number;
      database: string;
      user: string;
      password: string;
    };
  }

  try {
    const config = JSON.parse(configFile);
    return config;
  } catch (error: unknown) {
    handleError(error, "parsing config.json");
  }
}
